import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonModule } from '@angular/common';
import { RouterTestingModule } from '@angular/router/testing';
import { ToasterService } from '@services/toaster.service';
import { MapSettingsService } from '@services/mapsettings.service';
import { NodeConsoleService } from '@services/nodeConsole.service';
import { ThemeService } from '@services/theme.service';
import { ConsoleWrapperComponent } from './console-wrapper.component';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatIconModule } from '@angular/material/icon';
import { NO_ERRORS_SCHEMA } from '@angular/core';

describe('ConsoleWrapperComponent', () => {
  let fixture: ComponentFixture<ConsoleWrapperComponent>;
  let component: ConsoleWrapperComponent;

  let nodeConsoleService: NodeConsoleService;
  let themeService: ThemeService;
  let mapSettingsService: MapSettingsService;
  let toasterService: ToasterService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [],
      imports: [
        CommonModule,
        RouterTestingModule,
        MatSnackBarModule,
        MatTabsModule,
        MatIconModule,
        BrowserAnimationsModule,
        ConsoleWrapperComponent,
      ],
      providers: [
        provideZonelessChangeDetection(),
        NodeConsoleService,
        ThemeService,
        MapSettingsService,
        ToasterService,
      ],
      schemas: [NO_ERRORS_SCHEMA],
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

export type SpyOf<T> = T & { [k in keyof T]: jest.Mock };

export function autoSpy<T>(obj: new (...args: any[]) => T): SpyOf<T> {
  const res: SpyOf<T> = {} as any;

  const keys = Object.getOwnPropertyNames(obj.prototype);
  keys.forEach((key) => {
    res[key] = vi.fn(key);
  });

  return res;
}
