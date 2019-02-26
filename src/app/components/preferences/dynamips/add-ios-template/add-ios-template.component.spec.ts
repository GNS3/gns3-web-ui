import { ComponentFixture, async, TestBed } from '@angular/core/testing';
import { MatInputModule, MatIconModule, MatToolbarModule, MatMenuModule, MatCheckboxModule, MatSelectModule, MatFormFieldModule, MatAutocompleteModule, MatTableModule } from '@angular/material';
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
import { IosTemplate } from '../../../../models/templates/ios-template';
import { AddIosTemplateComponent } from './add-ios-template.component';
import { IosService } from '../../../../services/ios.service';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IosConfigurationService } from '../../../../services/ios-configuration.service';

export class MockedIosService {
    public addTemplate(server: Server, iosTemplate: IosTemplate) {
        return of(iosTemplate);
    }
}

describe('AddIosTemplateComponent', () => {
    let component: AddIosTemplateComponent;
    let fixture: ComponentFixture<AddIosTemplateComponent>;

    let mockedServerService = new MockedServerService;
    let mockedIosService = new MockedIosService;
    let mockedToasterService = new MockedToasterService;
    let activatedRoute = new MockedActivatedRoute().get();
    
    beforeEach(async(() => {
        TestBed.configureTestingModule({
          imports: [ FormsModule, MatTableModule, MatAutocompleteModule, MatFormFieldModule, MatInputModule, ReactiveFormsModule, MatSelectModule, MatIconModule, MatToolbarModule, MatMenuModule, MatCheckboxModule, CommonModule, NoopAnimationsModule, RouterTestingModule.withRoutes([])],
          providers: [
              {
                  provide: ActivatedRoute,  useValue: activatedRoute
              },
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
