import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { MatCheckboxModule, MatExpansionModule } from '@angular/material';
import { FormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { PersistenceModule } from 'angular-persistence';

import { SettingsComponent } from './settings.component';
import { SettingsService } from '../../services/settings.service';
import { ToasterService } from '../../services/toaster.service';
import { MockedToasterService } from '../../services/toaster.service.spec';

describe('SettingsComponent', () => {
  let component: SettingsComponent;
  let fixture: ComponentFixture<SettingsComponent>;
  let settingsService: SettingsService;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [MatExpansionModule, MatCheckboxModule, FormsModule, PersistenceModule, BrowserAnimationsModule],
      providers: [SettingsService, { provide: ToasterService, useClass: MockedToasterService }],
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
      angular_map: false
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
