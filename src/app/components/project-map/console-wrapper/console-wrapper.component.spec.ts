import { signal } from '@angular/core';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ConsoleWrapperComponent } from './console-wrapper.component';

describe('ConsoleWrapperComponent', () => {
  describe('prototype methods', () => {
    it('should have ngOnInit method', () => {
      expect(typeof (ConsoleWrapperComponent.prototype as any).ngOnInit).toBe('function');
    });

    it('should have ngAfterViewInit method', () => {
      expect(typeof (ConsoleWrapperComponent.prototype as any).ngAfterViewInit).toBe('function');
    });

    it('should have ngOnDestroy method', () => {
      expect(typeof (ConsoleWrapperComponent.prototype as any).ngOnDestroy).toBe('function');
    });

    it('should have minimize method', () => {
      expect(typeof (ConsoleWrapperComponent.prototype as any).minimize).toBe('function');
    });

    it('should have toggleMinimize method', () => {
      expect(typeof (ConsoleWrapperComponent.prototype as any).toggleMinimize).toBe('function');
    });

    it('should have toggleMaximize method', () => {
      expect(typeof (ConsoleWrapperComponent.prototype as any).toggleMaximize).toBe('function');
    });

    it('should have addTab method', () => {
      expect(typeof (ConsoleWrapperComponent.prototype as any).addTab).toBe('function');
    });

    it('should have removeTab method', () => {
      expect(typeof (ConsoleWrapperComponent.prototype as any).removeTab).toBe('function');
    });

    it('should have validate method', () => {
      expect(typeof (ConsoleWrapperComponent.prototype as any).validate).toBe('function');
    });

    it('should have onResizeEnd method', () => {
      expect(typeof (ConsoleWrapperComponent.prototype as any).onResizeEnd).toBe('function');
    });

    it('should have close method', () => {
      expect(typeof (ConsoleWrapperComponent.prototype as any).close).toBe('function');
    });

    it('should have getActiveTabName method', () => {
      expect(typeof (ConsoleWrapperComponent.prototype as any).getActiveTabName).toBe('function');
    });

    it('should have onDeviceSelected method', () => {
      expect(typeof (ConsoleWrapperComponent.prototype as any).onDeviceSelected).toBe('function');
    });

    it('should have handleTabShortcut method', () => {
      expect(typeof (ConsoleWrapperComponent.prototype as any).handleTabShortcut).toBe('function');
    });

    it('should have onXtermTabShortcut method', () => {
      expect(typeof (ConsoleWrapperComponent.prototype as any).onXtermTabShortcut).toBe('function');
    });

    it('should have onConsoleActivate method', () => {
      expect(typeof (ConsoleWrapperComponent.prototype as any).onConsoleActivate).toBe('function');
    });

    it('should have onDocumentClick method', () => {
      expect(typeof (ConsoleWrapperComponent.prototype as any).onDocumentClick).toBe('function');
    });

    it('should have switchToTab method', () => {
      expect(typeof (ConsoleWrapperComponent.prototype as any).switchToTab).toBe('function');
    });

    it('should have enableScroll method', () => {
      expect(typeof (ConsoleWrapperComponent.prototype as any).enableScroll).toBe('function');
    });

    it('should have disableScroll method', () => {
      expect(typeof (ConsoleWrapperComponent.prototype as any).disableScroll).toBe('function');
    });

    it('should have onWindowResize method', () => {
      expect(typeof (ConsoleWrapperComponent.prototype as any).onWindowResize).toBe('function');
    });
  });

  describe('settings behavior', () => {
    it('toggleSettingsPanel should flip state and mark for check', () => {
      const markForCheck = vi.fn();
      const host = {
        showSettingsPanelSignal: signal(false),
        cdr: { markForCheck },
      } as any;

      (ConsoleWrapperComponent.prototype as any).toggleSettingsPanel.call(host);
      expect(host.showSettingsPanelSignal()).toBe(true);
      expect(markForCheck).toHaveBeenCalledTimes(1);

      (ConsoleWrapperComponent.prototype as any).toggleSettingsPanel.call(host);
      expect(host.showSettingsPanelSignal()).toBe(false);
      expect(markForCheck).toHaveBeenCalledTimes(2);
    });
  });

  describe('browser resize while maximized', () => {
    it('keeps the maximized style height instead of collapsing to the pre-maximize size', () => {
      window.innerWidth = 1200;
      window.innerHeight = 800;
      // Maximized: style.height holds the maximized px; resizedHeight still
      // carries the pre-maximize manual size (toggleMaximize never updates it).
      const host = {
        isMinimizedSignal: signal(false),
        MIN_WIDTH: 500,
        MIN_HEIGHT: 400,
        toolbarTopOffset: () => 64,
        resizedWidth: 600,
        resizedHeight: 400,
        style: { position: 'fixed', left: '100px', top: '164px', width: '600px', height: '600px' },
        applyStyleToElement: vi.fn(),
        applyResizedRect: (ConsoleWrapperComponent.prototype as any).applyResizedRect,
        cdr: { markForCheck: vi.fn() },
      } as any;

      (ConsoleWrapperComponent.prototype as any).onWindowResize.call(host);

      expect(host.style.height).toBe('600px'); // RED before the fix: '400px'
      expect(host.applyStyleToElement).toHaveBeenCalledWith(host.style);
    });
  });

  describe('window state persistence (preferences facade)', () => {
    const STORAGE_KEY = 'gns3_console_window_state';

    let originalInnerWidth: number;
    let originalInnerHeight: number;

    beforeEach(() => {
      originalInnerWidth = window.innerWidth;
      originalInnerHeight = window.innerHeight;
    });

    afterEach(() => {
      window.innerWidth = originalInnerWidth;
      window.innerHeight = originalInnerHeight;
    });

    /**
     * Host carrying the instance fields loadWindowState/saveWindowState
     * touch. Built on the REAL prototype (loadWindowState calls
     * this.parsePx, so a plain object literal would throw into the catch
     * path), with the geometry constants mirroring the component's field
     * initializers (they are instance state, not prototype members).
     */
    function makeHost(prefs: {
      getItem: (key: string) => string | null;
      setItem: (key: string, value: string) => void;
    }) {
      const host = Object.create(ConsoleWrapperComponent.prototype) as any;
      Object.assign(host, {
        DEFAULT_WIDTH: 848,
        DEFAULT_HEIGHT: 600,
        DEFAULT_LEFT: '80px',
        DEFAULT_BOTTOM: '100px',
        MIN_WIDTH: 500,
        MIN_HEIGHT: 400,
        resizedWidth: 848,
        resizedHeight: 600,
        isMaximizedSignal: signal(false),
        style: {} as Record<string, string>,
        prefs,
      });
      return host;
    }

    const load = (host: any) => (ConsoleWrapperComponent.prototype as any).loadWindowState.call(host);
    const save = (host: any) => (ConsoleWrapperComponent.prototype as any).saveWindowState.call(host);

    it('restores a normal on-screen state unclamped', () => {
      window.innerWidth = 1920;
      window.innerHeight = 1080;
      const host = makeHost({
        getItem: () => JSON.stringify({ width: 800, height: 500, left: 240, bottom: 160, isMaximized: false }),
        setItem: () => {},
      });
      load(host);
      expect(host.resizedWidth).toBe(800);
      expect(host.resizedHeight).toBe(500);
      expect(host.style).toEqual({ bottom: '160px', left: '240px', width: '800px', height: '500px' });
      expect(host.isMaximizedSignal()).toBe(false);
    });

    it('clamps a state saved on a larger screen to the current viewport', () => {
      window.innerWidth = 1024;
      window.innerHeight = 768;
      const host = makeHost({
        getItem: () => JSON.stringify({ width: 1600, height: 1200, left: 1200, bottom: 900, isMaximized: false }),
        setItem: () => {},
      });
      load(host);
      expect(host.resizedWidth).toBe(1024);
      expect(host.resizedHeight).toBe(768);
      // Position clamped so the window stays fully on-screen.
      expect(host.style.left).toBe('0px');
      expect(host.style.bottom).toBe('0px');
    });

    it('parses legacy CSS-string positions (older copies stored "Npx")', () => {
      window.innerWidth = 1920;
      window.innerHeight = 1080;
      const host = makeHost({
        getItem: () => JSON.stringify({ width: 700, height: 500, left: '120px', bottom: '60px' }),
        setItem: () => {},
      });
      load(host);
      expect(host.style).toEqual({ bottom: '60px', left: '120px', width: '700px', height: '500px' });
    });

    it('falls back to the defaults when nothing is stored', () => {
      const host = makeHost({ getItem: () => null, setItem: () => {} });
      load(host);
      expect(host.style).toEqual({ bottom: '100px', left: '80px', width: '848px', height: '600px' });
    });

    it('falls back to the defaults on corrupt JSON', () => {
      const host = makeHost({ getItem: () => '{oops', setItem: () => {} });
      load(host);
      expect(host.style).toEqual({ bottom: '100px', left: '80px', width: '848px', height: '600px' });
    });

    it('restores the maximized state sized from the current viewport', () => {
      window.innerWidth = 1200; // wide toolbar (64px header offset)
      window.innerHeight = 800;
      const host = makeHost({
        getItem: () => JSON.stringify({ width: 900, height: 500, left: 200, bottom: 100, isMaximized: true }),
        setItem: () => {},
      });
      load(host);
      expect(host.isMaximizedSignal()).toBe(true);
      expect(host.style.bottom).toBe('0px');
      expect(host.style.height).toBe('716px'); // 800 - 64 - 20
    });

    it('saves the numeric-px shape through the facade', () => {
      const setItem = vi.fn();
      const host = makeHost({ getItem: () => null, setItem });
      host.resizedWidth = 900;
      host.resizedHeight = 520;
      host.style = { bottom: '120px', left: '80px', width: '900px', height: '520px' };
      save(host);
      expect(setItem).toHaveBeenCalledWith(
        STORAGE_KEY,
        JSON.stringify({ width: 900, height: 520, bottom: 120, left: 80, isMaximized: false })
      );
    });

    it('saves a maximized bottom/left of 0px as 0 (not the default fallback)', () => {
      const setItem = vi.fn();
      const host = makeHost({ getItem: () => null, setItem });
      host.style = { bottom: '0px', left: '0px' };
      save(host);
      const saved = JSON.parse(setItem.mock.calls[0][1]);
      expect(saved.bottom).toBe(0);
      expect(saved.left).toBe(0);
    });
  });
});
