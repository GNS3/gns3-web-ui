import { MapSettingsService } from '../../../services/mapsettings.service';
import { NodeConsoleService } from '../../../services/nodeConsole.service';
import { ThemeService } from '../../../services/theme.service';
import { ConsoleWrapperComponent } from './console-wrapper.component';

describe('ConsoleWrapperComponent', () => {
  it('should get actual theme', () => {
    const consoleService = new NodeConsoleService();

    const themeService = autoSpy(ThemeService);
    themeService.getActualTheme.and.returnValue('light');

    const mapSettingsService = autoSpy(MapSettingsService);
    const component = new ConsoleWrapperComponent(consoleService, themeService, mapSettingsService);

    component.ngOnInit();

    expect(component.isLightThemeEnabled).toBe(true);
  });
});

export type SpyOf<T> = T & { [k in keyof T]: jasmine.Spy };

export function autoSpy<T>(obj: new (...args: any[]) => T): SpyOf<T> {
  const res: SpyOf<T> = {} as any;

  const keys = Object.getOwnPropertyNames(obj.prototype);
  keys.forEach((key) => {
    res[key] = jasmine.createSpy(key);
  });

  return res;
}
