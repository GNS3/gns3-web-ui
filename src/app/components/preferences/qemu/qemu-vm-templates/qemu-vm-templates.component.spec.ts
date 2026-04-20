import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { of } from 'rxjs';
import { QemuVmTemplatesComponent } from './qemu-vm-templates.component';
import { ControllerService } from '@services/controller.service';
import { QemuService } from '@services/qemu.service';
import { TemplateService } from '@services/template.service';
import { ToasterService } from '@services/toaster.service';
import { Controller } from '@models/controller';
import { QemuTemplate } from '@models/templates/qemu-template';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('QemuVmTemplatesComponent', () => {
  let component: QemuVmTemplatesComponent;
  let fixture: ComponentFixture<QemuVmTemplatesComponent>;

  let mockControllerService: any;
  let mockQemuService: any;
  let mockRouter: any;
  let mockActivatedRoute: any;
  let mockDeleteComponent: any;

  let mockController: Controller;
  let mockQemuTemplates: QemuTemplate[];

  const createMockQemuTemplate = (id: string, name: string, builtin: boolean = false): QemuTemplate => ({
    adapter_type: 'e1000',
    adapters: 1,
    bios_image: '',
    boot_priority: 'c',
    builtin,
    category: 'guest',
    cdrom_image: '',
    compute_id: 'local',
    console_auto_start: false,
    console_type: 'telnet',
    aux_type: '',
    cpu_throttling: 0,
    cpus: 1,
    custom_adapters: [],
    default_name_format: '{name}-{0}',
    first_port_name: '',
    hda_disk_image: '',
    hda_disk_interface: 'ide',
    hdb_disk_image: '',
    hdb_disk_interface: 'ide',
    hdc_disk_image: '',
    hdc_disk_interface: 'ide',
    hdd_disk_image: '',
    hdd_disk_interface: 'ide',
    initrd: '',
    kernel_command_line: '',
    kernel_image: '',
    linked_clone: false,
    mac_address: '',
    name,
    on_close: '',
    options: '',
    platform: 'x86_64',
    port_name_format: '',
    port_segment_size: 0,
    process_priority: 'normal',
    qemu_path: '/usr/bin/qemu-system-x86_64',
    ram: 256,
    symbol: 'computer',
    template_id: id,
    template_type: 'qemu',
    usage: '',
    replicate_network_connection_state: false,
    tpm: false,
    uefi: false,
    tags: [],
  });

  beforeEach(async () => {
    mockController = {
      id: 1,
      authToken: '',
      name: 'Test Controller',
      location: 'local',
      host: '192.168.1.100',
      port: 3080,
      path: '',
      ubridge_path: '',
      status: 'running',
      protocol: 'http:',
      username: '',
      password: '',
      tokenExpired: false,
    } as Controller;

    mockQemuTemplates = [
      createMockQemuTemplate('tmpl-1', 'Test VM 1'),
      createMockQemuTemplate('tmpl-2', 'Test VM 2'),
      createMockQemuTemplate('tmpl-3', 'Builtin VM', true),
    ];

    mockActivatedRoute = {
      snapshot: {
        paramMap: {
          get: vi.fn((key: string) => {
            if (key === 'controller_id') return '1';
            return null;
          }),
        },
      },
    };

    mockControllerService = {
      get: vi.fn().mockResolvedValue(mockController),
    };

    mockQemuService = {
      getTemplates: vi.fn().mockReturnValue(of(mockQemuTemplates)),
    };

    mockRouter = {
      navigate: vi.fn(),
    };

    mockDeleteComponent = {
      deleteItem: vi.fn(),
    };

    const mockMatDialog = {
      open: vi.fn().mockReturnValue({ afterClosed: vi.fn().mockReturnValue(of(true)) }),
    };

    const mockTemplateService = {
      deleteTemplate: vi.fn().mockReturnValue(of({})),
    };

    const mockToasterService = {
      success: vi.fn(),
      error: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [QemuVmTemplatesComponent, RouterModule],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: ControllerService, useValue: mockControllerService },
        { provide: QemuService, useValue: mockQemuService },
        { provide: Router, useValue: mockRouter },
        { provide: MatDialog, useValue: mockMatDialog },
        { provide: TemplateService, useValue: mockTemplateService },
        { provide: ToasterService, useValue: mockToasterService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(QemuVmTemplatesComponent);
    component = fixture.componentInstance;

    // Set up viewChild mock using Object.defineProperty
    Object.defineProperty(component, 'deleteComponent', {
      get: () => () => mockDeleteComponent,
      configurable: true,
    });
  });

  afterEach(() => {
    fixture.destroy();
  });

  describe('Creation', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should have empty qemuTemplates initially', () => {
      expect(component.qemuTemplates).toEqual([]);
    });

    it('should not have controller initially', () => {
      expect(component.controller).toBeUndefined();
    });
  });

  describe('ngOnInit', () => {
    it('should fetch controller by id from route params', async () => {
      fixture.detectChanges();
      await fixture.whenStable();

      expect(mockControllerService.get).toHaveBeenCalledWith(1);
    });

    it('should set controller on component after loading', async () => {
      fixture.detectChanges();
      await fixture.whenStable();

      expect(component.controller).toBe(mockController);
    });

    it('should call getTemplates after controller is loaded', async () => {
      fixture.detectChanges();
      await fixture.whenStable();

      expect(mockQemuService.getTemplates).toHaveBeenCalledWith(mockController);
    });
  });

  describe('getTemplates', () => {
    it('should filter qemuTemplates to only include templates with template_type === "qemu" and builtin === false', async () => {
      fixture.detectChanges();
      await fixture.whenStable();

      expect(component.qemuTemplates).toHaveLength(2);
      expect(component.qemuTemplates[0].template_id).toBe('tmpl-1');
      expect(component.qemuTemplates[1].template_id).toBe('tmpl-2');
    });

    it('should not include builtin templates', async () => {
      fixture.detectChanges();
      await fixture.whenStable();

      expect(component.qemuTemplates.some((t) => t.builtin)).toBe(false);
    });

    it('should not include templates with template_type !== "qemu"', async () => {
      const templatesWithMixedTypes = [
        createMockQemuTemplate('tmpl-1', 'QEMU VM'),
        { ...createMockQemuTemplate('tmpl-2', 'VPCS VM'), template_type: 'vpcs' },
      ];
      mockQemuService.getTemplates.mockReturnValue(of(templatesWithMixedTypes));

      fixture.detectChanges();
      await fixture.whenStable();

      expect(component.qemuTemplates).toHaveLength(1);
      expect(component.qemuTemplates[0].template_type).toBe('qemu');
    });
  });

  describe('deleteTemplate', () => {
    it('should call deleteComponent().deleteItem with template name and id', async () => {
      fixture.detectChanges();
      await fixture.whenStable();

      const template = component.qemuTemplates[0];
      component.deleteTemplate(template);

      expect(mockDeleteComponent.deleteItem).toHaveBeenCalledWith(template.name, template.template_id);
    });

    it('should call deleteComponent even when qemuTemplates is empty', async () => {
      fixture.detectChanges();
      await fixture.whenStable();

      const mockEmptyDeleteComponent = { deleteItem: vi.fn() };
      Object.defineProperty(component, 'deleteComponent', {
        get: () => () => mockEmptyDeleteComponent,
        configurable: true,
      });

      const template = { name: 'Some Template', template_id: 'some-id' } as QemuTemplate;
      component.deleteTemplate(template);

      expect(mockEmptyDeleteComponent.deleteItem).toHaveBeenCalledWith('Some Template', 'some-id');
    });
  });

  describe('onDeleteEvent', () => {
    it('should call getTemplates to refresh the list', async () => {
      fixture.detectChanges();
      await fixture.whenStable();

      const getTemplatesSpy = vi.spyOn(component, 'getTemplates');
      component.onDeleteEvent();

      expect(getTemplatesSpy).toHaveBeenCalled();
    });
  });

  describe('copyTemplate', () => {
    it('should navigate to copy template page', async () => {
      fixture.detectChanges();
      await fixture.whenStable();

      const template = component.qemuTemplates[0];
      component.copyTemplate(template);

      expect(mockRouter.navigate).toHaveBeenCalledWith([
        '/controller',
        mockController.id,
        'preferences',
        'qemu',
        'templates',
        template.template_id,
        'copy',
      ]);
    });

    it('should navigate with correct template id', async () => {
      fixture.detectChanges();
      await fixture.whenStable();

      const template = component.qemuTemplates[1];
      component.copyTemplate(template);

      expect(mockRouter.navigate).toHaveBeenCalledWith([
        '/controller',
        1,
        'preferences',
        'qemu',
        'templates',
        'tmpl-2',
        'copy',
      ]);
    });
  });

  describe('Template rendering', () => {
    it('should show empty templates list when no templates exist', async () => {
      mockQemuService.getTemplates.mockReturnValue(of([]));

      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('app-empty-templates-list')).toBeTruthy();
    });

    it('should show template list when templates exist', async () => {
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('.qemu-vm-templates__list')).toBeTruthy();
    });

    it('should display template names in the list', async () => {
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('Test VM 1');
      expect(compiled.textContent).toContain('Test VM 2');
    });
  });

  describe('Edge cases', () => {
    it('should handle template with all properties set', async () => {
      const fullTemplate: QemuTemplate = {
        ...createMockQemuTemplate('full-tmpl', 'Full VM'),
        ram: 2048,
        hda_disk_image: '/path/to/disk.qcow2',
        cdrom_image: '/path/to/cdrom.iso',
        bios_image: '/path/to/bios.bin',
        kernel_image: '/path/to/kernel',
        initrd: '/path/to/initrd',
        mac_address: '00:11:22:33:44:55',
        options: '-enable-kvm',
        platform: 'x86_64',
        console_type: 'vnc',
        console_auto_start: true,
        linked_clone: true,
        uefi: true,
        tags: ['tag1', 'tag2'],
      };

      mockQemuService.getTemplates.mockReturnValue(of([fullTemplate]));

      fixture.detectChanges();
      await fixture.whenStable();

      expect(component.qemuTemplates).toHaveLength(1);
      expect(component.qemuTemplates[0].name).toBe('Full VM');
    });
  });
});
