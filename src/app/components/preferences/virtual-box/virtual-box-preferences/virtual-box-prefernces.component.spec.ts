import { ComponentFixture, async, TestBed } from '@angular/core/testing';
import { CommonModule } from '@angular/common';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { ActivatedRoute } from '@angular/router';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { MockedServerService } from '../../../../services/server.service.spec';
import { ServerService } from '../../../../services/server.service';
import { VirtualBoxPreferencesComponent } from './virtual-box-preferences.component';
import { MockedActivatedRoute } from '../../preferences.component.spec';
import { MATERIAL_IMPORTS } from '../../../../material.imports';

describe('VirtualBoxPreferencesComponent', () => {
    let component: VirtualBoxPreferencesComponent;
    let fixture: ComponentFixture<VirtualBoxPreferencesComponent>;

    let mockedServerService = new MockedServerService;
    let activatedRoute = new MockedActivatedRoute().get();
    
    beforeEach(async(() => {
        TestBed.configureTestingModule({
          imports: [MATERIAL_IMPORTS, CommonModule, NoopAnimationsModule, RouterTestingModule.withRoutes([])],
          providers: [
              {
                  provide: ActivatedRoute,  useValue: activatedRoute
              },
              { provide: ServerService, useValue: mockedServerService }
          ],
          declarations: [
              VirtualBoxPreferencesComponent
          ],
          schemas: [NO_ERRORS_SCHEMA]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(VirtualBoxPreferencesComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should clear path to virtual box manage', () => {
        component.restoreDefaults();

        expect(component.vboxManagePath).toBe('');
    });
});
