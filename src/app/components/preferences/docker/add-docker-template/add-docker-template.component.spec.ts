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
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DockerTemplate } from '../../../../models/templates/docker-template';
import { AddDockerTemplateComponent } from './add-docker-template.component';
import { DockerService } from '../../../../services/docker.service';
import { DockerConfigurationService } from '../../../../services/docker-configuration.service';

export class MockedDockerService {
    public addTemplate(server: Server, dockerTemplate: DockerTemplate) {
        return of(dockerTemplate);
    }
}

describe('AddDockerTemplateComponent', () => {
    let component: AddDockerTemplateComponent;
    let fixture: ComponentFixture<AddDockerTemplateComponent>;

    let mockedServerService = new MockedServerService;
    let mockedDockerService = new MockedDockerService;
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
              { provide: DockerService, useValue: mockedDockerService },
              { provide: ToasterService, useValue: mockedToasterService},
              { provide: TemplateMocksService, useClass: TemplateMocksService },
              { provide: DockerConfigurationService, useClass: DockerConfigurationService }
          ],
          declarations: [
              AddDockerTemplateComponent
          ],
          schemas: [NO_ERRORS_SCHEMA]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(AddDockerTemplateComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should call add template', () => {
        spyOn(mockedDockerService, 'addTemplate').and.returnValue(of({} as DockerTemplate));
        component.virtualMachineForm.controls['filename'].setValue('sample name');
        component.containerNameForm.controls['templateName'].setValue('template name');
        component.networkAdaptersForm.controls['adapters'].setValue(1);
        component.server = {id: 1} as Server;

        component.addTemplate();

        expect(mockedDockerService.addTemplate).toHaveBeenCalled();
    });

    it('should not call add template when file name is missing', () => {
        spyOn(mockedDockerService, 'addTemplate').and.returnValue(of({} as DockerTemplate));
        component.containerNameForm.controls['templateName'].setValue('template name');
        component.networkAdaptersForm.controls['adapters'].setValue(1);
        component.server = {id: 1} as Server;

        component.addTemplate();

        expect(mockedDockerService.addTemplate).not.toHaveBeenCalled();
    });

    it('should not call add template when template name is missing', () => {
        spyOn(mockedDockerService, 'addTemplate').and.returnValue(of({} as DockerTemplate));
        component.virtualMachineForm.controls['filename'].setValue('sample name');
        component.networkAdaptersForm.controls['adapters'].setValue(1);
        component.server = {id: 1} as Server;

        component.addTemplate();

        expect(mockedDockerService.addTemplate).not.toHaveBeenCalled();
    });

    it('should not call add template when adapters field is empty', () => {
        spyOn(mockedDockerService, 'addTemplate').and.returnValue(of({} as DockerTemplate));
        component.virtualMachineForm.controls['filename'].setValue('sample name');
        component.containerNameForm.controls['templateName'].setValue('template name');
        component.server = {id: 1} as Server;

        component.addTemplate();

        expect(mockedDockerService.addTemplate).not.toHaveBeenCalled();
    });
});
