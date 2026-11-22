import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { Subject, of, throwError } from 'rxjs';
import { PermissionService } from './permission.service';
import { HttpController } from './http-controller.service';
import { ControllerService } from './controller.service';
import { Controller } from '@models/controller';

describe('PermissionService', () => {
  let service: PermissionService;
  let mockHttpController: { get: ReturnType<typeof vi.fn> };
  const controller = { id: 1 } as Controller;

  beforeEach(() => {
    mockHttpController = { get: vi.fn() };
    TestBed.configureTestingModule({
      providers: [
        { provide: HttpController, useValue: mockHttpController },
        { provide: ControllerService, useValue: { get: vi.fn(() => Promise.resolve(controller)) } },
      ],
    });
    service = TestBed.inject(PermissionService);
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  /** Lets fetch() reach its subscription before the subject emits. */
  const flushMicrotasks = async () => {
    await Promise.resolve();
    await Promise.resolve();
  };

  const pendingGet = () => {
    const subject = new Subject<{ privileges: string[]; is_superadmin: boolean }>();
    mockHttpController.get.mockImplementation((_controller: Controller, url: string) =>
      url === '/access/users/me' ? of({ username: 'admin' }) : subject,
    );
    return subject;
  };

  /** Calls issued against the privileges endpoint (the /me lookup excluded). */
  const privilegeFetchCount = () =>
    mockHttpController.get.mock.calls.filter((call) => call[1] === '/access/users/me/privileges').length;

  describe('ready', () => {
    it('caches a successful fetch and serves repeat reads from the cache', async () => {
      const subject = pendingGet();
      const promise = service.ready(1);
      await flushMicrotasks();
      subject.next({ privileges: ['Project.Audit'], is_superadmin: false });
      await promise;

      expect(await service.ready(1)).toEqual(new Set(['Project.Audit']));
      expect(privilegeFetchCount()).toBe(1);
      expect(service.cachedPrivileges(1)).toEqual(new Set(['Project.Audit']));
    });

    it('exposes the username of the authenticated user as the session identity', async () => {
      const subject = pendingGet();
      service.activate(1);
      await flushMicrotasks();
      subject.next({ privileges: ['Project.Audit'], is_superadmin: false });
      await flushMicrotasks();

      expect(service.username()).toBe('admin');
    });

    it('degrades to a null username when /me is unavailable, keeping the privileges', async () => {
      const subject = new Subject<{ privileges: string[]; is_superadmin: boolean }>();
      mockHttpController.get.mockImplementation((_controller: Controller, url: string) =>
        url === '/access/users/me' ? throwError(() => new Error('me unavailable')) : subject,
      );
      const promise = service.ready(1);
      await flushMicrotasks();
      subject.next({ privileges: ['Project.Audit'], is_superadmin: false });
      await promise;

      expect(privilegeFetchCount()).toBe(1);
      expect(service.cachedPrivileges(1)).toEqual(new Set(['Project.Audit']));
      expect(service.username()).toBeNull();
    });
  });

  describe('invalidate', () => {
    it('drops the cached privilege sets and the exposed signals', async () => {
      const subject = pendingGet();
      service.activate(1);
      await flushMicrotasks();
      subject.next({ privileges: ['Project.Audit'], is_superadmin: true });
      await flushMicrotasks();

      expect(service.privileges().has('Project.Audit')).toBe(true);
      expect(service.isSuperadmin()).toBe(true);

      service.invalidate();

      expect(service.privileges().size).toBe(0);
      expect(service.isSuperadmin()).toBe(false);
      expect(service.cachedPrivileges(1)).toBeNull();
    });

    it('never caches a late response that resolves after invalidation', async () => {
      const subject = pendingGet();
      const stale = service.ready(1);
      await flushMicrotasks();

      // The session ends (logout / expiry) while the GET is in flight.
      service.invalidate();
      subject.next({ privileges: ['Project.Audit'], is_superadmin: true });
      const privileges = await stale;

      // The stale caller still gets its answer...
      expect(privileges.has('Project.Audit')).toBe(true);
      // ...but the previous user's privileges are neither cached nor exposed.
      expect(service.cachedPrivileges(1)).toBeNull();
      expect(service.privileges().size).toBe(0);
      expect(service.isSuperadmin()).toBe(false);

      // The next session issues a fresh fetch instead of joining the stale one.
      pendingGet();
      void service.ready(1);
      await flushMicrotasks();
      expect(privilegeFetchCount()).toBe(2);
    });

    it('clears the session identity alongside the privilege sets', async () => {
      const subject = pendingGet();
      service.activate(1);
      await flushMicrotasks();
      subject.next({ privileges: ['Project.Audit'], is_superadmin: false });
      await flushMicrotasks();

      expect(service.username()).toBe('admin');

      service.invalidate();

      expect(service.username()).toBeNull();
    });
  });
});
