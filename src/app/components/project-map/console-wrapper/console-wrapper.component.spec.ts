import { ComponentFixture, TestBed, async } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { ToasterService } from '@services/toaster.service';
import { MapSettingsService } from '@services/mapsettings.service';
import { NodeConsoleService } from '@services/nodeConsole.service';
import { ThemeService } from '@services/theme.service';
import { ConsoleWrapperComponent } from './console-wrapper.component';
import { MatSnackBarModule } from '@angular/material/snack-bar';

describe('ConsoleWrapperComponent', () => {
  let fixture: ComponentFixture<ConsoleWrapperComponent>;
  let component: ConsoleWrapperComponent;

  let nodeConsoleService: NodeConsoleService;
  let themeService: ThemeService;
  let mapSettingsService: MapSettingsService;
  let toasterService: ToasterService;

  beforeEach(async() => {
    await TestBed.configureTestingModule({
      imports: [RouterTestingModule, MatSnackBarModule],
      providers: [NodeConsoleService, ThemeService, MapSettingsService, ToasterService]
    }).compileComponents();

    toasterService = TestBed.inject(ToasterService);
    nodeConsoleService = TestBed.inject(NodeConsoleService);
    themeService = TestBed.inject(ThemeService);
    mapSettingsService = TestBed.inject(MapSettingsService);
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ConsoleWrapperComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should get actual theme', () => {
    component.ngOnInit();

    expect(component.isLightThemeEnabled).toBe(false);
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
