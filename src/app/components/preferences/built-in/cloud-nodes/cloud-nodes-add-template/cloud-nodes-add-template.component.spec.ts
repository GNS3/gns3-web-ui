import { ComponentFixture, async, TestBed } from '@angular/core/testing';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';
import { CommonModule } from '@angular/common';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { Server } from '../../../../../models/server';
import { CloudTemplate } from '../../../../../models/templates/cloud-template';
import { CloudNodesAddTemplateComponent } from './cloud-nodes-add-template.component';
import { MockedServerService } from '../../../../../services/server.service.spec';
import { MockedToasterService } from '../../../../../services/toaster.service.spec';
import { MockedActivatedRoute } from '../../../preferences.component.spec';
import { ServerService } from '../../../../../services/server.service';
import { BuiltInTemplatesService } from '../../../../../services/built-in-templates.service';
import { ToasterService } from '../../../../../services/toaster.service';
import { TemplateMocksService } from '../../../../../services/template-mocks.service';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

export class MockedBuiltInTemplatesService {
    public addTemplate(server: Server, cloudTemplate: CloudTemplate) {
        return of(cloudTemplate);    
    }
}

describe('CloudNodesAddTemplateComponent', () => {
    let component: CloudNodesAddTemplateComponent;
    let fixture: ComponentFixture<CloudNodesAddTemplateComponent>;

    let mockedServerService = new MockedServerService;
    let mockedBuiltInTemplatesService = new MockedBuiltInTemplatesService;
    let mockedToasterService = new MockedToasterService;
    let activatedRoute = new MockedActivatedRoute().get();
    
    beforeEach(async(() => {
        TestBed.configureTestingModule({
            imports: [
                FormsModule, 
                ReactiveFormsModule, 
                MatIconModule, 
                MatToolbarModule, 
                MatMenuModule, 
                MatCheckboxModule, 
                CommonModule, 
                NoopAnimationsModule, 
                RouterTestingModule.withRoutes([{path: 'server/1/preferences/builtin/cloud-nodes', component: CloudNodesAddTemplateComponent}])
            ],
            providers: [
                { provide: ActivatedRoute,  useValue: activatedRoute },
                { provide: ServerService, useValue: mockedServerService },
                { provide: BuiltInTemplatesService, useValue: mockedBuiltInTemplatesService },
                { provide: ToasterService, useValue: mockedToasterService },
                { provide: TemplateMocksService, useClass: TemplateMocksService }
            ],
            declarations: [
                CloudNodesAddTemplateComponent
            ],
            schemas: [NO_ERRORS_SCHEMA]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(CloudNodesAddTemplateComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should call add template', () => {
        spyOn(mockedBuiltInTemplatesService, 'addTemplate').and.returnValue(of({} as CloudTemplate));
        component.templateName = "sample name";
        component.server = {id: 1} as Server;
        component.formGroup.controls['templateName'].setValue('template name');

        component.addTemplate();

        expect(mockedBuiltInTemplatesService.addTemplate).toHaveBeenCalled();
    });

    it('should not call add template when template name is empty', () => {
        spyOn(mockedBuiltInTemplatesService, 'addTemplate').and.returnValue(of({} as CloudTemplate));
        spyOn(mockedToasterService, 'error');
        component.templateName = "";
        component.server = {id: 1} as Server;

        component.addTemplate();

        expect(mockedBuiltInTemplatesService.addTemplate).not.toHaveBeenCalled();
        expect(mockedToasterService.error).toHaveBeenCalled();
    });
});
