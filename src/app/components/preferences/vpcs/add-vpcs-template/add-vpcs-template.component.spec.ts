import { CommonModule } from '@angular/common';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatCheckboxModule, MatIconModule, MatMenuModule, MatToolbarModule } from '@angular/material';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';
import { Server } from '../../../../models/server';
import { VpcsTemplate } from '../../../../models/templates/vpcs-template';
import { ServerService } from '../../../../services/server.service';
import { MockedServerService } from '../../../../services/server.service.spec';
import { TemplateMocksService } from '../../../../services/template-mocks.service';
import { ToasterService } from '../../../../services/toaster.service';
import { MockedToasterService } from '../../../../services/toaster.service.spec';
import { VpcsService } from '../../../../services/vpcs.service';
import { MockedActivatedRoute } from '../../preferences.component.spec';
import { AddVpcsTemplateComponent } from './add-vpcs-template.component';

export class MockedVpcsService {
    public addTemplate(server: Server, vpcsTemplate: VpcsTemplate) {
        return of(vpcsTemplate);    
    }
}

describe('AddVpcsTemplateComponent', () => {
    let component: AddVpcsTemplateComponent;
    let fixture: ComponentFixture<AddVpcsTemplateComponent>;

    const mockedServerService = new MockedServerService;
    const mockedVpcsService = new MockedVpcsService;
    const mockedToasterService = new MockedToasterService;
    const activatedRoute = new MockedActivatedRoute().get();
    
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
                RouterTestingModule.withRoutes([{path: 'server/1/preferences/vpcs/templates', component: AddVpcsTemplateComponent}])
                ],
            providers: [
                { provide: ActivatedRoute,  useValue: activatedRoute },
                { provide: ServerService, useValue: mockedServerService },
                { provide: VpcsService, useValue: mockedVpcsService },
                { provide: ToasterService, useValue: mockedToasterService },
                { provide: TemplateMocksService, useClass: TemplateMocksService }
            ],
            declarations: [
                AddVpcsTemplateComponent
            ],
            schemas: [NO_ERRORS_SCHEMA]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(AddVpcsTemplateComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should call add template', () => {
        spyOn(mockedVpcsService, 'addTemplate').and.returnValue(of({} as VpcsTemplate));
        component.templateName = "sample name";
        component.templateNameForm.controls['templateName'].setValue('template name');
        component.server = {id: 1} as Server;

        component.addTemplate();

        expect(mockedVpcsService.addTemplate).toHaveBeenCalled();
    });

    it('should not call add template when template name is empty', () => {
        spyOn(mockedVpcsService, 'addTemplate').and.returnValue(of({} as VpcsTemplate));
        spyOn(mockedToasterService, 'error');
        component.templateName = "";
        component.server = {id: 1} as Server;

        component.addTemplate();

        expect(mockedVpcsService.addTemplate).not.toHaveBeenCalled();
        expect(mockedToasterService.error).toHaveBeenCalled();
    });
});
