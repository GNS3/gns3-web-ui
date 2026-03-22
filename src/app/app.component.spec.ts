import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { AppComponent } from './app.component';
import { ProgressService } from './common/progress/progress.service';
import { SettingsService } from '@services/settings.service';
import { AppTestingModule } from './testing/app-testing/app-testing.module';

describe('AppComponent', () => {
  let component: AppComponent;
  let fixture: ComponentFixture<AppComponent>;
  let settingsService: SettingsService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [AppComponent],
      imports: [RouterTestingModule, MatIconModule, HttpClientTestingModule, AppTestingModule],
      providers: [provideZonelessChangeDetection(), SettingsService, ProgressService],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    settingsService = TestBed.inject(SettingsService);
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

  it('should have footer', async() => {
    const compiled = fixture.debugElement.nativeElement;
    await expect(compiled.querySelector('router-outlet').textContent).toEqual('');
  });

  it('should receive changed settings', async() => {
    settingsService.setReportsSettings(true);
    component.ngOnInit();
    settingsService.setReportsSettings(false);
    expect(component).toBeTruthy();
  });
});
