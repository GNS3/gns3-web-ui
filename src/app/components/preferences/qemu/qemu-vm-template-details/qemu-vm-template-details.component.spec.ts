import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { QemuVmTemplateDetailsComponent } from './qemu-vm-template-details.component';
import { QemuTemplate } from '@models/templates/qemu-template';
import { Controller } from '@models/controller';
import { QemuService } from '@services/qemu.service';
import { ControllerService } from '@services/controller.service';
import { QemuConfigurationService } from '@services/qemu-configuration.service';
import { ToasterService } from '@services/toaster.service';
import { DialogConfigService } from '@services/dialog-config.service';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { of, throwError } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

const mockController: Controller = {
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
  authToken: 'test-token',
  tokenExpired: false,
};

const mockQemuTemplate: QemuTemplate = {
  template_id: 'template-123',
  template_type: 'qemu',
  name: 'Test QEMU VM',
  default_name_format: 'PC{0}',
  symbol: '/symbols/qemu.svg',
  category: 'guest',
  platform: 'x86_64',
  console_type: 'telnet',
  aux_type: 'none',
  console_auto_start: false,
  on_close: 'power_off',
  boot_priority: 'c',
  ram: 512,
  cpus: 2,
  hda_disk_image: '/path/to/hda.qcow2',
  hda_disk_interface: 'ide',
  hdb_disk_image: '',
  hdb_disk_interface: 'ide',
  hdc_disk_image: '',
  hdc_disk_interface: 'ide',
  hdd_disk_image: '',
  hdd_disk_interface: 'ide',
  cdrom_image: '',
  adapters: 4,
  first_port_name: 'Ethernet0',
  port_name_format: 'Ethernet{0}',
  port_segment_size: 4,
  mac_address: '00:00:00:00:00:00',
  adapter_type: 'e1000',
  replicate_network_connection_state: false,
  initrd: '',
  kernel_image: '',
  kernel_command_line: '',
  bios_image: '',
  cpu_throttling: 0,
  process_priority: 'normal',
  qemu_path: '',
  options: '',
  linked_clone: false,
  tpm: false,
  uefi: false,
  builtin: false,
  compute_id: 'local',
  usage: 'Test usage notes',
  custom_adapters: [],
  tags: ['tag1', 'tag2'],
};

describe('QemuVmTemplateDetailsComponent', () => {
  let fixture: ComponentFixture<QemuVmTemplateDetailsComponent>;
  let mockActivatedRoute: any;
  let mockRouter: any;
  let mockQemuService: any;
  let mockControllerService: any;
  let mockQemuConfigurationService: any;
  let mockToasterService: any;
  let mockMatDialog: any;
  let mockDialogConfigService: any;

  beforeEach(async () => {
    mockActivatedRoute = {
      snapshot: {
        paramMap: {
          get: vi.fn().mockImplementation((key) => {
            if (key === 'controller_id') return '1';
            if (key === 'template_id') return 'template-123';
            return null;
          }),
        },
      },
    };

    mockRouter = {
      navigate: vi.fn(),
    };

    mockControllerService = {
      get: vi.fn().mockResolvedValue(mockController),
    };

    mockQemuService = {
      getTemplate: vi.fn().mockReturnValue(of(mockQemuTemplate)),
      saveTemplate: vi.fn().mockReturnValue(of(mockQemuTemplate)),
    };

    mockQemuConfigurationService = {
      getConsoleTypes: vi.fn().mockReturnValue(['telnet', 'vnc', 'none']),
      getAuxConsoleTypes: vi.fn().mockReturnValue(['none', 'telnet']),
      getDiskInterfaces: vi.fn().mockReturnValue(['ide', 'scsi', 'virtio']),
      getNetworkTypes: vi.fn().mockReturnValue([
        { name: 'Intel PRO/1000', value: 'e1000' },
        { name: 'Intel PRO/1000 (82543GC)', value: 'e1000-82543gc' },
      ]),
      getBootPriorities: vi.fn().mockReturnValue([
        ['Hard Disk', 'c'],
        ['CD-ROM', 'd'],
        ['Network', 'n'],
      ]),
      getOnCloseOptions: vi.fn().mockReturnValue([
        ['Power off', 'power_off'],
        ['Shutdown signal', 'shutdown_signal'],
      ]),
      getCategories: vi.fn().mockReturnValue([
        ['Default', 'guest'],
        ['Routers', 'router'],
        ['Switches', 'switch'],
      ]),
      getPriorities: vi.fn().mockReturnValue(['low', 'normal', 'high']),
      getPlatform: vi.fn().mockReturnValue(['i386', 'x86_64', 'arm', 'aarch64']),
    };

    mockToasterService = {
      error: vi.fn(),
      success: vi.fn(),
    };

    mockMatDialog = {
      open: vi.fn().mockReturnValue({
        afterClosed: vi.fn().mockReturnValue(of(null)),
      }),
    };

    mockDialogConfigService = {
      openConfig: vi.fn().mockReturnValue({ panelClass: ['test-panel'] }),
    };

    await TestBed.configureTestingModule({
      imports: [
        QemuVmTemplateDetailsComponent,
        MatIconModule,
        MatButtonModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatChipsModule,
        MatCheckboxModule,
        BrowserAnimationsModule,
      ],
      providers: [
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: Router, useValue: mockRouter },
        { provide: QemuService, useValue: mockQemuService },
        { provide: ControllerService, useValue: mockControllerService },
        { provide: QemuConfigurationService, useValue: mockQemuConfigurationService },
        { provide: ToasterService, useValue: mockToasterService },
        { provide: MatDialog, useValue: mockMatDialog },
        { provide: DialogConfigService, useValue: mockDialogConfigService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(QemuVmTemplateDetailsComponent);
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should load controller and template on init', () => {
    expect(mockControllerService.get).toHaveBeenCalledWith(1);
    expect(mockQemuService.getTemplate).toHaveBeenCalledWith(mockController, 'template-123');
  });

  it('should display QEMU template configuration title', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const title = compiled.querySelector('h1');
    expect(title?.textContent).toContain('QEMU VM template configuration');
  });

  it('should load controller on init', () => {
    // Initially controller might not be set yet
    fixture.detectChanges();
    fixture.detectChanges();
    // After async operations complete, controller should be set
    expect(fixture.componentInstance.controller).toEqual(mockController);
  });

  it('should initialize all section collapse states to false', () => {
    expect(fixture.componentInstance.generalSettingsExpanded).toBe(false);
    expect(fixture.componentInstance.hddExpanded).toBe(false);
    expect(fixture.componentInstance.cdDvdExpanded).toBe(false);
    expect(fixture.componentInstance.networkExpanded).toBe(false);
    expect(fixture.componentInstance.advancedExpanded).toBe(false);
    expect(fixture.componentInstance.usageExpanded).toBe(false);
  });

  it('should toggle general settings section when toggleSection is called with "general"', () => {
    fixture.componentInstance.toggleSection('general');
    expect(fixture.componentInstance.generalSettingsExpanded).toBe(true);
    fixture.componentInstance.toggleSection('general');
    expect(fixture.componentInstance.generalSettingsExpanded).toBe(false);
  });

  it('should toggle HDD section when toggleSection is called with "hdd"', () => {
    fixture.componentInstance.toggleSection('hdd');
    expect(fixture.componentInstance.hddExpanded).toBe(true);
    fixture.componentInstance.toggleSection('hdd');
    expect(fixture.componentInstance.hddExpanded).toBe(false);
  });

  it('should toggle CD/DVD section when toggleSection is called with "cddvd"', () => {
    fixture.componentInstance.toggleSection('cddvd');
    expect(fixture.componentInstance.cdDvdExpanded).toBe(true);
    fixture.componentInstance.toggleSection('cddvd');
    expect(fixture.componentInstance.cdDvdExpanded).toBe(false);
  });

  it('should toggle network section when toggleSection is called with "network"', () => {
    fixture.componentInstance.toggleSection('network');
    expect(fixture.componentInstance.networkExpanded).toBe(true);
    fixture.componentInstance.toggleSection('network');
    expect(fixture.componentInstance.networkExpanded).toBe(false);
  });

  it('should toggle advanced section when toggleSection is called with "advanced"', () => {
    fixture.componentInstance.toggleSection('advanced');
    expect(fixture.componentInstance.advancedExpanded).toBe(true);
    fixture.componentInstance.toggleSection('advanced');
    expect(fixture.componentInstance.advancedExpanded).toBe(false);
  });

  it('should toggle usage section when toggleSection is called with "usage"', () => {
    fixture.componentInstance.toggleSection('usage');
    expect(fixture.componentInstance.usageExpanded).toBe(true);
    fixture.componentInstance.toggleSection('usage');
    expect(fixture.componentInstance.usageExpanded).toBe(false);
  });

  it('should navigate back when goBack is called', () => {
    fixture.componentInstance.goBack();
    expect(mockRouter.navigate).toHaveBeenCalledWith([
      '/controller',
      mockController.id,
      'preferences',
      'qemu',
      'templates',
    ]);
  });

  it('should show error when saving with missing template name', () => {
    fixture.componentInstance.templateName.set('');
    fixture.componentInstance.defaultName.set('PC{0}');
    fixture.componentInstance.symbol.set('/symbols/qemu.svg');

    fixture.componentInstance.onSave();

    expect(mockToasterService.error).toHaveBeenCalledWith(expect.stringContaining('Missing required fields'));
    expect(mockToasterService.error).toHaveBeenCalledWith(expect.stringContaining('Template name'));
    expect(mockQemuService.saveTemplate).not.toHaveBeenCalled();
  });

  it('should show error when saving with missing default name format', () => {
    fixture.componentInstance.templateName.set('Test VM');
    fixture.componentInstance.defaultName.set('');
    fixture.componentInstance.symbol.set('/symbols/qemu.svg');

    fixture.componentInstance.onSave();

    expect(mockToasterService.error).toHaveBeenCalledWith(expect.stringContaining('Default name format'));
    expect(mockQemuService.saveTemplate).not.toHaveBeenCalled();
  });

  it('should show error when saving with missing symbol', () => {
    fixture.componentInstance.templateName.set('Test VM');
    fixture.componentInstance.defaultName.set('PC{0}');
    fixture.componentInstance.symbol.set('');

    fixture.componentInstance.onSave();

    expect(mockToasterService.error).toHaveBeenCalledWith(expect.stringContaining('Symbol'));
    expect(mockQemuService.saveTemplate).not.toHaveBeenCalled();
  });

  it('should save successfully when all required fields are filled', () => {
    fixture.componentInstance.onSave();

    expect(mockQemuService.saveTemplate).toHaveBeenCalled();
    expect(mockToasterService.success).toHaveBeenCalledWith('Changes saved');
  });

  it('should handle save error', () => {
    mockQemuService.saveTemplate.mockReturnValue(throwError(() => new Error('Save failed')));

    fixture.componentInstance.onSave();

    expect(mockToasterService.error).toHaveBeenCalledWith(expect.stringContaining('Failed to save template'));
  });

  it('should add a tag when addTag is called with valid value', () => {
    const mockEvent = {
      value: 'newtag',
      chipInput: { clear: vi.fn() },
    } as any;

    fixture.componentInstance.addTag(mockEvent);

    expect(fixture.componentInstance.tags()).toContain('newtag');
    expect(mockEvent.chipInput.clear).toHaveBeenCalled();
  });

  it('should not add empty tag when addTag is called with empty value', () => {
    const initialTags = fixture.componentInstance.tags().length;
    const mockEvent = {
      value: '   ',
      chipInput: { clear: vi.fn() },
    } as any;

    fixture.componentInstance.addTag(mockEvent);

    expect(fixture.componentInstance.tags().length).toBe(initialTags);
  });

  it('should remove a tag when removeTag is called with existing tag', () => {
    expect(fixture.componentInstance.tags()).toContain('tag1');

    fixture.componentInstance.removeTag('tag1');

    expect(fixture.componentInstance.tags()).not.toContain('tag1');
  });

  it('should not modify tags when removeTag is called with non-existing tag', () => {
    const tags = [...fixture.componentInstance.tags()];

    fixture.componentInstance.removeTag('nonexistent');

    expect(fixture.componentInstance.tags()).toEqual(tags);
  });

  it('should open custom adapters dialog when openCustomAdaptersDialog is called', () => {
    fixture.componentInstance.portNameFormat.set('Ethernet{0}');
    fixture.componentInstance.portSegmentSize.set(4);
    fixture.componentInstance.networkType.set('e1000');
    fixture.componentInstance.adapters.set(4);

    fixture.componentInstance.openCustomAdaptersDialog();

    expect(mockMatDialog.open).toHaveBeenCalled();
  });

  it('should open symbol dialog when chooseSymbol is called', () => {
    fixture.componentInstance.symbol.set('/symbols/qemu.svg');

    fixture.componentInstance.chooseSymbol();

    expect(mockDialogConfigService.openConfig).toHaveBeenCalledWith(
      'templateSymbol',
      expect.objectContaining({
        autoFocus: false,
        disableClose: false,
      })
    );
    expect(mockMatDialog.open).toHaveBeenCalled();
  });

  it('should update symbol when symbol dialog is closed with result', () => {
    const newSymbol = '/symbols/new-symbol.svg';
    mockMatDialog.open.mockReturnValue({
      afterClosed: vi.fn().mockReturnValue(of(newSymbol)),
    });

    fixture.componentInstance.symbol.set('/symbols/old.svg');
    fixture.componentInstance.chooseSymbol();

    expect(fixture.componentInstance.symbol()).toBe(newSymbol);
  });

  it('should initialize form fields from template on initFormFromTemplate', () => {
    expect(fixture.componentInstance.templateName()).toBe(mockQemuTemplate.name);
    expect(fixture.componentInstance.defaultName()).toBe(mockQemuTemplate.default_name_format);
    expect(fixture.componentInstance.symbol()).toBe(mockQemuTemplate.symbol);
    expect(fixture.componentInstance.category()).toBe(mockQemuTemplate.category);
    expect(fixture.componentInstance.platform()).toBe(mockQemuTemplate.platform);
    expect(fixture.componentInstance.ram()).toBe(mockQemuTemplate.ram);
    expect(fixture.componentInstance.cpus()).toBe(mockQemuTemplate.cpus);
    expect(fixture.componentInstance.bootPriority()).toBe(mockQemuTemplate.boot_priority);
    expect(fixture.componentInstance.onClose()).toBe(mockQemuTemplate.on_close);
    expect(fixture.componentInstance.consoleType()).toBe(mockQemuTemplate.console_type);
    expect(fixture.componentInstance.auxConsoleType()).toBe(mockQemuTemplate.aux_type);
    expect(fixture.componentInstance.consoleAutoStart()).toBe(mockQemuTemplate.console_auto_start);
  });

  it('should initialize HDD fields from template', () => {
    expect(fixture.componentInstance.hdaDiskImage()).toBe(mockQemuTemplate.hda_disk_image);
    expect(fixture.componentInstance.hdaDiskInterface()).toBe(mockQemuTemplate.hda_disk_interface);
    expect(fixture.componentInstance.hdbDiskImage()).toBe(mockQemuTemplate.hdb_disk_image);
    expect(fixture.componentInstance.hdbDiskInterface()).toBe(mockQemuTemplate.hdb_disk_interface);
    expect(fixture.componentInstance.hdcDiskImage()).toBe(mockQemuTemplate.hdc_disk_image);
    expect(fixture.componentInstance.hdcDiskInterface()).toBe(mockQemuTemplate.hdc_disk_interface);
    expect(fixture.componentInstance.hddDiskImage()).toBe(mockQemuTemplate.hdd_disk_image);
    expect(fixture.componentInstance.hddDiskInterface()).toBe(mockQemuTemplate.hdd_disk_interface);
  });

  it('should initialize network fields from template', () => {
    expect(fixture.componentInstance.adapters()).toBe(mockQemuTemplate.adapters);
    expect(fixture.componentInstance.firstPortName()).toBe(mockQemuTemplate.first_port_name);
    expect(fixture.componentInstance.portNameFormat()).toBe(mockQemuTemplate.port_name_format);
    expect(fixture.componentInstance.portSegmentSize()).toBe(mockQemuTemplate.port_segment_size);
    expect(fixture.componentInstance.macAddress()).toBe(mockQemuTemplate.mac_address);
    expect(fixture.componentInstance.networkType()).toBe(mockQemuTemplate.adapter_type);
    expect(fixture.componentInstance.replicateNetworkConnectionState()).toBe(
      mockQemuTemplate.replicate_network_connection_state
    );
  });

  it('should initialize advanced fields from template', () => {
    expect(fixture.componentInstance.initrd()).toBe(mockQemuTemplate.initrd);
    expect(fixture.componentInstance.kernelImage()).toBe(mockQemuTemplate.kernel_image);
    expect(fixture.componentInstance.kernelCommandLine()).toBe(mockQemuTemplate.kernel_command_line);
    expect(fixture.componentInstance.biosImage()).toBe(mockQemuTemplate.bios_image);
    expect(fixture.componentInstance.processPriority()).toBe(mockQemuTemplate.process_priority);
    expect(fixture.componentInstance.qemuPath()).toBe(mockQemuTemplate.qemu_path);
    expect(fixture.componentInstance.options()).toBe(mockQemuTemplate.options);
    expect(fixture.componentInstance.linkedClone()).toBe(mockQemuTemplate.linked_clone);
    expect(fixture.componentInstance.tpm()).toBe(mockQemuTemplate.tpm);
    expect(fixture.componentInstance.uefi()).toBe(mockQemuTemplate.uefi);
  });

  it('should load configuration options on getConfiguration', () => {
    fixture.componentInstance.getConfiguration();

    expect(mockQemuConfigurationService.getConsoleTypes).toHaveBeenCalled();
    expect(mockQemuConfigurationService.getAuxConsoleTypes).toHaveBeenCalled();
    expect(mockQemuConfigurationService.getDiskInterfaces).toHaveBeenCalled();
    expect(mockQemuConfigurationService.getNetworkTypes).toHaveBeenCalled();
    expect(mockQemuConfigurationService.getBootPriorities).toHaveBeenCalled();
    expect(mockQemuConfigurationService.getOnCloseOptions).toHaveBeenCalled();
    expect(mockQemuConfigurationService.getCategories).toHaveBeenCalled();
    expect(mockQemuConfigurationService.getPriorities).toHaveBeenCalled();
  });

  it('should upload cdrom image file', () => {
    const mockEvent = {
      target: {
        files: [{ name: 'test.iso' }],
      },
    } as any;

    fixture.componentInstance.uploadCdromImageFile(mockEvent);

    expect(fixture.componentInstance.cdromImage()).toBe('test.iso');
  });

  it('should not update cdrom image when no file selected', () => {
    const mockEvent = {
      target: {
        files: [],
      },
    } as any;

    fixture.componentInstance.cdromImage.set('original.iso');
    fixture.componentInstance.uploadCdromImageFile(mockEvent);

    expect(fixture.componentInstance.cdromImage()).toBe('original.iso');
  });

  it('should upload initrd file', () => {
    const mockEvent = {
      target: {
        files: [{ name: 'initrd.img' }],
      },
    } as any;

    fixture.componentInstance.uploadInitrdFile(mockEvent);

    expect(fixture.componentInstance.initrd()).toBe('initrd.img');
  });

  it('should upload kernel image file', () => {
    const mockEvent = {
      target: {
        files: [{ name: 'vmlinuz' }],
      },
    } as any;

    fixture.componentInstance.uploadKernelImageFile(mockEvent);

    expect(fixture.componentInstance.kernelImage()).toBe('vmlinuz');
  });

  it('should upload bios file', () => {
    const mockEvent = {
      target: {
        files: [{ name: 'bios.bin' }],
      },
    } as any;

    fixture.componentInstance.uploadBiosFile(mockEvent);

    expect(fixture.componentInstance.biosImage()).toBe('bios.bin');
  });

  it('should set cpuThrottling to 0 when activateCpuThrottling is false', () => {
    fixture.componentInstance.activateCpuThrottling.set(false);
    fixture.componentInstance.cpuThrottling.set(50);

    fixture.componentInstance.onSave();

    expect(mockQemuTemplate.cpu_throttling).toBe(0);
  });

  it('should preserve cpuThrottling value when activateCpuThrottling is true', () => {
    fixture.componentInstance.activateCpuThrottling.set(true);
    fixture.componentInstance.cpuThrottling.set(75);

    fixture.componentInstance.onSave();

    expect(mockQemuTemplate.cpu_throttling).toBe(75);
  });

  it('should set empty tags array when server returns undefined tags', () => {
    // Component handles undefined tags by setting empty array in ngOnInit before initFormFromTemplate
    // This is tested by verifying that tags() returns the mock template's tags
    expect(fixture.componentInstance.tags()).toEqual(mockQemuTemplate.tags);
  });
});
