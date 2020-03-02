import { ComponentFixture, async, TestBed } from '@angular/core/testing';
import { CommonModule } from '@angular/common';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { ActivatedRoute } from '@angular/router';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { MockedServerService } from '../../../../services/server.service.spec';
import { ServerService } from '../../../../services/server.service';
import { MockedActivatedRoute } from '../../preferences.component.spec';
import { ServerSettingsService } from '../../../../services/server-settings.service';
import { HttpClientModule } from '@angular/common/http';
import { MockedServerSettingsService } from '../../../../services/server-settings.service.spec';
import { MockedToasterService } from '../../../../services/toaster.service.spec';
import { ToasterService } from '../../../../services/toaster.service';
import { DynamipsPreferencesComponent } from './dynamips-preferences.component';
import { MATERIAL_IMPORTS } from '../../../../material.imports';

describe('DynamipsPreferencesComponent', () => {
    let component: DynamipsPreferencesComponent;
    let fixture: ComponentFixture<DynamipsPreferencesComponent>;

    let mockedServerService = new MockedServerService;
    let activatedRoute = new MockedActivatedRoute().get();
    let mockedServerSettingsService = new MockedServerSettingsService();
    let mockedToasterService = new MockedToasterService();
    
    beforeEach(async(() => {
        TestBed.configureTestingModule({
          imports: [HttpClientModule, MATERIAL_IMPORTS, CommonModule, NoopAnimationsModule, RouterTestingModule.withRoutes([])],
          providers: [
              {
                  provide: ActivatedRoute,  useValue: activatedRoute
              },
              { provide: ServerService, useValue: mockedServerService },
              { provide: ServerSettingsService, useValue: mockedServerSettingsService },
              { provide: ToasterService, useValue: mockedToasterService }
          ],
          declarations: [
              DynamipsPreferencesComponent
          ],
          schemas: [NO_ERRORS_SCHEMA]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(DynamipsPreferencesComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should clear path when restore defaults called', () => {
        component.dynamipsPath = 'Non empty';
        component.restoreDefaults();

        expect(component.dynamipsPath).toBe('');
    });
});
