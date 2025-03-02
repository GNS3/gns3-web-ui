import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatIconModule } from '@angular/material/icon';
import { RouterTestingModule } from '@angular/router/testing';
import { ElectronService, NgxElectronModule } from 'ngx-electron';
import { AppComponent } from './app.component';
import { ProgressService } from './common/progress/progress.service';
import { SettingsService } from '@services/settings.service';

import createSpyObj = jasmine.createSpyObj;
// import 'jasmine';

describe('AppComponent', () => {
  let component: AppComponent;
  let fixture: ComponentFixture<AppComponent>;
  let electronService: ElectronService;
  let settingsService: SettingsService;

  beforeEach(async() => {
    await TestBed.configureTestingModule({
      declarations: [AppComponent],
      imports: [RouterTestingModule, MatIconModule, NgxElectronModule],
      providers: [SettingsService, ProgressService],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    electronService = TestBed.inject(ElectronService);
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

  it('should receive changed settings and forward to electron', async() => {
    await spyOnProperty(electronService, 'isElectronApp').and.returnValue(true);
    settingsService.setReportsSettings(true);
    component.ngOnInit();
    settingsService.setReportsSettings(false);
  });

  it('should receive changed settings and do not forward to electron', async() => {
    const spy = createSpyObj('Electron.IpcRenderer', ['send']);
    spyOnProperty(electronService, 'isElectronApp').and.returnValue(false);
    settingsService.setReportsSettings(true);
    component.ngOnInit();
    settingsService.setReportsSettings(false);
    await expect(spy.send).not.toHaveBeenCalled();
  });
});
