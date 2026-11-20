import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
import { Injector } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Subject, of, throwError } from 'rxjs';
import { SYNCED_PREFERENCE_KEYS, UserPreferencesService } from './user-preferences.service';
import { HttpController } from './http-controller.service';
import { Controller } from '@models/controller';

describe('UserPreferencesService', () => {
  let service: UserPreferencesService;
  let mockHttpController: { get: ReturnType<typeof vi.fn>; put: ReturnType<typeof vi.fn> };
  let controller: Controller;

  beforeEach(() => {
    localStorage.clear();
    mockHttpController = { get: vi.fn(), put: vi.fn(() => of({})) };
    controller = {
      id: 1,
      name: 'Test Controller',
      host: 'localhost',
      port: 3080,
      protocol: 'http:',
      username: '',
      password: '',
      authToken: 'test-token',
      tokenExpired: false,
    } as Controller;

    TestBed.configureTestingModule({
      providers: [{ provide: HttpController, useValue: mockHttpController }],
    });
    service = TestBed.inject(UserPreferencesService);
  });

  afterEach(() => {
    TestBed.resetTestingModule();
    localStorage.clear();
  });

  describe('Sync boundary', () => {
    it('includes the floating widget geometry keys', () => {
      for (const key of ['topPosition', 'leftPosition', 'rightPosition', 'widthOfWidget', 'heightOfWidget']) {
        expect(SYNCED_PREFERENCE_KEYS).toContain(key);
      }
    });

    it('includes the AI chat panel state blob', () => {
      expect(SYNCED_PREFERENCE_KEYS).toContain('ai-chat-panel-state');
    });

    it('keeps the sync baseline key out of the mirrored document', () => {
      // The baseline is local bookkeeping (which values were last pushed);
      // mirroring it would let one browser poison another's edit detection.
      expect(SYNCED_PREFERENCE_KEYS).not.toContain('gns3_prefs_sync_baseline');
    });
  });

  describe('localStorage facade', () => {
    it('writes through to localStorage immediately', () => {
      service.setItem('topPosition', '42');

      expect(localStorage.getItem('topPosition')).toBe('42');
      expect(service.getItem('topPosition')).toBe('42');
    });

    it('propagates removals to localStorage', () => {
      service.setItem('widthOfWidget', '720');
      service.removeItem('widthOfWidget');

      expect(service.getItem('widthOfWidget')).toBeNull();
    });

    it('does not schedule a push before sync is enabled', () => {
      service.setItem('topPosition', '42');
      service.removeItem('leftPosition');

      expect(mockHttpController.put).not.toHaveBeenCalled();
    });
  });

  describe('login merge', () => {
    it('keeps local-only keys and uploads them to an older server document', () => {
      // Geometry saved by a previous session on this browser; the server
      // document (from before these keys existed) has no entry for it.
      localStorage.setItem('topPosition', '120');

      mockHttpController.get.mockReturnValue(
        of({ preferences: { version: 1, webui: { theme: 'dark' } } }),
      );
      service.sync(controller);

      // Not wiped by the merge, and included in the reconciling push.
      expect(localStorage.getItem('topPosition')).toBe('120');
      expect(mockHttpController.put).toHaveBeenCalledTimes(1);
      const body = mockHttpController.put.mock.calls[0][2] as { webui: Record<string, string> };
      expect(body.webui['topPosition']).toBe('120');
      expect(body.webui['theme']).toBe('dark');
    });

    it('applies server geometry to a fresh browser without a redundant push', () => {
      mockHttpController.get.mockReturnValue(
        of({
          preferences: {
            version: 1,
            webui: {
              widthOfWidget: '800',
              'ai-chat-panel-state': JSON.stringify({ isOpen: false, width: 900, height: 900 }),
            },
          },
        }),
      );
      service.sync(controller);

      expect(localStorage.getItem('widthOfWidget')).toBe('800');
      expect(JSON.parse(localStorage.getItem('ai-chat-panel-state')!)).toEqual(
        expect.objectContaining({ width: 900 }),
      );
      // The merged document matches the server signature — nothing to push.
      expect(mockHttpController.put).not.toHaveBeenCalled();
    });
  });

  describe('controller switching', () => {
    const secondController = { ...controller, id: 2, host: 'other-host' } as Controller;

    it('flushes pending edits to the previous controller before switching', () => {
      mockHttpController.get.mockImplementation((target: Controller) =>
        of(
          String(target.id) === '1'
            ? { preferences: { version: 1, webui: { theme: 'dark' } } }
            : { preferences: { version: 1, webui: { widthOfWidget: '800' } } },
        ),
      );
      service.sync(controller);
      service.setItem('topPosition', '42'); // still inside the debounce window

      service.sync(secondController);

      // The outgoing edit left for its own controller before the switch.
      expect(mockHttpController.put).toHaveBeenCalledTimes(1);
      expect(mockHttpController.put.mock.calls[0][0]).toBe(controller);
      const body = mockHttpController.put.mock.calls[0][2] as { webui: Record<string, string> };
      expect(body.webui['topPosition']).toBe('42');

      // The new controller merges its own document into a clean mirror:
      // nothing from the previous controller is uploaded to it.
      expect(mockHttpController.get).toHaveBeenCalledWith(secondController, '/access/users/me/preferences');
      expect(localStorage.getItem('widthOfWidget')).toBe('800');
      expect(localStorage.getItem('theme')).toBeNull();
      expect(localStorage.getItem('topPosition')).toBeNull();
    });

    it('re-merges the first controller when switching back', () => {
      mockHttpController.get.mockImplementation((target: Controller) =>
        of({
          preferences: {
            version: 1,
            webui: { theme: String(target.id) === '1' ? 'dark' : 'light' },
          },
        }),
      );
      service.sync(controller);
      expect(localStorage.getItem('theme')).toBe('dark');

      service.sync(secondController);
      expect(localStorage.getItem('theme')).toBe('light');

      service.sync(controller);

      expect(mockHttpController.get).toHaveBeenCalledTimes(3);
      expect(localStorage.getItem('theme')).toBe('dark');
    });
  });

  describe('logout (invalidate)', () => {
    it('keeps the local mirror when the server never had a copy', () => {
      // Sync against a controller without the endpoint (404): localStorage
      // holds the only copy of the user's rules, so a logout must not
      // destroy it.
      mockHttpController.get.mockReturnValue(throwError(() => ({ status: 404 })));
      service.sync(controller);
      service.setItem('gns3.bpf-presets', '[{"name":"rule"}]');

      service.invalidate();

      expect(localStorage.getItem('gns3.bpf-presets')).toBe('[{"name":"rule"}]');
    });

    it('wipes the local mirror after a successful sync', () => {
      mockHttpController.get.mockReturnValue(of({ preferences: { version: 1, webui: { theme: 'dark' } } }));
      service.sync(controller);
      expect(localStorage.getItem('theme')).toBe('dark');

      service.invalidate();

      expect(localStorage.getItem('theme')).toBeNull();
      expect(localStorage.getItem('gns3_prefs_sync_baseline')).toBeNull();
    });

    it('flushes a pending debounced push before wiping the mirror', () => {
      mockHttpController.get.mockReturnValue(of({ preferences: { version: 1, webui: { theme: 'dark' } } }));
      service.sync(controller);
      service.setItem('topPosition', '42'); // still inside the 2 s debounce window

      service.invalidate(); // fires the flush synchronously

      // The outgoing user's edit left for the server before the wipe.
      expect(mockHttpController.put).toHaveBeenCalledWith(
        controller,
        '/access/users/me/preferences',
        expect.objectContaining({ webui: expect.objectContaining({ topPosition: '42' }) }),
      );
    });

    it('drops a preferences GET that resolves after invalidation', () => {
      const subject = new Subject<{ preferences: { version: number; webui: Record<string, string> } }>();
      mockHttpController.get.mockReturnValue(subject);
      service.sync(controller);

      // Session ends (logout / expiry) while the GET is in flight.
      service.invalidate();
      subject.next({ preferences: { version: 1, webui: { theme: 'dark' } } });

      // The previous user's document is not applied to the cleared mirror
      // and nothing is pushed from it.
      expect(localStorage.getItem('theme')).toBeNull();
      expect(mockHttpController.put).not.toHaveBeenCalled();
    });
  });

  describe('cross-session merge semantics', () => {
    it('propagates a server-side deletion instead of resurrecting the key', () => {
      mockHttpController.get.mockReturnValue(of({ preferences: { version: 1, webui: { theme: 'dark' } } }));
      service.sync(controller);
      expect(localStorage.getItem('theme')).toBe('dark');

      // The browser is closed WITHOUT logout (tab close, refresh, crash):
      // the mirror and the persisted baseline survive on disk. Meanwhile
      // another browser deletes the key server-side (a removeItem + flush
      // omits it from the pushed document, e.g. layers/grid toggled off).
      mockHttpController.get.mockReturnValue(of({ preferences: { version: 1, webui: {} } }));

      // Next session: a fresh instance rebuilds its baseline from disk.
      const nextSession = new UserPreferencesService(TestBed.inject(Injector));
      nextSession.sync(controller);

      expect(localStorage.getItem('theme')).toBeNull();
      // merged === server signature: the deletion needs no reconciling push.
      expect(mockHttpController.put).not.toHaveBeenCalled();
    });

    it('re-enables sync for the next controller after one without the endpoint', () => {
      mockHttpController.get.mockReturnValueOnce(throwError(() => ({ status: 404 })));
      service.sync(controller); // old controller: preferences endpoint absent
      service.invalidate(); // logout / session boundary

      mockHttpController.get.mockReturnValue(of({ preferences: { version: 1, webui: { theme: 'dark' } } }));
      const modern = { ...controller, id: 2 } as Controller;
      service.sync(modern);

      expect(mockHttpController.get).toHaveBeenCalledTimes(2);
      expect(localStorage.getItem('theme')).toBe('dark');
    });

    it('keeps an edit made before the first merge lands and pushes it', () => {
      const subject = new Subject<{ preferences: { version: number; webui: Record<string, string> } }>();
      mockHttpController.get.mockReturnValue(subject);
      service.sync(controller);

      // A preference changes while the initial GET is in flight (no
      // baseline yet — e.g. the first login after a logout wiped it).
      service.setItem('theme', 'light');

      subject.next({ preferences: { version: 1, webui: { theme: 'dark' } } });

      // The fresh local edit wins over the older server value…
      expect(localStorage.getItem('theme')).toBe('light');
      // …and is reconciled into the document instead of being dropped.
      expect(mockHttpController.put).toHaveBeenCalledWith(
        controller,
        '/access/users/me/preferences',
        expect.objectContaining({ webui: expect.objectContaining({ theme: 'light' }) }),
      );
    });
  });

  describe('logout with a push in flight', () => {
    beforeAll(() => {
      vi.useFakeTimers();
    });

    afterAll(() => {
      vi.useRealTimers();
    });

    it('does not resurrect the sync baseline when the push resolves after invalidation', async () => {
      mockHttpController.get.mockReturnValue(of({ preferences: { version: 1, webui: { theme: 'dark' } } }));
      service.sync(controller);
      expect(localStorage.getItem('theme')).toBe('dark');

      const subject = new Subject<unknown>();
      mockHttpController.put.mockReturnValue(subject);
      service.removeItem('theme'); // an edit: removal is a change too
      await vi.advanceTimersByTimeAsync(2000); // debounce fires, PUT in flight

      service.invalidate(); // logout before the server answers
      subject.next({}); // late success

      // The mirror was wiped and the late response must not rewrite the
      // baseline for the session that no longer exists.
      expect(localStorage.getItem('theme')).toBeNull();
      expect(localStorage.getItem('gns3_prefs_sync_baseline')).toBeNull();
    });
  });

  describe('redundant write suppression', () => {
    it('does not reschedule the pending push when a synced value is rewritten unchanged', async () => {
      mockHttpController.get.mockReturnValue(of({ preferences: { version: 1, webui: {} } }));
      service.sync(controller);

      service.setItem('topPosition', '42');
      await vi.advanceTimersByTimeAsync(1500);
      // The topology-summary drag reasserts the same geometry many times.
      service.setItem('topPosition', '42');
      await vi.advanceTimersByTimeAsync(600); // 2100 ms after the first write

      // The original debounce still fires on schedule: one push, not a
      // rescheduled one at 3500 ms.
      expect(mockHttpController.put).toHaveBeenCalledTimes(1);
    });

    it('does not touch localStorage when the stored value already matches', () => {
      service.setItem('topPosition', '42');
      const setItem = vi.spyOn(Storage.prototype, 'setItem');

      service.setItem('topPosition', '42');

      expect(setItem).not.toHaveBeenCalledWith('topPosition', '42');
      setItem.mockRestore();
    });

    it('does not schedule a push when removing a key that is not stored', async () => {
      mockHttpController.get.mockReturnValue(of({ preferences: { version: 1, webui: {} } }));
      service.sync(controller);

      service.removeItem('leftPosition');
      await vi.advanceTimersByTimeAsync(2000);

      expect(mockHttpController.put).not.toHaveBeenCalled();
    });
  });
});
