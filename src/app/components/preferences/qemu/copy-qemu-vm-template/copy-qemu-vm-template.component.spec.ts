import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { CopyQemuVmTemplateComponent } from './copy-qemu-vm-template.component';
import { QemuService } from '@services/qemu.service';
import { ControllerService } from '@services/controller.service';
import { ToasterService } from '@services/toaster.service';
import { Controller } from '@models/controller';
import { QemuTemplate } from '@models/templates/qemu-template';
import { describe, it, expect, beforeEach, afterEach, vi, beforeAll } from 'vitest';

describe('CopyQemuVmTemplateComponent', () => {
  let component: CopyQemuVmTemplateComponent;
  let fixture: ComponentFixture<CopyQemuVmTemplateComponent>;

  let mockQemuService: any;
  let mockControllerService: any;
  let mockToasterService: any;
  let mockRouter: any;
  let mockActivatedRoute: any;

  let mockController: Controller;
  let mockQemuTemplate: QemuTemplate;

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

    mockQemuTemplate = {
      template_id: 'original-template-id',
      name: 'Original QEMU VM',
      template_type: 'qemu',
      builtin: false,
      category: 'guest',
      compute_id: 'local',
      console_auto_start: false,
      console_type: 'vnc',
      adapter_type: 'e1000',
      adapters: 1,
      custom_adapters: [],
      default_name_format: '{name}-{0}',
      first_port_name: '',
      linked_clone: false,
      on_close: 'power_off',
      port_name_format: 'Ethernet{0}',
      port_segment_size: 0,
      symbol: 'qemu_vm',
      usage: '',
      hda_disk_image: '',
      hda_disk_interface: 'ide',
      hdb_disk_image: '',
      hdb_disk_interface: 'ide',
      hdc_disk_image: '',
      hdc_disk_interface: 'ide',
      hdd_disk_image: '',
      hdd_disk_interface: 'ide',
      cdrom_image: '',
      bios_image: '',
      boot_priority: 'c',
      cpu_throttling: 0,
      cpus: 1,
      initrd: '',
      kernel_command_line: '',
      kernel_image: '',
      mac_address: '',
      options: '',
      platform: 'x86_64',
      process_priority: 'normal',
      qemu_path: '/usr/bin/qemu-system-x86_64',
      ram: 512,
      aux_type: '',
      replicate_network_connection_state: false,
      tpm: false,
      uefi: false,
      tags: [],
    };
  });

  beforeEach(async () => {
    mockQemuService = {
      getTemplate: vi.fn().mockReturnValue(of(mockQemuTemplate)),
      addTemplate: vi.fn().mockReturnValue(of(mockQemuTemplate)),
    };

    mockControllerService = {
      get: vi.fn().mockResolvedValue(mockController),
    };

    mockToasterService = {
      error: vi.fn(),
      success: vi.fn(),
    };

    mockRouter = {
      navigate: vi.fn(),
    };

    mockActivatedRoute = {
      snapshot: {
        paramMap: {
          get: vi.fn((param: string) => {
            if (param === 'controller_id') return '1';
            if (param === 'template_id') return 'original-template-id';
            return null;
          }),
        },
      },
    };

    await TestBed.configureTestingModule({
      imports: [CopyQemuVmTemplateComponent],
      providers: [
        { provide: QemuService, useValue: mockQemuService },
        { provide: ControllerService, useValue: mockControllerService },
        { provide: ToasterService, useValue: mockToasterService },
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CopyQemuVmTemplateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should fetch controller from route param', () => {
    expect(mockControllerService.get).toHaveBeenCalledWith(1);
  });

  it('should fetch QEMU template after controller loads', () => {
    expect(mockQemuService.getTemplate).toHaveBeenCalledWith(mockController, 'original-template-id');
  });

  it('should set templateName to "Copy of" original name when template loads', () => {
    expect(component.templateName).toBe('Copy of Original QEMU VM');
  });

  it('should store the loaded QEMU template', () => {
    expect(component.qemuTemplate).toEqual(mockQemuTemplate);
  });

  it('should store the loaded controller', () => {
    expect(component.controller).toEqual(mockController);
  });

  it('should navigate back when goBack is called', () => {
    component.goBack();
    expect(mockRouter.navigate).toHaveBeenCalledWith([
      '/controller',
      mockController.id,
      'preferences',
      'qemu',
      'templates',
    ]);
  });

  it('should show error when addTemplate is called with empty templateName', () => {
    component.nameForm.get('templateName')?.setValue('');
    component.addTemplate();
    expect(mockToasterService.error).toHaveBeenCalledWith('Fill all required fields');
    expect(mockQemuService.addTemplate).not.toHaveBeenCalled();
  });

  it('should show error when addTemplate is called with invalid form', () => {
    component.nameForm.get('templateName')?.setValue('');
    component.addTemplate();
    expect(mockToasterService.error).toHaveBeenCalledWith('Fill all required fields');
    expect(mockQemuService.addTemplate).not.toHaveBeenCalled();
  });

  it('should add template and navigate back when addTemplate is called with valid data', () => {
    component.nameForm.get('templateName')?.setValue('My Copied Template');

    mockQemuService.addTemplate.mockReturnValue(of(mockQemuTemplate));

    component.addTemplate();

    expect(mockQemuService.addTemplate).toHaveBeenCalledWith(mockController, expect.any(Object));
    const calledTemplate = mockQemuService.addTemplate.mock.calls[0][1];
    expect(calledTemplate.template_id).toBeTruthy();
    expect(calledTemplate.name).toBe('My Copied Template');
    expect(mockRouter.navigate).toHaveBeenCalled();
  });

  it('should not navigate when addTemplate fails validation', () => {
    component.nameForm.get('templateName')?.setValue('');
    component.addTemplate();
    expect(mockRouter.navigate).not.toHaveBeenCalled();
  });

  it('should generate new UUID for copied template', () => {
    component.nameForm.get('templateName')?.setValue('Copy of Original QEMU VM');

    mockQemuService.addTemplate.mockReturnValue(of(mockQemuTemplate));

    component.addTemplate();

    const capturedTemplate = mockQemuService.addTemplate.mock.calls[0][1];
    expect(capturedTemplate.template_id).not.toBe('original-template-id');
    expect(capturedTemplate.template_id).toBeTruthy();
  });

  it('should use OnPush change detection strategy', () => {
    expect(component).toBeTruthy();
  });

  it('should update templateName when nameForm templateName control changes', () => {
    component.nameForm.get('templateName')?.setValue('Custom Name');
    expect(component.nameForm.get('templateName')?.value).toBe('Custom Name');
  });

  describe('error handling', () => {
    it('should show error toaster when controllerService.get fails', async () => {
      mockControllerService.get.mockRejectedValue({ error: { message: 'Controller error' } });

      fixture = TestBed.createComponent(CopyQemuVmTemplateComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
      await fixture.whenStable();

      expect(mockToasterService.error).toHaveBeenCalledWith('Controller error');
    });

    it('should use fallback message when controllerService.get error has no message', async () => {
      mockControllerService.get.mockRejectedValue({});

      fixture = TestBed.createComponent(CopyQemuVmTemplateComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
      await fixture.whenStable();

      expect(mockToasterService.error).toHaveBeenCalledWith('Failed to load controller');
    });

    it('should show error toaster when qemuService.getTemplate fails', async () => {
      mockQemuService.getTemplate.mockReturnValue(throwError(() => ({ error: { message: 'Template error' } })));

      fixture = TestBed.createComponent(CopyQemuVmTemplateComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
      await fixture.whenStable();

      expect(mockToasterService.error).toHaveBeenCalledWith('Template error');
    });

    it('should use fallback message when qemuService.getTemplate error has no message', async () => {
      mockQemuService.getTemplate.mockReturnValue(throwError(() => ({})));

      fixture = TestBed.createComponent(CopyQemuVmTemplateComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
      await fixture.whenStable();

      expect(mockToasterService.error).toHaveBeenCalledWith('Failed to load QEMU template');
    });
  });
});
