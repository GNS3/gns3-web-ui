import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { MatCheckboxModule, MatExpansionModule, MatFormFieldModule, MatIconModule, MatInputModule } from '@angular/material';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { PersistenceModule } from 'angular-persistence';

import { SettingsService } from '../../services/settings.service';
import { ConsoleService } from '../../services/settings/console.service';
import { ToasterService } from '../../services/toaster.service';
import { MockedToasterService } from '../../services/toaster.service.spec';
import { SettingsComponent } from './settings.component';

describe('SettingsComponent', () => {
  let component: SettingsComponent;
  let fixture: ComponentFixture<SettingsComponent>;
  let settingsService: SettingsService;
  let consoleService;

  beforeEach(async(() => {
    consoleService = {
      command: 'command'
    };

    TestBed.configureTestingModule({
      imports: [MatExpansionModule, MatCheckboxModule, FormsModule, PersistenceModule, BrowserAnimationsModule, MatIconModule, MatFormFieldModule, MatInputModule],
      providers: [
        SettingsService,
        { provide: ToasterService, useClass: MockedToasterService },
        { provide: ConsoleService, useValue: consoleService}
      ],
      declarations: [SettingsComponent]
    }).compileComponents();

    settingsService = TestBed.get(SettingsService);
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should get and save new settings', () => {
    const settings = {
      crash_reports: true,
      experimental_features: true,
      angular_map: false,
      console_command: ''
    };
    const getAll = spyOn(settingsService, 'getAll').and.returnValue(settings);
    const setAll = spyOn(settingsService, 'setAll');
    component.ngOnInit();
    expect(getAll).toHaveBeenCalled();
    expect(component.settings).toEqual(settings);
    component.settings.crash_reports = false;
    component.save();
    expect(setAll).toHaveBeenCalledWith(settings);
  });

});
