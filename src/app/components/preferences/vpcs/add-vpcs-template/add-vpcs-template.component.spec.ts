import { CommonModule } from '@angular/common';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import {  ComponentFixture, TestBed } from '@angular/core/testing';
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
import { VpcsTemplate } from '@models/templates/vpcs-template';
import { ComputeService } from '@services/compute.service';
import { ControllerService } from '@services/controller.service';
import { MockedControllerService } from '@services/controller.service.spec';
import { TemplateMocksService } from '@services/template-mocks.service';
import { ToasterService } from '@services/toaster.service';
import { MockedToasterService } from '@services/toaster.service.spec';
import { VpcsService } from '@services/vpcs.service';
import { MockedActivatedRoute } from '../../preferences.component.spec';
import { AddVpcsTemplateComponent } from './add-vpcs-template.component';

export class MockedComputeService {
  getComputes(controller: Controller ) {
    return of([]);
  }
}

export class MockedVpcsService {
  public addTemplate(controller: Controller, vpcsTemplate: VpcsTemplate) {
    return of(vpcsTemplate);
  }
}

describe('AddVpcsTemplateComponent', () => {
  let component: AddVpcsTemplateComponent;
  let fixture: ComponentFixture<AddVpcsTemplateComponent>;

  let mockedControllerService = new MockedControllerService();
  let mockedVpcsService = new MockedVpcsService();
  let mockedToasterService = new MockedToasterService();
  let activatedRoute = new MockedActivatedRoute().get();
  let mockedComputeService = new MockedComputeService();

  beforeEach(() => {
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
          { path: 'controller/1/preferences/vpcs/templates', component: AddVpcsTemplateComponent },
        ]),
      ],
      providers: [
        { provide: ActivatedRoute, useValue: activatedRoute },
        { provide: ControllerService, useValue: mockedControllerService },
        { provide: VpcsService, useValue: mockedVpcsService },
        { provide: ToasterService, useValue: mockedToasterService },
        { provide: ComputeService, useValue: mockedComputeService },
        { provide: TemplateMocksService, useClass: TemplateMocksService },
      ],
      declarations: [AddVpcsTemplateComponent],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AddVpcsTemplateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call add template', () => {
    spyOn(mockedVpcsService, 'addTemplate').and.returnValue(of({} as VpcsTemplate));
    component.templateName = 'sample name';
    component.templateNameForm.controls['templateName'].setValue('template name');
    component.controller = { id: 1 } as Controller;

    component.addTemplate();

    expect(mockedVpcsService.addTemplate).toHaveBeenCalled();
  });

  it('should not call add template when template name is empty', () => {
    spyOn(mockedVpcsService, 'addTemplate').and.returnValue(of({} as VpcsTemplate));
    spyOn(mockedToasterService, 'error');
    component.templateName = ' ';
    component.controller = { id: 1 } as Controller;

    component.addTemplate();

    expect(mockedVpcsService.addTemplate).not.toHaveBeenCalled();
    expect(mockedToasterService.error).toHaveBeenCalled();
  });
});
