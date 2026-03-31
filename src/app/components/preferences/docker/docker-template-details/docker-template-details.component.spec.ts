import { CommonModule } from '@angular/common';
import { NO_ERRORS_SCHEMA, provideZonelessChangeDetection } from '@angular/core';
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
import { Controller } from '@models/controller';
import { DockerTemplate } from '@models/templates/docker-template';
import { DockerConfigurationService } from '@services/docker-configuration.service';
import { DockerService } from '@services/docker.service';
import { ControllerService } from '@services/controller.service';
import { MockedControllerService } from '@services/controller.service.spec';
import { ToasterService } from '@services/toaster.service';
import { MockedToasterService } from '@services/toaster.service.spec';
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

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        DockerTemplateDetailsComponent,
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
        provideZonelessChangeDetection(),
        {
          provide: ActivatedRoute,
          useValue: activatedRoute,
        },
        { provide: ControllerService, useValue: mockedControllerService },
        { provide: DockerService, useValue: mockedDockerService },
        { provide: ToasterService, useValue: mockedToasterService },
        { provide: DockerConfigurationService, useClass: DockerConfigurationService },
      ],
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

  // TODO: fix for Angular 21 - generalSettingsForm replaced with model signals
  xit('should call save template', () => {
    spyOn(mockedDockerService, 'saveTemplate').and.returnValue(of({} as DockerTemplate));
    component.name.set('template name');
    component.defaultNameFormat.set('default name');
    component.adaptersCount.set(1);
    component.symbol.set('symbol path');

    component.onSave();

    expect(mockedDockerService.saveTemplate).toHaveBeenCalled();
  });
});
