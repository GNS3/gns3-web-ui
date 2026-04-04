import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { VmwareTemplateDetailsComponent } from './vmware-template-details.component';
import { VmwareTemplate } from '@models/templates/vmware-template';
import { Controller } from '@models/controller';
import { VmwareService } from '@services/vmware.service';
import { ControllerService } from '@services/controller.service';
import { VmwareConfigurationService } from '@services/vmware-configuration.service';
import { ToasterService } from '@services/toaster.service';
import { DialogConfigService } from '@services/dialog-config.service';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { of } from 'rxjs';
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

const mockVmwareTemplate: VmwareTemplate = {
  template_id: 'template-123',
  template_type: 'vmware',
  name: 'Test VMware VM',
  default_name_format: 'PC{0}',
  symbol: '/symbols/vmware.svg',
  category: 'guest',
  console_type: 'telnet',
  console_auto_start: false,
  on_close: 'power_off',
  headless: false,
  linked_clone: false,
  adapters: 4,
  first_port_name: 'Ethernet0',
  port_name_format: 'Ethernet{0}',
  port_segment_size: 4,
  adapter_type: 'e1000',
  use_any_adapter: false,
  custom_adapters: [],
  usage: 'Test usage notes',
  vmx_path: '/path/to/vm.vmx',
  builtin: false,
  compute_id: 'local',
  tags: ['tag1', 'tag2'],
};

describe('VmwareTemplateDetailsComponent', () => {
  let fixture: ComponentFixture<VmwareTemplateDetailsComponent>;
  let mockActivatedRoute: any;
  let mockRouter: any;
  let mockVmwareService: any;
  let mockControllerService: any;
  let mockVmwareConfigurationService: any;
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

    mockVmwareService = {
      getTemplate: vi.fn().mockReturnValue(of(mockVmwareTemplate)),
      saveTemplate: vi.fn().mockReturnValue(of(mockVmwareTemplate)),
    };

    mockVmwareConfigurationService = {
      getConsoleTypes: vi.fn().mockReturnValue(['telnet', 'none']),
      getCategories: vi.fn().mockReturnValue([
        ['Default', 'guest'],
        ['Routers', 'router'],
        ['Switches', 'switch'],
      ]),
      getOnCloseoptions: vi.fn().mockReturnValue([
        ['Power off the VM', 'power_off'],
        ['Send the shutdown signal', 'shutdown_signal'],
      ]),
      getNetworkTypes: vi.fn().mockReturnValue(['e1000', 'e1000e', 'vmxnet3']),
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
        VmwareTemplateDetailsComponent,
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
        { provide: VmwareService, useValue: mockVmwareService },
        { provide: ControllerService, useValue: mockControllerService },
        { provide: VmwareConfigurationService, useValue: mockVmwareConfigurationService },
        { provide: ToasterService, useValue: mockToasterService },
        { provide: MatDialog, useValue: mockMatDialog },
        { provide: DialogConfigService, useValue: mockDialogConfigService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(VmwareTemplateDetailsComponent);
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
    expect(mockVmwareService.getTemplate).toHaveBeenCalledWith(mockController, 'template-123');
  });

  it('should display VMware template configuration title', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const title = compiled.querySelector('h1');
    expect(title?.textContent).toContain('VMware VM template configuration');
  });

  it('should display back button after controller is loaded', async () => {
    // Call detectChanges twice: once to trigger ngOnInit, once more to pick up async changes
    fixture.detectChanges();
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const backButton = compiled.querySelector('.vmware-template-details__back-btn');
    expect(backButton).toBeTruthy();
  });

  it('should expand general settings section by default when generalSettingsExpanded is false initially', () => {
    expect(fixture.componentInstance.generalSettingsExpanded).toBe(false);
  });

  it('should toggle general settings section when toggleSection is called with "general"', () => {
    fixture.componentInstance.toggleSection('general');
    expect(fixture.componentInstance.generalSettingsExpanded).toBe(true);
    fixture.componentInstance.toggleSection('general');
    expect(fixture.componentInstance.generalSettingsExpanded).toBe(false);
  });

  it('should toggle network section when toggleSection is called with "network"', () => {
    fixture.componentInstance.toggleSection('network');
    expect(fixture.componentInstance.networkExpanded).toBe(true);
    fixture.componentInstance.toggleSection('network');
    expect(fixture.componentInstance.networkExpanded).toBe(false);
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
      'vmware',
      'templates',
    ]);
  });

  it('should show error when saving with missing required fields', () => {
    // Set empty required fields
    fixture.componentInstance.templateName.set('');
    fixture.componentInstance.defaultName.set('');
    fixture.componentInstance.symbol.set('');

    fixture.componentInstance.onSave();

    expect(mockToasterService.error).toHaveBeenCalledWith(expect.stringContaining('Missing required fields'));
    expect(mockVmwareService.saveTemplate).not.toHaveBeenCalled();
  });

  it('should save successfully when all required fields are filled', () => {
    fixture.componentInstance.onSave();

    expect(mockVmwareService.saveTemplate).toHaveBeenCalled();
    expect(mockToasterService.success).toHaveBeenCalledWith('Changes saved');
  });

  it('should handle save error', () => {
    mockVmwareService.saveTemplate.mockReturnValue({
      subscribe: (handlers: any) => {
        handlers.error({ message: 'Save failed' });
      },
    });

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
    const tags = fixture.componentInstance.tags();
    expect(tags).toContain('tag1');

    fixture.componentInstance.removeTag('tag1');

    expect(fixture.componentInstance.tags()).not.toContain('tag1');
  });

  it('should not modify tags when removeTag is called with non-existing tag', () => {
    const tags = [...fixture.componentInstance.tags()];

    fixture.componentInstance.removeTag('nonexistent');

    expect(fixture.componentInstance.tags()).toEqual(tags);
  });

  it('should open custom adapters dialog when openCustomAdaptersDialog is called', () => {
    fixture.componentInstance.nameFormat.set('Ethernet{0}');
    fixture.componentInstance.segmentSize.set(4);
    fixture.componentInstance.networkType.set('e1000');
    fixture.componentInstance.adapters.set(4);

    fixture.componentInstance.openCustomAdaptersDialog();

    expect(mockMatDialog.open).toHaveBeenCalled();
  });

  it('should open symbol dialog when chooseSymbol is called', () => {
    fixture.componentInstance.symbol.set('/symbols/vmware.svg');

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

  it('should initialize form fields from template on initFormFromTemplate', () => {
    expect(fixture.componentInstance.templateName()).toBe(mockVmwareTemplate.name);
    expect(fixture.componentInstance.defaultName()).toBe(mockVmwareTemplate.default_name_format);
    expect(fixture.componentInstance.symbol()).toBe(mockVmwareTemplate.symbol);
    expect(fixture.componentInstance.category()).toBe(mockVmwareTemplate.category);
    expect(fixture.componentInstance.consoleType()).toBe(mockVmwareTemplate.console_type);
    expect(fixture.componentInstance.adapters()).toBe(mockVmwareTemplate.adapters);
  });

  it('should load configuration options on getConfiguration', () => {
    fixture.componentInstance.getConfiguration();

    expect(mockVmwareConfigurationService.getConsoleTypes).toHaveBeenCalled();
    expect(mockVmwareConfigurationService.getCategories).toHaveBeenCalled();
    expect(mockVmwareConfigurationService.getOnCloseoptions).toHaveBeenCalled();
    expect(mockVmwareConfigurationService.getNetworkTypes).toHaveBeenCalled();
  });
});
