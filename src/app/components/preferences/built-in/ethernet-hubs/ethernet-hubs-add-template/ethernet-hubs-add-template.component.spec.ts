import { ComponentFixture, async, TestBed } from '@angular/core/testing';
import { MatIconModule, MatToolbarModule, MatMenuModule, MatCheckboxModule } from '@angular/material';
import { CommonModule } from '@angular/common';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { Server } from '../../../../../models/server';
import { MockedServerService } from '../../../../../services/server.service.spec';
import { MockedToasterService } from '../../../../../services/toaster.service.spec';
import { MockedActivatedRoute } from '../../../preferences.component.spec';
import { ServerService } from '../../../../../services/server.service';
import { BuiltInTemplatesService } from '../../../../../services/built-in-templates.service';
import { ToasterService } from '../../../../../services/toaster.service';
import { TemplateMocksService } from '../../../../../services/template-mocks.service';
import { EthernetHubTemplate } from '../../../../../models/templates/ethernet-hub-template';
import { EthernetHubsAddTemplateComponent } from './ethernet-hubs-add-template.component';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';

export class MockedBuiltInTemplatesService {
    public addTemplate(server: Server, ethernetHubTemplate: EthernetHubTemplate) {
        return of(ethernetHubTemplate);    
    }
}

describe('EthernetHubsAddTemplateComponent', () => {
    let component: EthernetHubsAddTemplateComponent;
    let fixture: ComponentFixture<EthernetHubsAddTemplateComponent>;

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
                RouterTestingModule.withRoutes([{path: 'server/1/preferences/builtin/ethernet-hubs', component: EthernetHubsAddTemplateComponent}])
            ],
            providers: [
                {
                    provide: ActivatedRoute,  useValue: activatedRoute
                },
                { provide: ServerService, useValue: mockedServerService },
                { provide: BuiltInTemplatesService, useValue: mockedBuiltInTemplatesService },
                { provide: ToasterService, useValue: mockedToasterService},
                { provide: TemplateMocksService, useClass: TemplateMocksService }
            ],
            declarations: [
                EthernetHubsAddTemplateComponent
            ],
            schemas: [NO_ERRORS_SCHEMA]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(EthernetHubsAddTemplateComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should call add template', () => {
        spyOn(mockedBuiltInTemplatesService, 'addTemplate').and.returnValue(of({} as EthernetHubTemplate));
        component.templateName = "sample name";
        component.server = {id: 1} as Server;
        component.formGroup.controls['templateName'].setValue('template name');
        component.formGroup.controls['numberOfPorts'].setValue('1');

        component.addTemplate();

        expect(mockedBuiltInTemplatesService.addTemplate).toHaveBeenCalled();
    });

    it('should not call add template when template name is empty', () => {
        spyOn(mockedBuiltInTemplatesService, 'addTemplate').and.returnValue(of({} as EthernetHubTemplate));
        spyOn(mockedToasterService, 'error');
        component.templateName = "";
        component.server = {id: 1} as Server;

        component.addTemplate();

        expect(mockedBuiltInTemplatesService.addTemplate).not.toHaveBeenCalled();
        expect(mockedToasterService.error).toHaveBeenCalled();
    });

    it('should not call add template when number of ports is missing', () => {
        spyOn(mockedBuiltInTemplatesService, 'addTemplate').and.returnValue(of({} as EthernetHubTemplate));
        spyOn(mockedToasterService, 'error');
        component.templateName = "sample name";
        component.server = {id: 1} as Server;

        component.addTemplate();

        expect(mockedBuiltInTemplatesService.addTemplate).not.toHaveBeenCalled();
        expect(mockedToasterService.error).toHaveBeenCalled();
    });
});
