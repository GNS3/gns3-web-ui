import { ComponentFixture, async, TestBed } from '@angular/core/testing';
import { MatIconModule, MatToolbarModule, MatMenuModule, MatCheckboxModule, MatTableModule } from '@angular/material';
import { CommonModule } from '@angular/common';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { Server } from '../../../../../models/server';
import { CloudTemplate } from '../../../../../models/templates/cloud-template';
import { CloudNodesTemplateDetailsComponent } from './cloud-nodes-template-details.component';
import { MockedServerService } from '../../../../../services/server.service.spec';
import { MockedToasterService } from '../../../../../services/toaster.service.spec';
import { MockedActivatedRoute } from '../../../preferences.component.spec';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ServerService } from '../../../../../services/server.service';
import { ToasterService } from '../../../../../services/toaster.service';
import { BuiltInTemplatesService } from '../../../../../services/built-in-templates.service';

export class MockedBuiltInTemplatesService {
    public getTemplate(server: Server, template_id: string) {
        return of({ports_mapping: []} as CloudTemplate);  
    }

    public saveTemplate(server: Server, cloudTemplate: CloudTemplate) {
        return of(cloudTemplate);    
    }
}

describe('CloudNodesTemplateDetailsComponent', () => {
    let component: CloudNodesTemplateDetailsComponent;
    let fixture: ComponentFixture<CloudNodesTemplateDetailsComponent>;

    let mockedServerService = new MockedServerService;
    let mockedBuiltInTemplatesService = new MockedBuiltInTemplatesService;
    let mockedToasterService = new MockedToasterService;
    let activatedRoute = new MockedActivatedRoute().get();
    
    beforeEach(async(() => {
        TestBed.configureTestingModule({
          imports: [FormsModule, ReactiveFormsModule, MatTableModule, MatIconModule, MatToolbarModule, MatMenuModule, MatCheckboxModule, CommonModule, NoopAnimationsModule, RouterTestingModule.withRoutes([])],
          providers: [
              {
                  provide: ActivatedRoute,  useValue: activatedRoute
              },
              { provide: ServerService, useValue: mockedServerService },
              { provide: BuiltInTemplatesService, useValue: mockedBuiltInTemplatesService },
              { provide: ToasterService, useValue: mockedToasterService}
          ],
          declarations: [
                CloudNodesTemplateDetailsComponent
          ],
          schemas: [NO_ERRORS_SCHEMA]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(CloudNodesTemplateDetailsComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should call save template', () => {
        spyOn(mockedBuiltInTemplatesService, 'saveTemplate').and.returnValue(of({} as CloudTemplate));

        component.cloudNodeTemplate = {ports_mapping: []} as CloudTemplate;
        component.onSave();

        expect(mockedBuiltInTemplatesService.saveTemplate).toHaveBeenCalled();
    });
});
