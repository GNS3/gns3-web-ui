import { CommonModule } from '@angular/common';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTableModule } from '@angular/material/table';
import { MatToolbarModule } from '@angular/material/toolbar';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';
import{ Controller } from '../../../../../models/controller';
import { CloudTemplate } from '../../../../../models/templates/cloud-template';
import { BuiltInTemplatesConfigurationService } from '../../../../../services/built-in-templates-configuration.service';
import { BuiltInTemplatesService } from '../../../../../services/built-in-templates.service';
import { ControllerService } from '../../../../../services/controller.service';
import { MockedControllerService } from '../../../../../services/controller.service.spec';
import { ToasterService } from '../../../../../services/toaster.service';
import { MockedToasterService } from '../../../../../services/toaster.service.spec';
import { MockedActivatedRoute } from '../../../preferences.component.spec';
import { CloudNodesTemplateDetailsComponent } from './cloud-nodes-template-details.component';

export class MockedBuiltInTemplatesService {
  public getTemplate(controller:Controller , template_id: string) {
    return of({ ports_mapping: [] } as CloudTemplate);
  }

  public saveTemplate(controller:Controller , cloudTemplate: CloudTemplate) {
    return of(cloudTemplate);
  }
}

describe('CloudNodesTemplateDetailsComponent', () => {
  let component: CloudNodesTemplateDetailsComponent;
  let fixture: ComponentFixture<CloudNodesTemplateDetailsComponent>;

  let mockedControllerService = new MockedControllerService();
  let mockedBuiltInTemplatesService = new MockedBuiltInTemplatesService();
  let mockedToasterService = new MockedToasterService();
  let activatedRoute = new MockedActivatedRoute().get();

  beforeEach(async() => {
  await  TestBed.configureTestingModule({
      imports: [
        FormsModule,
        ReactiveFormsModule,
        MatTableModule,
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
        { provide: BuiltInTemplatesService, useValue: mockedBuiltInTemplatesService },
        { provide: ToasterService, useValue: mockedToasterService },
        { provide: BuiltInTemplatesConfigurationService, useClass: BuiltInTemplatesConfigurationService },
      ],
      declarations: [CloudNodesTemplateDetailsComponent],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CloudNodesTemplateDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call save template', () => {
    spyOn(mockedBuiltInTemplatesService, 'saveTemplate').and.returnValue(of({} as CloudTemplate));

    component.cloudNodeTemplate = { ports_mapping: [] } as CloudTemplate;
    component.onSave();

    expect(mockedBuiltInTemplatesService.saveTemplate).toHaveBeenCalled();
  });
});
