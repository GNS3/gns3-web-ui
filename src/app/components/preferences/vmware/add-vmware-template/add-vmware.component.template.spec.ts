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
import { Server } from '../../../../models/server';
import { VmwareTemplate } from '../../../../models/templates/vmware-template';
import { VmwareVm } from '../../../../models/vmware/vmware-vm';
import { ServerService } from '../../../../services/server.service';
import { MockedServerService } from '../../../../services/server.service.spec';
import { TemplateMocksService } from '../../../../services/template-mocks.service';
import { ToasterService } from '../../../../services/toaster.service';
import { MockedToasterService } from '../../../../services/toaster.service.spec';
import { VmwareService } from '../../../../services/vmware.service';
import { MockedActivatedRoute } from '../../preferences.component.spec';
import { AddVmwareTemplateComponent } from './add-vmware-template.component';

export class MockedVmwareService {
  public addTemplate(server: Server, vmwareTemplate: VmwareTemplate) {
    return of(vmwareTemplate);
  }

  public getVirtualMachines(server: Server) {
    return of([]);
  }
}

describe('AddVmwareTemplateComponent', () => {
  let component: AddVmwareTemplateComponent;
  let fixture: ComponentFixture<AddVmwareTemplateComponent>;

  let mockedServerService = new MockedServerService();
  let mockedVmwareService = new MockedVmwareService();
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
        RouterTestingModule.withRoutes([
          { path: 'server/1/preferences/vmware/templates', component: AddVmwareTemplateComponent },
        ]),
      ],
      providers: [
        { provide: ActivatedRoute, useValue: activatedRoute },
        { provide: ServerService, useValue: mockedServerService },
        { provide: VmwareService, useValue: mockedVmwareService },
        { provide: ToasterService, useValue: mockedToasterService },
        { provide: TemplateMocksService, useClass: TemplateMocksService },
      ],
      declarations: [AddVmwareTemplateComponent],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AddVmwareTemplateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call save template', () => {
    spyOn(mockedVmwareService, 'addTemplate').and.returnValue(of({} as VmwareTemplate));
    let template: VmwareVm = {
      vmname: 'test',
      vmx_path: '',
    };

    component.vmwareTemplate = {} as VmwareTemplate;
    component.selectedVM = template;
    component.server = { id: 1 } as Server;
    component.templateNameForm.controls['templateName'].setValue('template name');

    component.addTemplate();

    expect(mockedVmwareService.addTemplate).toHaveBeenCalled();
  });

  it('should not call save template when virtual machine is not selected', () => {
    spyOn(mockedVmwareService, 'addTemplate').and.returnValue(of({} as VmwareTemplate));
    component.server = { id: 1 } as Server;

    component.addTemplate();

    expect(mockedVmwareService.addTemplate).not.toHaveBeenCalled();
  });
});
