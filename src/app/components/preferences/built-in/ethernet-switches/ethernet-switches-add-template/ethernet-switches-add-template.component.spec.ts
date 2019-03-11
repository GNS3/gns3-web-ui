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
import { EthernetSwitchTemplate } from '../../../../../models/templates/ethernet-switch-template';
import { EthernetSwitchesAddTemplateComponent } from './ethernet-switches-add-template.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

export class MockedBuiltInTemplatesService {
    public addTemplate(server: Server, ethernetHubTemplate: EthernetSwitchTemplate) {
        return of(ethernetHubTemplate);    
    }
}

describe('EthernetSwitchesAddTemplateComponent', () => {
    let component: EthernetSwitchesAddTemplateComponent;
    let fixture: ComponentFixture<EthernetSwitchesAddTemplateComponent>;

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
                RouterTestingModule.withRoutes([{path: 'server/1/preferences/builtin/ethernet-switches', component: EthernetSwitchesAddTemplateComponent}])
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
                EthernetSwitchesAddTemplateComponent
            ],
            schemas: [NO_ERRORS_SCHEMA]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(EthernetSwitchesAddTemplateComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should call add template', () => {
        spyOn(mockedBuiltInTemplatesService, 'addTemplate').and.returnValue(of({} as EthernetSwitchTemplate));
        component.templateName = "sample name";
        component.numberOfPorts = 2;
        component.server = {id: 1} as Server;
        component.formGroup.controls['templateName'].setValue('template name');
        component.formGroup.controls['numberOfPorts'].setValue('1');

        component.addTemplate();

        expect(mockedBuiltInTemplatesService.addTemplate).toHaveBeenCalled();
    });

    it('should not call add template when template name is empty', () => {
        spyOn(mockedBuiltInTemplatesService, 'addTemplate').and.returnValue(of({} as EthernetSwitchTemplate));
        spyOn(mockedToasterService, 'error');
        component.formGroup.controls['numberOfPorts'].setValue('1');
        component.server = {id: 1} as Server;

        component.addTemplate();

        expect(mockedBuiltInTemplatesService.addTemplate).not.toHaveBeenCalled();
        expect(mockedToasterService.error).toHaveBeenCalled();
    });

    it('should not call add template when number of ports is missing', () => {
        spyOn(mockedBuiltInTemplatesService, 'addTemplate').and.returnValue(of({} as EthernetSwitchTemplate));
        spyOn(mockedToasterService, 'error');
        component.formGroup.controls['templateName'].setValue('template name');
        component.server = {id: 1} as Server;

        component.addTemplate();

        expect(mockedBuiltInTemplatesService.addTemplate).not.toHaveBeenCalled();
        expect(mockedToasterService.error).toHaveBeenCalled();
    });
});
