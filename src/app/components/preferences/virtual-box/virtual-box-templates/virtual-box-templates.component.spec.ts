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
import { VirtualBoxTemplate } from '../../../../models/templates/virtualbox-template';
import { VirtualBoxTemplatesComponent } from './virtual-box-templates.component';
import { VirtualBoxService } from '../../../../services/virtual-box.service';
import { MockedActivatedRoute } from '../../preferences.component.spec';
import { MATERIAL_IMPORTS } from '../../../../material.imports';

export class MockedVirtualBoxService {
    public getTemplates(server: Server) {
        return of([{} as VirtualBoxTemplate]);
    }
}

describe('VirtualBoxTemplatesComponent', () => {
    let component: VirtualBoxTemplatesComponent;
    let fixture: ComponentFixture<VirtualBoxTemplatesComponent>;

    let mockedServerService = new MockedServerService;
    let mockedVirtualBoxService = new MockedVirtualBoxService;
    let activatedRoute = new MockedActivatedRoute().get();
    
    beforeEach(async(() => {
        TestBed.configureTestingModule({
          imports: [MATERIAL_IMPORTS, CommonModule, NoopAnimationsModule, RouterTestingModule.withRoutes([])],
          providers: [
              {
                  provide: ActivatedRoute,  useValue: activatedRoute
              },
              { provide: ServerService, useValue: mockedServerService },
              { provide: VirtualBoxService, useValue: mockedVirtualBoxService }
          ],
          declarations: [
              VirtualBoxTemplatesComponent
          ],
          schemas: [NO_ERRORS_SCHEMA]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(VirtualBoxTemplatesComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
