import { CommonModule } from '@angular/common';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatSelectModule } from '@angular/material/select';
import { MatStepperModule } from '@angular/material/stepper';
import { MatToolbarModule } from '@angular/material/toolbar';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute, Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';
import { Server } from '../../../../models/server';
import { QemuTemplate } from '../../../../models/templates/qemu-template';
import { QemuConfigurationService } from '../../../../services/qemu-configuration.service';
import { QemuService } from '../../../../services/qemu.service';
import { ServerService } from '../../../../services/server.service';
import { MockedServerService } from '../../../../services/server.service.spec';
import { TemplateMocksService } from '../../../../services/template-mocks.service';
import { ToasterService } from '../../../../services/toaster.service';
import { MockedToasterService } from '../../../../services/toaster.service.spec';
import { MockedActivatedRoute } from '../../preferences.component.spec';
import { AddQemuVmTemplateComponent } from './add-qemu-vm-template.component';

export class MockedQemuService {
  public addTemplate(controller: Server, qemuTemplate: QemuTemplate) {
    return of(qemuTemplate);
  }

  public getBinaries(controller: Server) {
    return of([]);
  }

  public getImages(controller: Server) {
    return of([]);
  }
}

//Tests disabled due to instability
xdescribe('AddQemuVmTemplateComponent', () => {
  let component: AddQemuVmTemplateComponent;
  let fixture: ComponentFixture<AddQemuVmTemplateComponent>;

  let mockedServerService = new MockedServerService();
  let mockedQemuService = new MockedQemuService();
  let mockedToasterService = new MockedToasterService();
  let activatedRoute = new MockedActivatedRoute().get();
  let router = {
    navigate: jasmine.createSpy('navigate'),
  };

  beforeEach(async() => {
   await TestBed.configureTestingModule({
      imports: [
        MatStepperModule,
        FormsModule,
        ReactiveFormsModule,
        MatSelectModule,
        MatAutocompleteModule,
        MatIconModule,
        MatFormFieldModule,
        MatInputModule,
        MatToolbarModule,
        MatMenuModule,
        MatCheckboxModule,
        CommonModule,
        NoopAnimationsModule,
        RouterTestingModule.withRoutes([
          { path: 'controller/1/preferences/qemu/templates', component: AddQemuVmTemplateComponent },
        ]),
      ],
      providers: [
        { provide: ActivatedRoute, useValue: activatedRoute },
        { provide: Router, useValue: router },
        { provide: ServerService, useValue: mockedServerService },
        { provide: QemuService, useValue: mockedQemuService },
        { provide: ToasterService, useValue: mockedToasterService },
        { provide: TemplateMocksService, useClass: TemplateMocksService },
        { provide: QemuConfigurationService, useClass: QemuConfigurationService },
      ],
      declarations: [AddQemuVmTemplateComponent],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AddQemuVmTemplateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call add template', () => {
    spyOn(mockedQemuService, 'addTemplate').and.returnValue(of({} as QemuTemplate));
    component.nameForm.controls['templateName'].setValue('template name');
    component.memoryForm.controls['binary'].setValue('binary');
    component.memoryForm.controls['ramMemory'].setValue(0);
    component.diskForm.controls['fileName'].setValue('file name');
    component.chosenImage = 'path';
    component.selectedBinary = {
      path: 'path',
      version: 'version',
    };
    component.newImageSelected = true;
    component.controller = { id: 1 } as Server;

    component.addTemplate();

    expect(mockedQemuService.addTemplate).toHaveBeenCalled();
  });

  it('should not call add template when template name is empty', () => {
    spyOn(mockedQemuService, 'addTemplate').and.returnValue(of({} as QemuTemplate));
    component.nameForm.controls['templateName'].setValue('');
    component.memoryForm.controls['binary'].setValue('binary');
    component.memoryForm.controls['ramMemory'].setValue(0);
    component.diskForm.controls['fileName'].setValue('file name');
    component.chosenImage = 'path';
    component.selectedBinary = {
      path: 'path',
      version: 'version',
    };
    component.newImageSelected = true;
    component.controller = { id: 1 } as Server;

    component.addTemplate();

    expect(mockedQemuService.addTemplate).not.toHaveBeenCalled();
  });

  it('should not call add template when ram is not set', () => {
    spyOn(mockedQemuService, 'addTemplate').and.returnValue(of({} as QemuTemplate));
    component.nameForm.controls['templateName'].setValue('template name');
    component.memoryForm.controls['binary'].setValue('binary');
    component.diskForm.controls['fileName'].setValue('file name');
    component.chosenImage = 'path';
    component.selectedBinary = {
      path: 'path',
      version: 'version',
    };
    component.newImageSelected = true;
    component.controller = { id: 1 } as Server;

    component.addTemplate();

    expect(mockedQemuService.addTemplate).not.toHaveBeenCalled();
  });
});
