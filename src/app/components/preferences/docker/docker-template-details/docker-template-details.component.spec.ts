import { CommonModule } from '@angular/common';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';
import { Server } from '../../../../models/server';
import { DockerTemplate } from '../../../../models/templates/docker-template';
import { DockerConfigurationService } from '../../../../services/docker-configuration.service';
import { DockerService } from '../../../../services/docker.service';
import { ServerService } from '../../../../services/server.service';
import { MockedServerService } from '../../../../services/server.service.spec';
import { ToasterService } from '../../../../services/toaster.service';
import { MockedToasterService } from '../../../../services/toaster.service.spec';
import { MockedActivatedRoute } from '../../preferences.component.spec';
import { DockerTemplateDetailsComponent } from './docker-template-details.component';

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

  let mockedServerService = new MockedServerService();
  let mockedDockerService = new MockedDockerService();
  let mockedToasterService = new MockedToasterService();
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
        RouterTestingModule.withRoutes([]),
      ],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: activatedRoute,
        },
        { provide: ServerService, useValue: mockedServerService },
        { provide: DockerService, useValue: mockedDockerService },
        { provide: ToasterService, useValue: mockedToasterService },
        { provide: DockerConfigurationService, useClass: DockerConfigurationService },
      ],
      declarations: [DockerTemplateDetailsComponent],
      schemas: [NO_ERRORS_SCHEMA],
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
