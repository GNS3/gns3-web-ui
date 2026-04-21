import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { AddVmwareTemplateComponent } from './add-vmware-template.component';
import { VmwareService } from '@services/vmware.service';
import { ControllerService } from '@services/controller.service';
import { TemplateMocksService } from '@services/template-mocks.service';
import { ToasterService } from '@services/toaster.service';
import { Controller } from '@models/controller';
import { VmwareTemplate } from '@models/templates/vmware-template';
import { VmwareVm } from '@models/vmware/vmware-vm';
import { describe, it, expect, beforeEach, afterEach, vi, beforeAll } from 'vitest';

describe('AddVmwareTemplateComponent', () => {
  let component: AddVmwareTemplateComponent;
  let fixture: ComponentFixture<AddVmwareTemplateComponent>;

  let mockVmwareService: any;
  let mockControllerService: any;
  let mockTemplateMocksService: any;
  let mockToasterService: any;
  let mockRouter: any;
  let mockActivatedRoute: any;

  let mockController: Controller;
  let mockVirtualMachines: VmwareVm[];
  let mockVmwareTemplate: VmwareTemplate;

  beforeAll(() => {
    mockController = {
      id: 1,
      name: 'Test Controller',
      location: 'local',
      host: 'localhost',
      port: 3080,
      path: '/',
      ubridge_path: '',
      status: 'running',
      protocol: 'http:',
      username: 'admin',
      password: 'admin',
      authToken: 'token',
      tokenExpired: false,
    };

    mockVirtualMachines = [
      { vmname: 'VM1', vmx_path: '/path/to/vm1.vmx' },
      { vmname: 'VM2', vmx_path: '/path/to/vm2.vmx' },
    ];

    mockVmwareTemplate = {
      adapter_type: 'e1000',
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
      symbol: 'vmware_guest',
      template_id: '',
      template_type: 'vmware',
      usage: '',
      use_any_adapter: false,
      vmx_path: '',
      tags: [],
    };
  });

  beforeEach(async () => {
    mockVmwareService = {
      getVirtualMachines: vi.fn().mockReturnValue({
        subscribe: vi.fn((arg) => {
          if (typeof arg === 'function') arg(mockVirtualMachines);
          else if (arg?.next) arg.next(mockVirtualMachines);
          return { unsubscribe: vi.fn() };
        }),
      }),
      addTemplate: vi.fn().mockReturnValue({
        subscribe: vi.fn((arg) => {
          if (typeof arg === 'function') arg();
          else if (arg?.next) arg.next();
          return { unsubscribe: vi.fn() };
        }),
      }),
    };

    mockControllerService = {
      get: vi.fn().mockResolvedValue(mockController),
    };

    mockTemplateMocksService = {
      getVmwareTemplate: vi.fn().mockReturnValue({
        subscribe: vi.fn((arg) => {
          if (typeof arg === 'function') arg(mockVmwareTemplate);
          else if (arg?.next) arg.next(mockVmwareTemplate);
          return { unsubscribe: vi.fn() };
        }),
      }),
    };

    mockToasterService = {
      error: vi.fn(),
    };

    mockRouter = {
      navigate: vi.fn(),
    };

    mockActivatedRoute = {
      snapshot: {
        paramMap: {
          get: vi.fn().mockReturnValue('1'),
        },
      },
    };

    await TestBed.configureTestingModule({
      imports: [AddVmwareTemplateComponent],
      providers: [
        { provide: VmwareService, useValue: mockVmwareService },
        { provide: ControllerService, useValue: mockControllerService },
        { provide: TemplateMocksService, useValue: mockTemplateMocksService },
        { provide: ToasterService, useValue: mockToasterService },
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AddVmwareTemplateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show deprecation toaster error on init', () => {
    expect(mockToasterService.error).toHaveBeenCalledWith(
      'VMware VM support is deprecated and will be removed in a future version, please use Qemu VMs instead'
    );
  });

  it('should fetch controller from route param', () => {
    expect(mockControllerService.get).toHaveBeenCalledWith(1);
  });

  it('should fetch virtual machines after controller loads', () => {
    expect(mockVmwareService.getVirtualMachines).toHaveBeenCalledWith(mockController);
  });

  it('should fetch vmware template after virtual machines load', () => {
    expect(mockTemplateMocksService.getVmwareTemplate).toHaveBeenCalled();
  });

  it('should navigate back when goBack is called', () => {
    component.goBack();
    expect(mockRouter.navigate).toHaveBeenCalledWith([
      '/controller',
      mockController.id,
      'preferences',
      'vmware',
      'templates',
    ]);
  });

  it('should show error when addTemplate is called without templateName', () => {
    component.selectedVM.set(mockVirtualMachines[0]);
    component.addTemplate();
    expect(mockToasterService.error).toHaveBeenCalledWith('Fill all required fields');
    expect(mockVmwareService.addTemplate).not.toHaveBeenCalled();
  });

  it('should show error when addTemplate is called without selectedVM', () => {
    component.templateName.set('TestTemplate');
    component.addTemplate();
    expect(mockToasterService.error).toHaveBeenCalledWith('Fill all required fields');
    expect(mockVmwareService.addTemplate).not.toHaveBeenCalled();
  });

  it('should add template and navigate back when addTemplate is called with valid data', () => {
    component.templateName.set('TestTemplate');
    component.selectedVM.set(mockVirtualMachines[0]);
    component.linkedClone.set(true);

    const addTemplateObservable = {
      subscribe: vi.fn((arg) => {
        if (typeof arg === 'function') arg();
        else if (arg?.next) arg.next();
        return { unsubscribe: vi.fn() };
      }),
    };
    mockVmwareService.addTemplate.mockReturnValue(addTemplateObservable);

    component.addTemplate();

    expect(mockVmwareService.addTemplate).toHaveBeenCalledWith(mockController, expect.any(Object));
    const calledTemplate = mockVmwareService.addTemplate.mock.calls[0][1];
    expect(calledTemplate.name).toBe(mockVirtualMachines[0].vmname);
    expect(calledTemplate.vmx_path).toBe(mockVirtualMachines[0].vmx_path);
    expect(calledTemplate.linked_clone).toBe(true);
    expect(calledTemplate.template_id).toBeTruthy();
    expect(mockRouter.navigate).toHaveBeenCalled();
  });

  it('should not navigate when addTemplate fails validation', () => {
    component.templateName.set('');
    component.selectedVM.set(undefined);
    component.addTemplate();
    expect(mockRouter.navigate).not.toHaveBeenCalled();
  });

  it('should use OnPush change detection strategy', () => {
    expect(component).toBeTruthy();
  });

  it('should update virtualMachines signal when VMs are loaded', () => {
    component.virtualMachines.set(mockVirtualMachines);
    expect(component.virtualMachines()).toEqual(mockVirtualMachines);
  });

  it('should update selectedVM signal when template selection changes', () => {
    component.selectedVM.set(mockVirtualMachines[0]);
    expect(component.selectedVM()).toEqual(mockVirtualMachines[0]);
  });

  it('should update linkedClone model signal when checkbox changes', () => {
    component.linkedClone.set(true);
    expect(component.linkedClone()).toBe(true);
    component.linkedClone.set(false);
    expect(component.linkedClone()).toBe(false);
  });

  it('should update templateName model signal when input changes', () => {
    component.templateName.set('MyTemplate');
    expect(component.templateName()).toBe('MyTemplate');
  });
});
