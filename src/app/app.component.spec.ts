import { TestBed, async, ComponentFixture } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { AppComponent } from './app.component';
import { MatIconModule } from '@angular/material';
import { SettingsService } from './services/settings.service';
import { PersistenceService } from 'angular-persistence';
import { ElectronService, NgxElectronModule } from 'ngx-electron';
import createSpyObj = jasmine.createSpyObj;

describe('AppComponent', () => {
  let component: AppComponent;
  let fixture: ComponentFixture<AppComponent>;
  let electronService: ElectronService;
  let settingsService: SettingsService;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [AppComponent],
      imports: [RouterTestingModule, MatIconModule, NgxElectronModule],
      providers: [SettingsService, PersistenceService]
    }).compileComponents();

    electronService = TestBed.get(ElectronService);
    settingsService = TestBed.get(SettingsService);
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AppComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the app', async(() => {
    const app = fixture.debugElement.componentInstance;
    expect(app).toBeTruthy();
  }));

  it('should have footer', async(() => {
    const compiled = fixture.debugElement.nativeElement;
    expect(compiled.querySelector('router-outlet').textContent).toEqual('');
  }));

  it('should receive changed settings and forward to electron', async(() => {
    const spy = createSpyObj('Electron.IpcRenderer', ['send']);
    spyOnProperty(electronService, 'isElectronApp').and.returnValue(true);
    spyOnProperty(electronService, 'ipcRenderer').and.returnValue(spy);
    settingsService.set('crash_reports', true);
    component.ngOnInit();
    settingsService.set('crash_reports', false);
    expect(spy.send).toHaveBeenCalled();
    expect(spy.send.calls.mostRecent().args[0]).toEqual('settings.changed');
    expect(spy.send.calls.mostRecent().args[1].crash_reports).toEqual(false);
  }));

  it('should receive changed settings and do not forward to electron', async(() => {
    const spy = createSpyObj('Electron.IpcRenderer', ['send']);
    spyOnProperty(electronService, 'isElectronApp').and.returnValue(false);
    settingsService.set('crash_reports', true);
    component.ngOnInit();
    settingsService.set('crash_reports', false);
    expect(spy.send).not.toHaveBeenCalled();
  }));
});
