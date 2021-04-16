import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';
import { ServerSettingsService } from '../../../../services/server-settings.service';
import { MockedServerSettingsService } from '../../../../services/server-settings.service.spec';
import { ServerService } from '../../../../services/server.service';
import { MockedServerService } from '../../../../services/server.service.spec';
import { ToasterService } from '../../../../services/toaster.service';
import { MockedToasterService } from '../../../../services/toaster.service.spec';
import { MockedActivatedRoute } from '../../preferences.component.spec';
import { QemuPreferencesComponent } from './qemu-preferences.component';

describe('QemuPreferencesComponent', () => {
  let component: QemuPreferencesComponent;
  let fixture: ComponentFixture<QemuPreferencesComponent>;

  let mockedServerService = new MockedServerService();
  let activatedRoute = new MockedActivatedRoute().get();
  let mockedServerSettingsService = new MockedServerSettingsService();
  let mockedToasterService = new MockedToasterService();

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientModule,
        MatIconModule,
        MatToolbarModule,
        MatMenuModule,
        MatCheckboxModule,
        CommonModule,
        NoopAnimationsModule,
        RouterTestingModule.withRoutes([]),
      ],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: activatedRoute,
        },
        { provide: ServerService, useValue: mockedServerService },
        { provide: ServerSettingsService, useValue: mockedServerSettingsService },
        { provide: ToasterService, useValue: mockedToasterService },
      ],
      declarations: [QemuPreferencesComponent],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(QemuPreferencesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call update settings when restore defaults chosen', () => {
    spyOn(mockedServerSettingsService, 'updateSettingsForQemu').and.returnValue(of([]));

    component.restoreDefaults();

    expect(mockedServerSettingsService.updateSettingsForQemu).toHaveBeenCalled();
  });
});
