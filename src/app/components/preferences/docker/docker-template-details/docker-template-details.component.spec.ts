import { CommonModule } from '@angular/common';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';
import { Controller } from '../../../../models/controller';
import { DockerTemplate } from '../../../../models/templates/docker-template';
import { DockerConfigurationService } from '../../../../services/docker-configuration.service';
import { DockerService } from '../../../../services/docker.service';
import { ControllerService } from '../../../../services/controller.service';
import { MockedControllerService } from '../../../../services/controller.service.spec';
import { ToasterService } from '../../../../services/toaster.service';
import { MockedToasterService } from '../../../../services/toaster.service.spec';
import { MockedActivatedRoute } from '../../preferences.component.spec';
import { DockerTemplateDetailsComponent } from './docker-template-details.component';

export class MockedDockerService {
  public getTemplate(controller: Controller, template_id: string) {
    return of({} as DockerTemplate);
  }

  public saveTemplate(controller: Controller, dockerTemplate: DockerTemplate) {
    return of(dockerTemplate);
  }
}

describe('DockerTemplateDetailsComponent', () => {
  let component: DockerTemplateDetailsComponent;
  let fixture: ComponentFixture<DockerTemplateDetailsComponent>;

  let mockedControllerService = new MockedControllerService();
  let mockedDockerService = new MockedDockerService();
  let mockedToasterService = new MockedToasterService();
  let activatedRoute = new MockedActivatedRoute().get();

  beforeEach(async() => {
   await TestBed.configureTestingModule({
      imports: [
        FormsModule,
        ReactiveFormsModule,
        MatIconModule,
        MatToolbarModule,
        MatMenuModule,
        MatCheckboxModule,
        CommonModule,
        NoopAnimationsModule,
        RouterTestingModule.withRoutes([]),
      ],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: activatedRoute,
        },
        { provide: ControllerService, useValue: mockedControllerService },
        { provide: DockerService, useValue: mockedDockerService },
        { provide: ToasterService, useValue: mockedToasterService },
        { provide: DockerConfigurationService, useClass: DockerConfigurationService },
      ],
      declarations: [DockerTemplateDetailsComponent],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  });

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
