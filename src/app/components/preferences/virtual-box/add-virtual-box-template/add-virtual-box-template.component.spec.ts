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
import { Controller } from '../../../../models/controller';
import { VirtualBoxTemplate } from '../../../../models/templates/virtualbox-template';
import { ControllerService } from '../../../../services/controller.service';
import { MockedControllerService } from '../../../../services/controller.service.spec';
import { TemplateMocksService } from '../../../../services/template-mocks.service';
import { ToasterService } from '../../../../services/toaster.service';
import { MockedToasterService } from '../../../../services/toaster.service.spec';
import { VirtualBoxService } from '../../../../services/virtual-box.service';
import { MockedActivatedRoute } from '../../preferences.component.spec';
import { AddVirtualBoxTemplateComponent } from './add-virtual-box-template.component';

export class MockedVirtualBoxService {
  public addTemplate(controller:Controller , virtualBoxTemplate: VirtualBoxTemplate) {
    return of(virtualBoxTemplate);
  }

  public getVirtualMachines(controller:Controller ) {
    return of([]);
  }
}

describe('AddVirtualBoxTemplateComponent', () => {
  let component: AddVirtualBoxTemplateComponent;
  let fixture: ComponentFixture<AddVirtualBoxTemplateComponent>;

  let mockedControllerService = new MockedControllerService();
  let mockedVirtualBoxService = new MockedVirtualBoxService();
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
          { path: 'controller/1/preferences/virtualbox/templates', component: AddVirtualBoxTemplateComponent },
        ]),
      ],
      providers: [
        { provide: ActivatedRoute, useValue: activatedRoute },
        { provide: ControllerService, useValue: mockedControllerService },
        { provide: VirtualBoxService, useValue: mockedVirtualBoxService },
        { provide: ToasterService, useValue: mockedToasterService },
        { provide: TemplateMocksService, useClass: TemplateMocksService },
      ],
      declarations: [AddVirtualBoxTemplateComponent],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AddVirtualBoxTemplateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call save template', () => {
    spyOn(mockedVirtualBoxService, 'addTemplate').and.returnValue(of({} as VirtualBoxTemplate));
    let template: VirtualBoxTemplate = {
      adapter_type: 'Intel PRO/1000 MT Desktop (82540EM)',
      adapters: 1,
      builtin: false,
      category: 'guest',
      compute_id: 'local',
      console_auto_start: false,
      console_type: 'none',
      custom_adapters: [],
      default_name_format: '{name}-{0}',
      first_port_name: '',
      headless: false,
      linked_clone: false,
      name: '',
      on_close: 'power_off',
      port_name_format: 'Ethernet{0}',
      port_segment_size: 0,
      ram: 0,
      symbol: 'vbox_guest',
      template_id: '',
      template_type: 'virtualbox',
      usage: '',
      use_any_adapter: false,
      vmname: '',
    };
    component.virtualBoxTemplate = {} as VirtualBoxTemplate;
    component.selectedVM = template;
    component.controller = { id: 1 } as Controller ;
    component.vmForm.controls['vm'].setValue('virtual machine');

    component.addTemplate();

    expect(mockedVirtualBoxService.addTemplate).toHaveBeenCalled();
  });

  it('should not call save template when virtual machine is not selected', () => {
    spyOn(mockedVirtualBoxService, 'addTemplate').and.returnValue(of({} as VirtualBoxTemplate));
    component.controller = { id: 1 } as Controller ;

    component.addTemplate();

    expect(mockedVirtualBoxService.addTemplate).not.toHaveBeenCalled();
  });
});
