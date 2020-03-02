import { ComponentFixture, async, TestBed } from '@angular/core/testing';
import { CommonModule } from '@angular/common';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { MockedServerService } from '../../../../services/server.service.spec';
import { ServerService } from '../../../../services/server.service';
import { Server } from '../../../../models/server';
import { MockedToasterService } from '../../../../services/toaster.service.spec';
import { ToasterService } from '../../../../services/toaster.service';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MockedActivatedRoute } from '../../preferences.component.spec';
import { DockerTemplate } from '../../../../models/templates/docker-template';
import { DockerTemplateDetailsComponent } from './docker-template-details.component';
import { DockerService } from '../../../../services/docker.service';
import { DockerConfigurationService } from '../../../../services/docker-configuration.service';
import { MATERIAL_IMPORTS } from '../../../../material.imports';

export class MockedDockerService {
    public getTemplate(server: Server, template_id: string) {
        return of({} as DockerTemplate);  
    }

    public saveTemplate(server: Server, dockerTemplate: DockerTemplate) {
        return of(dockerTemplate);    
    }
}

describe('DockerTemplateDetailsComponent', () => {
    let component: DockerTemplateDetailsComponent;
    let fixture: ComponentFixture<DockerTemplateDetailsComponent>;

    let mockedServerService = new MockedServerService;
    let mockedDockerService = new MockedDockerService;
    let mockedToasterService = new MockedToasterService;
    let activatedRoute = new MockedActivatedRoute().get();
    
    beforeEach(async(() => {
        TestBed.configureTestingModule({
          imports: [FormsModule, ReactiveFormsModule, MATERIAL_IMPORTS, CommonModule, NoopAnimationsModule, RouterTestingModule.withRoutes([])],
          providers: [
              {
                  provide: ActivatedRoute,  useValue: activatedRoute
              },
              { provide: ServerService, useValue: mockedServerService },
              { provide: DockerService, useValue: mockedDockerService },
              { provide: ToasterService, useValue: mockedToasterService },
              { provide: DockerConfigurationService, useClass: DockerConfigurationService }
          ],
          declarations: [
              DockerTemplateDetailsComponent
          ],
          schemas: [NO_ERRORS_SCHEMA]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(DockerTemplateDetailsComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should call save template', () => {
        spyOn(mockedDockerService, 'saveTemplate').and.returnValue(of({} as DockerTemplate));
        component.generalSettingsForm.controls['templateName'].setValue('template name');
        component.generalSettingsForm.controls['defaultName'].setValue('default name');
        component.generalSettingsForm.controls['adapter'].setValue(1);
        component.generalSettingsForm.controls['symbol'].setValue('symbol path');

        component.onSave();

        expect(mockedDockerService.saveTemplate).toHaveBeenCalled();
    });
});
