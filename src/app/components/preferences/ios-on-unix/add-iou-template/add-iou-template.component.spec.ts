import { ComponentFixture, async, TestBed } from '@angular/core/testing';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatSelectModule } from '@angular/material/select';
import { MatStepperModule } from '@angular/material/stepper';
import { MatTableModule } from '@angular/material/table';
import { MatToolbarModule } from '@angular/material/toolbar';
import { CommonModule } from '@angular/common';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { MockedServerService } from '../../../../services/server.service.spec';
import { ServerService } from '../../../../services/server.service';
import { Server } from '../../../../models/server';
import { ToasterService } from '../../../../services/toaster.service';
import { TemplateMocksService } from '../../../../services/template-mocks.service';
import { MockedToasterService } from '../../../../services/toaster.service.spec';
import { MockedActivatedRoute } from '../../preferences.component.spec';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IouTemplate } from '../../../../models/templates/iou-template';
import { AddIouTemplateComponent } from './add-iou-template.component';
import { IouService } from '../../../../services/iou.service';
import { IouConfigurationService } from '../../../../services/iou-configuration.service';

export class MockedIouService {
    public addTemplate(server: Server, iouTemplate: IouTemplate) {
        return of(iouTemplate);
    }
}

//Tests disabled due to instability
xdescribe('AddIouTemplateComponent', () => {
    let component: AddIouTemplateComponent;
    let fixture: ComponentFixture<AddIouTemplateComponent>;

    let mockedServerService = new MockedServerService;
    let mockedIouService = new MockedIouService;
    let mockedToasterService = new MockedToasterService;
    let activatedRoute = new MockedActivatedRoute().get();
    
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
                RouterTestingModule.withRoutes([{path: 'server/1/preferences/iou/templates', component: AddIouTemplateComponent}])
            ],
            providers: [
                { provide: ActivatedRoute,  useValue: activatedRoute },
                { provide: ServerService, useValue: mockedServerService },
                { provide: IouService, useValue: mockedIouService },
                { provide: ToasterService, useValue: mockedToasterService},
                { provide: TemplateMocksService, useClass: TemplateMocksService },
                { provide: IouConfigurationService, useClass: IouConfigurationService }
            ],
            declarations: [
                AddIouTemplateComponent
            ],
            schemas: [NO_ERRORS_SCHEMA]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(AddIouTemplateComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should call add template', () => {
        spyOn(mockedIouService, 'addTemplate').and.returnValue(of({} as IouTemplate));
        component.templateNameForm.controls['templateName'].setValue('sample name');
        component.imageForm.controls['imageName'].setValue('sample name');
        component.newImageSelected = true;
        component.server = {id: 1} as Server;

        component.addTemplate();

        expect(mockedIouService.addTemplate).toHaveBeenCalled();
    });

    it('should not call add template when template name is empty', () => {
        spyOn(mockedIouService, 'addTemplate').and.returnValue(of({} as IouTemplate));
        component.imageForm.controls['imageName'].setValue('sample name');
        component.newImageSelected = true;
        component.server = {id: 1} as Server;

        component.addTemplate();

        expect(mockedIouService.addTemplate).not.toHaveBeenCalled();
    });

    it('should not call add template when image is not entered', () => {
        spyOn(mockedIouService, 'addTemplate').and.returnValue(of({} as IouTemplate));
        component.templateNameForm.controls['templateName'].setValue('sample name');
        component.newImageSelected = true;
        component.server = {id: 1} as Server;

        component.addTemplate();

        expect(mockedIouService.addTemplate).not.toHaveBeenCalled();
    });
});
