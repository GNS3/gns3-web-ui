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
import { Server } from '../../../../../models/server';
import { CloudTemplate } from '../../../../../models/templates/cloud-template';
import { BuiltInTemplatesService } from '../../../../../services/built-in-templates.service';
import { ComputeService } from '../../../../../services/compute.service';
import { ServerService } from '../../../../../services/server.service';
import { MockedServerService } from '../../../../../services/server.service.spec';
import { TemplateMocksService } from '../../../../../services/template-mocks.service';
import { ToasterService } from '../../../../../services/toaster.service';
import { MockedToasterService } from '../../../../../services/toaster.service.spec';
import { MockedComputeService } from '../../../../preferences/vpcs/add-vpcs-template/add-vpcs-template.component.spec';
import { MockedActivatedRoute } from '../../../preferences.component.spec';
import { CloudNodesAddTemplateComponent } from './cloud-nodes-add-template.component';

export class MockedBuiltInTemplatesService {
  public addTemplate(server: Server, cloudTemplate: CloudTemplate) {
    return of(cloudTemplate);
  }
}

describe('CloudNodesAddTemplateComponent', () => {
  let component: CloudNodesAddTemplateComponent;
  let fixture: ComponentFixture<CloudNodesAddTemplateComponent>;

  let mockedServerService = new MockedServerService();
  let mockedBuiltInTemplatesService = new MockedBuiltInTemplatesService();
  let mockedToasterService = new MockedToasterService();
  let mockedComputeService = new MockedComputeService();
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
        RouterTestingModule.withRoutes([
          { path: 'server/1/preferences/builtin/cloud-nodes', component: CloudNodesAddTemplateComponent },
        ]),
      ],
      providers: [
        { provide: ActivatedRoute, useValue: activatedRoute },
        { provide: ServerService, useValue: mockedServerService },
        { provide: BuiltInTemplatesService, useValue: mockedBuiltInTemplatesService },
        { provide: ToasterService, useValue: mockedToasterService },
        { provide: ComputeService, useValue: mockedComputeService },
        { provide: TemplateMocksService, useClass: TemplateMocksService },
      ],
      declarations: [CloudNodesAddTemplateComponent],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CloudNodesAddTemplateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call add template', () => {
    spyOn(mockedBuiltInTemplatesService, 'addTemplate').and.returnValue(of({} as CloudTemplate));
    component.templateName = 'sample name';
    component.server = { id: 1 } as Server;
    component.formGroup.controls['templateName'].setValue('template name');

    component.addTemplate();

    expect(mockedBuiltInTemplatesService.addTemplate).toHaveBeenCalled();
  });

  it('should not call add template when template name is empty', () => {
    spyOn(mockedBuiltInTemplatesService, 'addTemplate').and.returnValue(of({} as CloudTemplate));
    spyOn(mockedToasterService, 'error');
    component.templateName = '';
    component.server = { id: 1 } as Server;

    component.addTemplate();

    expect(mockedBuiltInTemplatesService.addTemplate).not.toHaveBeenCalled();
    expect(mockedToasterService.error).toHaveBeenCalled();
  });
});
