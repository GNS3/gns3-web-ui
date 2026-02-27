import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatIconModule } from '@angular/material/icon';
import { RouterTestingModule } from '@angular/router/testing';
import { AppComponent } from './app.component';
import { ProgressService } from './common/progress/progress.service';
import { SettingsService } from '@services/settings.service';
import { ThemeService } from '@services/theme.service';

describe('AppComponent', () => {
  let component: AppComponent;
  let fixture: ComponentFixture<AppComponent>;
  let settingsService: SettingsService;
  let themeService: ThemeService;

  beforeEach(async() => {
    await TestBed.configureTestingModule({
      declarations: [AppComponent],
      imports: [RouterTestingModule, MatIconModule],
      providers: [SettingsService, ProgressService, ThemeService],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    settingsService = TestBed.inject(SettingsService);
    themeService = TestBed.inject(ThemeService);
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AppComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the app', async() => {
    const app = fixture.debugElement.componentInstance;
    await expect(app).toBeTruthy();
  });

  it('should have router-outlet', async() => {
    const compiled = fixture.debugElement.nativeElement;
    await expect(compiled.querySelector('router-outlet')).toBeTruthy();
  });

  it('should apply theme on init', () => {
    themeService.savedTheme = 'dark';
    component.ngOnInit();
    expect(component.darkThemeEnabled).toBe(true);
  });
});
