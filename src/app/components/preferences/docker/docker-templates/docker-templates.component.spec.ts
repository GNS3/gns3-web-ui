import { CommonModule } from '@angular/common';
import { NO_ERRORS_SCHEMA, provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
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
import { DockerService } from '@services/docker.service';
import { TemplateService } from '@services/template.service';
import { ToasterService } from '@services/toaster.service';
import { MockedToasterService } from '@services/toaster.service.spec';
import { ControllerService } from '@services/controller.service';
import { MockedControllerService } from '@services/controller.service.spec';
import { MockedActivatedRoute } from '../../preferences.component.spec';
import { DockerTemplatesComponent } from './docker-templates.component';

export class MockedDockerService {
  public getTemplates(controller: Controller) {
    return of([{} as DockerTemplate]);
  }
}

class MockedTemplateService {
  deleteTemplate(controller: Controller, templateId: string) {
    return of({});
  }
}

describe('DockerTemplatesComponent', () => {
  let component: DockerTemplatesComponent;
  let fixture: ComponentFixture<DockerTemplatesComponent>;

  let mockedControllerService = new MockedControllerService();
  let mockedDockerService = new MockedDockerService();
  let activatedRoute = new MockedActivatedRoute().get();

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        DockerTemplatesComponent,
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
        { provide: ActivatedRoute, useValue: activatedRoute },
        { provide: ControllerService, useValue: mockedControllerService },
        { provide: DockerService, useValue: mockedDockerService },
        { provide: TemplateService, useClass: MockedTemplateService },
        { provide: ToasterService, useValue: new MockedToasterService() },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DockerTemplatesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
