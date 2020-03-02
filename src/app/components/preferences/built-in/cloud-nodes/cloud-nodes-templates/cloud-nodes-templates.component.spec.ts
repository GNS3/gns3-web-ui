import { ComponentFixture, async, TestBed } from '@angular/core/testing';
import { CommonModule } from '@angular/common';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { Server } from '../../../../../models/server';
import { CloudTemplate } from '../../../../../models/templates/cloud-template';
import { MockedServerService } from '../../../../../services/server.service.spec';
import { MockedActivatedRoute } from '../../../preferences.component.spec';
import { ServerService } from '../../../../../services/server.service';
import { CloudNodesTemplatesComponent } from './cloud-nodes-templates.component';
import { BuiltInTemplatesService } from '../../../../../services/built-in-templates.service';
import { MATERIAL_IMPORTS } from '../../../../../material.imports';

export class MockedBuiltInTemplatesService {
    public getTemplates(server: Server) {
        return of([{} as CloudTemplate]);
    }
}

describe('CloudNodesTemplatesComponent', () => {
    let component: CloudNodesTemplatesComponent;
    let fixture: ComponentFixture<CloudNodesTemplatesComponent>;

    let mockedServerService = new MockedServerService;
    let mockedBuiltInTemplatesService = new MockedBuiltInTemplatesService;
    let activatedRoute = new MockedActivatedRoute().get();
    
    beforeEach(async(() => {
        TestBed.configureTestingModule({
          imports: [MATERIAL_IMPORTS, CommonModule, NoopAnimationsModule, RouterTestingModule.withRoutes([])],
          providers: [
              {
                  provide: ActivatedRoute,  useValue: activatedRoute
              },
              { provide: ServerService, useValue: mockedServerService },
              { provide: BuiltInTemplatesService, useValue: mockedBuiltInTemplatesService }
          ],
          declarations: [
              CloudNodesTemplatesComponent
          ],
          schemas: [NO_ERRORS_SCHEMA]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(CloudNodesTemplatesComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
