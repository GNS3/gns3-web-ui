import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { PersistenceModule } from 'angular-persistence';

import { SettingsComponent } from './settings.component';
import { SettingsService } from '../../services/settings.service';
import { ToasterService } from '../../services/toaster.service';
import { MockedToasterService } from '../../services/toaster.service.spec';
import { ConsoleService } from '../../services/settings/console.service';
import { MapSettingsService } from '../../services/mapsettings.service';
import { UpdatesService } from '../../services/updates.service';
import { autoSpy } from '../project-map/console-wrapper/console-wrapper.component.spec';

describe('SettingsComponent', () => {
  let component: SettingsComponent;
  let fixture: ComponentFixture<SettingsComponent>;
  let settingsService: SettingsService;
  let mapSettingsService = {
    integrateLinkLabelsToLinks: true,
    toggleIntegrateInterfaceLabels(val: boolean) {},
  };
  let consoleService;
  let updatesService = autoSpy(UpdatesService);

  beforeEach(async(() => {
    consoleService = {
      command: 'command',
    };

    TestBed.configureTestingModule({
      imports: [
        MatExpansionModule,
        MatCheckboxModule,
        FormsModule,
        PersistenceModule,
        BrowserAnimationsModule,
        MatIconModule,
        MatFormFieldModule,
        MatInputModule,
      ],
      providers: [
        SettingsService,
        { provide: ToasterService, useClass: MockedToasterService },
        { provide: ConsoleService, useValue: consoleService },
        { provide: MapSettingsService, useValue: mapSettingsService },
        { provide: UpdatesService, useValue: updatesService },
      ],
      declarations: [SettingsComponent],
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
      console_command: '',
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
