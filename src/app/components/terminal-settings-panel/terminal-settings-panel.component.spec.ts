import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TerminalSettingsPanelComponent } from './terminal-settings-panel.component';
import { XtermService, ConsoleAppearanceSettings, DEFAULT_FONT_SIZE, MIN_FONT_SIZE, MAX_FONT_SIZE } from '@services/xterm.service';

describe('TerminalSettingsPanelComponent', () => {
  let fixture: ComponentFixture<TerminalSettingsPanelComponent>;
  let component: TerminalSettingsPanelComponent;

  const initialSettings: ConsoleAppearanceSettings = {
    fontSize: DEFAULT_FONT_SIZE,
    fontFamily: null,
    foregroundColor: null,
    backgroundColor: null,
  };

  let serviceState: ConsoleAppearanceSettings;
  const updateSettings = vi.fn().mockImplementation((patch: Partial<ConsoleAppearanceSettings>) => {
    serviceState = { ...serviceState, ...patch };
  });

  const mockXtermService = {
    updateSettings,
    getInstalledFonts: vi.fn().mockReturnValue([
      { name: 'Auto (system monospace)', value: null },
      { name: 'Consolas', value: 'Consolas' },
    ]),
    getEffectiveBackgroundHex: vi.fn().mockReturnValue('#121212'),
    getEffectiveForegroundHex: vi.fn().mockReturnValue('#eeeeee'),
  };
  Object.defineProperty(mockXtermService, 'settings', {
    get: () => ({ ...serviceState }),
  });

  beforeEach(async () => {
    serviceState = { ...initialSettings };
    updateSettings.mockClear();
    mockXtermService.getInstalledFonts.mockClear();
    mockXtermService.getEffectiveBackgroundHex.mockClear();
    mockXtermService.getEffectiveForegroundHex.mockClear();

    TestBed.configureTestingModule({
      imports: [TerminalSettingsPanelComponent],
      providers: [{ provide: XtermService, useValue: mockXtermService }],
    });

    fixture = TestBed.createComponent(TerminalSettingsPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    if (fixture) fixture.destroy();
  });

  describe('Component Creation', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should render the title and font options', () => {
      const element: HTMLElement = fixture.nativeElement;
      expect(element.querySelector('.terminal-settings-panel__title')?.textContent).toContain('Terminal Settings');
      expect(element.querySelectorAll('option').length).toBe(2);
    });
  });

  describe('closed output', () => {
    it('should emit closed when the backdrop is clicked', () => {
      const closedSpy = vi.fn();
      component.closed.subscribe(closedSpy);

      const backdrop = (fixture.nativeElement as HTMLElement).querySelector('.terminal-settings-backdrop');
      backdrop?.dispatchEvent(new Event('click'));

      expect(closedSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('settings changes', () => {
    it('applySettings should refresh state from service settings and mark for check', () => {
      serviceState = {
        fontSize: MAX_FONT_SIZE,
        fontFamily: 'Consolas',
        foregroundColor: '#112233',
        backgroundColor: '#aabbcc',
      };
      const markForCheckSpy = vi.spyOn((component as any).cdr, 'markForCheck');

      component.onBgColorChange({ target: { value: '#000000' } } as unknown as Event);

      expect(updateSettings).toHaveBeenCalledWith({ backgroundColor: '#000000' });
      expect(component.currentSettings()).toEqual(serviceState);
      expect(markForCheckSpy).toHaveBeenCalled();
    });

    it('changeFontSize should clamp bounds before applying', () => {
      component.changeFontSize(-100);
      expect(updateSettings).toHaveBeenLastCalledWith({ fontSize: MIN_FONT_SIZE });
      expect(component.currentSettings().fontSize).toBe(MIN_FONT_SIZE);

      component.changeFontSize(100);
      expect(updateSettings).toHaveBeenLastCalledWith({ fontSize: MAX_FONT_SIZE });
      expect(component.currentSettings().fontSize).toBe(MAX_FONT_SIZE);
    });

    it('resetBgColor should clear the custom background color', () => {
      serviceState = { ...initialSettings, backgroundColor: '#aabbcc' };

      component.resetBgColor();

      expect(updateSettings).toHaveBeenCalledWith({ backgroundColor: null });
      expect(component.currentSettings().backgroundColor).toBeNull();
    });

    it('resetFgColor should clear the custom text color', () => {
      serviceState = { ...initialSettings, foregroundColor: '#112233' };

      component.resetFgColor();

      expect(updateSettings).toHaveBeenCalledWith({ foregroundColor: null });
      expect(component.currentSettings().foregroundColor).toBeNull();
    });

    it('onFontFamilyChange should map empty string to null', () => {
      component.onFontFamilyChange('');

      expect(updateSettings).toHaveBeenCalledWith({ fontFamily: null });
    });

    it('resetFontSize should restore the default font size', () => {
      serviceState = { ...initialSettings, fontSize: MAX_FONT_SIZE };

      component.resetFontSize();

      expect(updateSettings).toHaveBeenCalledWith({ fontSize: DEFAULT_FONT_SIZE });
      expect(component.currentSettings().fontSize).toBe(DEFAULT_FONT_SIZE);
    });
  });

  describe('effective colors', () => {
    it('should prefer the custom background color over the theme default', () => {
      serviceState = { ...initialSettings, backgroundColor: '#aabbcc' };
      component.onFgColorChange({ target: { value: '#112233' } } as unknown as Event);

      expect(component.effectiveBgHex()).toBe('#aabbcc');
    });

    it('should fall back to the service color when no custom value is set', () => {
      expect(component.effectiveBgHex()).toBe('#121212');
      expect(component.effectiveFgHex()).toBe('#eeeeee');
    });
  });
});
