import { ComponentFixture, async, TestBed } from '@angular/core/testing';
import { CommonModule } from '@angular/common';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { ActivatedRoute } from '@angular/router';
import { Observable, of } from 'rxjs';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { MockedServerService } from '../../../../services/server.service.spec';
import { ServerService } from '../../../../services/server.service';
import { Server } from '../../../../models/server';
import { MockedActivatedRoute } from '../../preferences.component.spec';
import { VmwareTemplate } from '../../../../models/templates/vmware-template';
import { VmwareTemplatesComponent } from './vmware-templates.component';
import { VmwareService } from '../../../../services/vmware.service';
import { MATERIAL_IMPORTS } from '../../../../material.imports';

export class MockedVmwareService {
    public getTemplates(server: Server) {
        return of([{} as VmwareTemplate]);
    }
}

describe('VmwareTemplatesComponent', () => {
    let component: VmwareTemplatesComponent;
    let fixture: ComponentFixture<VmwareTemplatesComponent>;

    let mockedServerService = new MockedServerService;
    let mockedVmwareService = new MockedVmwareService;
    let activatedRoute = new MockedActivatedRoute().get();
    
    beforeEach(async(() => {
        TestBed.configureTestingModule({
          imports: [MATERIAL_IMPORTS, CommonModule, NoopAnimationsModule, RouterTestingModule.withRoutes([])],
          providers: [
              {
                  provide: ActivatedRoute,  useValue: activatedRoute
              },
              { provide: ServerService, useValue: mockedServerService },
              { provide: VmwareService, useValue: mockedVmwareService }
          ],
          declarations: [
              VmwareTemplatesComponent
          ],
          schemas: [NO_ERRORS_SCHEMA]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(VmwareTemplatesComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
