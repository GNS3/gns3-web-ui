import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ProjectPermissionService } from './project-permission.service';
import { HttpController } from './http-controller.service';
import { Controller } from '@models/controller';

describe('ProjectPermissionService', () => {
  let service: ProjectPermissionService;
  let get: ReturnType<typeof vi.fn>;
  let controller: Controller;

  beforeEach(() => {
    vi.useFakeTimers();
    get = vi.fn();
    controller = { id: 1, username: 'alice' } as Controller;

    TestBed.configureTestingModule({
      providers: [ProjectPermissionService, { provide: HttpController, useValue: { get } }],
    });
    service = TestBed.inject(ProjectPermissionService);
  });

  afterEach(() => {
    service.clear();
    vi.clearAllTimers();
    vi.useRealTimers();
    TestBed.resetTestingModule();
  });

  it('retries a transient privilege-fetch failure instead of latching zero privileges', async () => {
    get
      .mockReturnValueOnce(throwError(() => ({ originalError: { status: 503 } })))
      .mockReturnValueOnce(of({ is_superadmin: false, privileges: ['Project.Modify'] }));

    service.load(controller, 'proj-1');

    // The failed attempt is not treated as an authoritative empty set.
    expect(service.loaded()).toBe(false);
    expect(service.has('Project.Modify')).toBe(false);

    await vi.advanceTimersByTimeAsync(2000);

    expect(get).toHaveBeenCalledTimes(2);
    expect(service.has('Project.Modify')).toBe(true);
    expect(service.loaded()).toBe(true);
  });

  it('does not retry a 403: zero privileges on that path are stable', async () => {
    get.mockReturnValue(throwError(() => ({ originalError: { status: 403 } })));

    service.load(controller, 'proj-1');
    await vi.advanceTimersByTimeAsync(10000);

    expect(get).toHaveBeenCalledTimes(1);
    expect(service.loaded()).toBe(true);
    expect(service.has('Project.Modify')).toBe(false);
  });

  it('gives up after the retry budget and renders zero privileges', async () => {
    get.mockReturnValue(throwError(() => ({ originalError: { status: 500 } })));

    service.load(controller, 'proj-1');
    await vi.advanceTimersByTimeAsync(10000);

    expect(get).toHaveBeenCalledTimes(3);
    expect(service.loaded()).toBe(true);
    expect(service.privileges().size).toBe(0);
  });

  it('cancels a scheduled retry when the project view is left', async () => {
    get.mockReturnValueOnce(throwError(() => ({ originalError: { status: 500 } })));

    service.load(controller, 'proj-1');
    service.clear();
    await vi.advanceTimersByTimeAsync(10000);

    expect(get).toHaveBeenCalledTimes(1);
    expect(service.privileges().size).toBe(0);
    expect(service.loaded()).toBe(false);
  });

  it('loads the same project only once', async () => {
    get.mockReturnValue(of({ is_superadmin: false, privileges: ['Project.Audit'] }));

    service.load(controller, 'proj-1');
    service.load(controller, 'proj-1');

    expect(get).toHaveBeenCalledTimes(1);
    expect(service.loaded()).toBe(true);
  });
});
