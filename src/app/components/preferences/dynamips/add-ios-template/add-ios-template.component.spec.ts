import { CommonModule } from '@angular/common';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule, MatCheckboxModule, MatFormFieldModule, MatIconModule, MatInputModule, MatMenuModule, MatSelectModule, MatStepperModule, MatTableModule, MatToolbarModule } from '@angular/material';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';
import { Server } from '../../../../models/server';
import { IosTemplate } from '../../../../models/templates/ios-template';
import { IosConfigurationService } from '../../../../services/ios-configuration.service';
import { IosService } from '../../../../services/ios.service';
import { ServerService } from '../../../../services/server.service';
import { MockedServerService } from '../../../../services/server.service.spec';
import { TemplateMocksService } from '../../../../services/template-mocks.service';
import { ToasterService } from '../../../../services/toaster.service';
import { MockedToasterService } from '../../../../services/toaster.service.spec';
import { MockedActivatedRoute } from '../../preferences.component.spec';
import { AddIosTemplateComponent } from './add-ios-template.component';

export class MockedIosService {
    public addTemplate(server: Server, iosTemplate: IosTemplate) {
        return of(iosTemplate);
    }
}

// Tests disabled due to instability
xdescribe('AddIosTemplateComponent', () => {
    let component: AddIosTemplateComponent;
    let fixture: ComponentFixture<AddIosTemplateComponent>;

    const mockedServerService = new MockedServerService;
    const mockedIosService = new MockedIosService;
    const mockedToasterService = new MockedToasterService;
    const activatedRoute = new MockedActivatedRoute().get();
    
    beforeEach(async(() => {
        TestBed.configureTestingModule({
            imports: [
                MatStepperModule, 
                FormsModule, 
                MatTableModule, 
                MatAutocompleteModule, 
                MatFormFieldModule, 
                MatInputModule, 
                ReactiveFormsModule, 
                MatSelectModule, 
                MatIconModule, 
                MatToolbarModule, 
                MatMenuModule, 
                MatCheckboxModule, 
                CommonModule, 
                NoopAnimationsModule, 
                RouterTestingModule.withRoutes([{path: 'server/1/preferences/dynamips/templates', component: AddIosTemplateComponent}])
            ],
            providers: [
                { provide: ActivatedRoute,  useValue: activatedRoute },
                { provide: ServerService, useValue: mockedServerService },
                { provide: IosService, useValue: mockedIosService },
                { provide: ToasterService, useValue: mockedToasterService},
                { provide: TemplateMocksService, useClass: TemplateMocksService },
                { provide: IosConfigurationService, useClass: IosConfigurationService }
            ],
            declarations: [
                AddIosTemplateComponent
            ],
            schemas: [NO_ERRORS_SCHEMA]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(AddIosTemplateComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should call add template', () => {
        spyOn(mockedIosService, 'addTemplate').and.returnValue(of({} as IosTemplate));
        component.iosImageForm.controls['imageName'].setValue('image name');
        component.iosNameForm.controls['templateName'].setValue('template name');
        component.iosNameForm.controls['platform'].setValue('platform');
        component.iosNameForm.controls['chassis'].setValue('chassis');
        component.iosMemoryForm.controls['memory'].setValue(0);
        component.server = {id: 1} as Server;

        component.addTemplate();

        expect(mockedIosService.addTemplate).toHaveBeenCalled();
    });

    it('should not call add template when template name is not defined', () => {
        spyOn(mockedIosService, 'addTemplate').and.returnValue(of({} as IosTemplate));
        component.iosImageForm.controls['imageName'].setValue('image name');
        component.iosNameForm.controls['templateName'].setValue('');
        component.iosNameForm.controls['platform'].setValue('platform');
        component.iosNameForm.controls['chassis'].setValue('chassis');
        component.iosMemoryForm.controls['memory'].setValue(0);
        component.server = {id: 1} as Server;

        component.addTemplate();

        expect(mockedIosService.addTemplate).not.toHaveBeenCalled();
    });

    it('should not call add template when image name is not defined', () => {
        spyOn(mockedIosService, 'addTemplate').and.returnValue(of({} as IosTemplate));
        component.iosNameForm.controls['templateName'].setValue('template name');
        component.iosNameForm.controls['platform'].setValue('platform');
        component.iosNameForm.controls['chassis'].setValue('chassis');
        component.iosMemoryForm.controls['memory'].setValue(0);
        component.server = {id: 1} as Server;

        component.addTemplate();

        expect(mockedIosService.addTemplate).not.toHaveBeenCalled();
    });

    it('should not call add template when memory is not defined', () => {
        spyOn(mockedIosService, 'addTemplate').and.returnValue(of({} as IosTemplate));
        component.iosImageForm.controls['imageName'].setValue('image name');
        component.iosNameForm.controls['templateName'].setValue('template name');
        component.iosNameForm.controls['platform'].setValue('platform');
        component.iosNameForm.controls['chassis'].setValue('chassis');
        component.server = {id: 1} as Server;

        component.addTemplate();

        expect(mockedIosService.addTemplate).not.toHaveBeenCalled();
    });
});
