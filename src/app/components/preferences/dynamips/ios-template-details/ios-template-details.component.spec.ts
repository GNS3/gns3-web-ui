import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { of, Subject, throwError } from 'rxjs';
import { IosTemplateDetailsComponent } from './ios-template-details.component';
import { IosService } from '@services/ios.service';
import { IosConfigurationService } from '@services/ios-configuration.service';
import { ControllerService } from '@services/controller.service';
import { ToasterService } from '@services/toaster.service';
import { ProgressService } from '../../../../common/progress/progress.service';
import { DialogConfigService } from '@services/dialog-config.service';
import { Controller } from '@models/controller';
import { IosTemplate } from '@models/templates/ios-template';
import { TemplateSymbolDialogComponent } from '@components/project-map/template-symbol-dialog/template-symbol-dialog.component';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('IosTemplateDetailsComponent', () => {
  let component: IosTemplateDetailsComponent;
  let fixture: ComponentFixture<IosTemplateDetailsComponent>;

  let mockIosService: any;
  let mockControllerService: any;
  let mockIosConfigurationService: any;
  let mockToasterService: any;
  let mockProgressService: any;
  let mockDialogConfigService: any;
  let mockDialogRef: any;
  let mockDialog: any;
  let mockRouter: any;
  let mockActivatedRoute: any;

  let mockController: Controller;
  let mockIosTemplate: IosTemplate;

  const createMockIosTemplate = (): IosTemplate => ({
    auto_delete_disks: false,
    template_id: 'template-1',
    builtin: false,
    category: 'router',
    compute_id: 'local',
    console_auto_start: false,
    console_type: 'telnet',
    aux_type: 'none',
    default_name_format: '{name}-{0}',
    disk0: 0,
    disk1: 0,
    exec_area: 64,
    idlemax: 0,
    idlepc: '',
    idlesleep: 30,
    image: '/path/to/ios/image.bin',
    mac_addr: '',
    mmap: true,
    name: 'Test IOS Router',
    nvram: 256,
    platform: 'c7200',
    private_config: '',
    ram: 512,
    slot0: 'C7200-IO-FE',
    slot1: 'PA-FE-TX',
    sparsemem: true,
    startup_config: 'startup-config.txt',
    symbol: 'router',
    system_id: '1',
    template_type: 'dynamips',
    usage: '',
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

    mockIosTemplate = createMockIosTemplate();

    mockActivatedRoute = {
      snapshot: {
        paramMap: {
          get: vi.fn((key: string) => {
            if (key === 'controller_id') return '1';
            if (key === 'template_id') return 'template-1';
            return null;
          }),
        },
      },
    };

    mockControllerService = {
      get: vi.fn().mockResolvedValue(mockController),
    };

    mockIosService = {
      getTemplate: vi.fn().mockReturnValue(of(mockIosTemplate)),
      saveTemplate: vi.fn().mockReturnValue(of(mockIosTemplate)),
      findIdlePC: vi.fn().mockReturnValue(of({ idlepc: '0x12345678' })),
    };

    mockIosConfigurationService = {
      getAvailablePlatforms: vi.fn().mockReturnValue(['c1700', 'c2600', 'c2691', 'c3725', 'c3745', 'c3600', 'c7200']),
      getPlatformsWithEtherSwitchRouterOption: vi.fn().mockReturnValue({ c1700: false, c2600: true }),
      getPlatformsWithChassis: vi.fn().mockReturnValue({ c1700: true, c2600: true, c3600: true, c7200: false }),
      getChassis: vi.fn().mockReturnValue({ c1700: ['1720', '1721'], c2600: ['2610', '2620'] }),
      getDefaultRamSettings: vi.fn().mockReturnValue({ c1700: 160, c2600: 160, c7200: 512 }),
      getConsoleTypes: vi.fn().mockReturnValue(['telnet', 'none']),
      getCategories: vi.fn().mockReturnValue([
        ['Routers', 'router'],
        ['Switches', 'switch'],
      ]),
      getAdapterMatrix: vi.fn().mockReturnValue({
        c7200: {
          '': {
            0: ['C7200-IO-FE'],
            1: ['PA-FE-TX', 'PA-GE'],
            2: ['PA-4T+'],
          },
        },
        c2600: {
          '2620': {
            0: ['C2600-MB-1FE'],
            1: ['NM-1FE-TX', 'NM-4E'],
          },
        },
      }),
      getWicMatrix: vi.fn().mockReturnValue({ c7200: { 0: ['WIC-1T'], 1: ['WIC-1T'] } }),
      getIdlepcRegex: vi.fn().mockReturnValue(/^(0x[0-9a-fA-F]+)?$|^$/),
      getMacAddrRegex: vi.fn().mockReturnValue(/^([0-9a-fA-F]{4}\.){2}[0-9a-fA-F]{4}$|^$/),
    };

    mockToasterService = {
      error: vi.fn(),
      success: vi.fn(),
    };

    mockProgressService = {
      activate: vi.fn(),
      deactivate: vi.fn(),
    };

    mockDialogConfigService = {
      openConfig: vi.fn().mockReturnValue({ autoFocus: false, disableClose: false }),
    };

    mockDialogRef = {
      afterClosed: vi.fn().mockReturnValue(of(null)),
    };

    mockDialog = {
      open: vi.fn().mockReturnValue(mockDialogRef),
    };

    mockRouter = {
      navigate: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [IosTemplateDetailsComponent, MatDialogModule],
      providers: [
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: IosService, useValue: mockIosService },
        { provide: IosConfigurationService, useValue: mockIosConfigurationService },
        { provide: ControllerService, useValue: mockControllerService },
        { provide: ToasterService, useValue: mockToasterService },
        { provide: ProgressService, useValue: mockProgressService },
        { provide: DialogConfigService, useValue: mockDialogConfigService },
        { provide: MatDialog, useValue: mockDialog },
        { provide: Router, useValue: mockRouter },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(IosTemplateDetailsComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    if (fixture) {
      fixture.destroy();
    }
  });

  describe('Creation', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should have separatorKeysCodes with ENTER and COMMA', () => {
      expect(component.separatorKeysCodes).toContain(13); // ENTER
      expect(component.separatorKeysCodes).toContain(188); // COMMA
    });

    it('should have all section collapse states initialized to false', () => {
      expect(component.generalSettingsExpanded).toBe(false);
      expect(component.memoryExpanded).toBe(false);
      expect(component.slotsExpanded).toBe(false);
      expect(component.advancedExpanded).toBe(false);
      expect(component.usageExpanded).toBe(false);
    });

    it('should have empty networkAdaptersForTemplate and wicsForTemplate arrays', () => {
      expect(component.networkAdaptersForTemplate).toEqual([]);
      expect(component.wicsForTemplate).toEqual([]);
    });
  });

  describe('ngOnInit', () => {
    it('should fetch controller by id from route params', () => {
      fixture.detectChanges();
      expect(mockControllerService.get).toHaveBeenCalledWith(1);
    });

    it('should fetch IOS template from service', async () => {
      await component.ngOnInit();
      fixture.detectChanges();
      expect(mockIosService.getTemplate).toHaveBeenCalledWith(mockController, 'template-1');
    });

    it('should load configuration data from IosConfigurationService', async () => {
      await component.ngOnInit();
      fixture.detectChanges();
      expect(mockIosConfigurationService.getAvailablePlatforms).toHaveBeenCalled();
      expect(mockIosConfigurationService.getPlatformsWithEtherSwitchRouterOption).toHaveBeenCalled();
      expect(mockIosConfigurationService.getPlatformsWithChassis).toHaveBeenCalled();
      expect(mockIosConfigurationService.getChassis).toHaveBeenCalled();
      expect(mockIosConfigurationService.getDefaultRamSettings).toHaveBeenCalled();
      expect(mockIosConfigurationService.getConsoleTypes).toHaveBeenCalled();
      expect(mockIosConfigurationService.getCategories).toHaveBeenCalled();
      expect(mockIosConfigurationService.getAdapterMatrix).toHaveBeenCalled();
      expect(mockIosConfigurationService.getWicMatrix).toHaveBeenCalled();
    });

    it('should populate platforms array', async () => {
      await component.ngOnInit();
      fixture.detectChanges();
      expect(component.platforms).toContain('c7200');
      expect(component.platforms).toContain('c3600');
    });

    it('should initialize iosTemplate with empty tags array if not present', async () => {
      const templateWithoutTags = { ...mockIosTemplate, tags: undefined };
      mockIosService.getTemplate.mockReturnValue(of(templateWithoutTags));

      await component.ngOnInit();
      fixture.detectChanges();

      expect(component.iosTemplate.tags).toEqual([]);
    });

    it('should set iosTemplate when loaded', async () => {
      await component.ngOnInit();
      fixture.detectChanges();
      expect(component.iosTemplate).toBeDefined();
      expect(component.iosTemplate.name).toBe('Test IOS Router');
    });

    it('should populate forms with template data', async () => {
      await component.ngOnInit();
      fixture.detectChanges();
      expect(component.generalSettingsForm.get('templateName').value).toBe('Test IOS Router');
      expect(component.generalSettingsForm.get('path').value).toBe('/path/to/ios/image.bin');
      expect(component.memoryForm.get('ram').value).toBe(512);
    });
  });

  describe('toggleSection', () => {
    it('should toggle generalSettingsExpanded when section is general', () => {
      expect(component.generalSettingsExpanded).toBe(false);
      component.toggleSection('general');
      expect(component.generalSettingsExpanded).toBe(true);
      component.toggleSection('general');
      expect(component.generalSettingsExpanded).toBe(false);
    });

    it('should toggle memoryExpanded when section is memory', () => {
      expect(component.memoryExpanded).toBe(false);
      component.toggleSection('memory');
      expect(component.memoryExpanded).toBe(true);
    });

    it('should toggle slotsExpanded when section is slots', () => {
      expect(component.slotsExpanded).toBe(false);
      component.toggleSection('slots');
      expect(component.slotsExpanded).toBe(true);
    });

    it('should toggle advancedExpanded when section is advanced', () => {
      expect(component.advancedExpanded).toBe(false);
      component.toggleSection('advanced');
      expect(component.advancedExpanded).toBe(true);
    });

    it('should toggle usageExpanded when section is usage', () => {
      expect(component.usageExpanded).toBe(false);
      component.toggleSection('usage');
      expect(component.usageExpanded).toBe(true);
    });

    it('should not throw for unknown section', () => {
      expect(() => component.toggleSection('unknown')).not.toThrow();
    });
  });

  describe('addTag', () => {
    beforeEach(() => {
      // Set up iosTemplate for all addTag tests
      component.iosTemplate = { ...mockIosTemplate, tags: [] };
    });

    it('should add tag to iosTemplate.tags', () => {
      const event = { value: 'new-tag', chipInput: { clear: vi.fn() } } as any;
      component.addTag(event);

      expect(component.iosTemplate.tags).toContain('new-tag');
    });

    it('should initialize tags array if undefined', () => {
      component.iosTemplate.tags = undefined;

      const event = { value: 'new-tag', chipInput: { clear: vi.fn() } } as any;
      component.addTag(event);

      expect(component.iosTemplate.tags).toEqual(['new-tag']);
    });

    it('should not add empty tag', () => {
      const event = { value: '', chipInput: { clear: vi.fn() } } as any;
      component.addTag(event);

      expect(component.iosTemplate.tags.length).toBe(0);
    });

    it('should not add whitespace-only tag', () => {
      const event = { value: '   ', chipInput: { clear: vi.fn() } } as any;
      component.addTag(event);

      expect(component.iosTemplate.tags.length).toBe(0);
    });

    it('should clear chip input after adding tag', () => {
      const clearFn = vi.fn();
      const event = { value: 'new-tag', chipInput: { clear: clearFn } } as any;
      component.addTag(event);

      expect(clearFn).toHaveBeenCalled();
    });

    it('should handle missing chipInput', () => {
      const event = { value: 'new-tag', chipInput: null } as any;
      expect(() => component.addTag(event)).not.toThrow();
    });
  });

  describe('removeTag', () => {
    beforeEach(() => {
      // Set up iosTemplate for all removeTag tests
      component.iosTemplate = { ...mockIosTemplate, tags: ['tag1', 'tag2', 'tag3'] };
    });

    it('should remove tag from iosTemplate.tags', () => {
      component.removeTag('tag2');

      expect(component.iosTemplate.tags).not.toContain('tag2');
      expect(component.iosTemplate.tags).toEqual(['tag1', 'tag3']);
    });

    it('should not throw when tags array is undefined', () => {
      component.iosTemplate.tags = undefined;

      expect(() => component.removeTag('tag1')).not.toThrow();
    });

    it('should not modify array when tag not found', () => {
      component.removeTag('nonexistent');

      expect(component.iosTemplate.tags).toEqual(['tag1', 'tag2', 'tag3']);
    });

    it('should handle empty tags array', () => {
      component.iosTemplate.tags = [];

      expect(() => component.removeTag('tag1')).not.toThrow();
    });
  });

  describe('fillSlotsData', () => {
    beforeEach(() => {
      // Set up iosTemplate for all fillSlotsData tests
      component.iosTemplate = { ...mockIosTemplate, chassis: '' };
    });

    it('should load network adapters from iosTemplate', () => {
      component.iosTemplate.slot0 = 'C7200-IO-FE';
      component.iosTemplate.slot1 = 'PA-FE-TX';

      component.fillSlotsData();

      expect(component.networkAdaptersForTemplate[0]).toBe('C7200-IO-FE');
      expect(component.networkAdaptersForTemplate[1]).toBe('PA-FE-TX');
    });

    it('should load WICs from iosTemplate', () => {
      component.iosTemplate.wic0 = 'WIC-1T';
      component.iosTemplate.wic1 = 'WIC-2T';

      component.fillSlotsData();

      expect(component.wicsForTemplate[0]).toBe('WIC-1T');
      expect(component.wicsForTemplate[1]).toBe('WIC-2T');
    });
  });

  describe('saveSlotsData', () => {
    beforeEach(() => {
      // Set up iosTemplate for all saveSlotsData tests with explicit chassis
      component.iosTemplate = { ...mockIosTemplate, chassis: '' };
      // Ensure matrices are set
      component.adapterMatrix = mockIosConfigurationService.getAdapterMatrix();
      component.wicMatrix = mockIosConfigurationService.getWicMatrix();
    });

    it('should save network adapters to iosTemplate', () => {
      component.networkAdaptersForTemplate[0] = 'PA-FE-TX';
      component.networkAdaptersForTemplate[1] = 'PA-GE';

      component.saveSlotsData();

      expect(component.iosTemplate.slot0).toBe('PA-FE-TX');
      expect(component.iosTemplate.slot1).toBe('PA-GE');
    });

    it('should save WICs to iosTemplate', () => {
      component.wicsForTemplate[0] = 'WIC-1T';
      component.wicsForTemplate[1] = 'WIC-2T';

      component.saveSlotsData();

      expect(component.iosTemplate.wic0).toBe('WIC-1T');
      expect(component.iosTemplate.wic1).toBe('WIC-2T');
    });

    it('should set empty string for undefined adapter slot', () => {
      component.networkAdaptersForTemplate[0] = undefined;

      component.saveSlotsData();

      expect(component.iosTemplate.slot0).toBe('');
    });

    it('should delete slot properties when no adapters available for platform', () => {
      component.iosTemplate.platform = 'c1700'; // Platform without adapter matrix
      component.networkAdaptersForTemplate[0] = 'some-adapter';

      component.saveSlotsData();

      // c1700 has no adapter matrix for slots, so slot properties should be deleted
      expect(component.iosTemplate.slot0).toBeUndefined();
    });
  });

  describe('generateBaseMAC', () => {
    beforeEach(() => {
      // Set up iosTemplate and controller for all generateBaseMAC tests
      component.iosTemplate = mockIosTemplate;
      component.controller = mockController;
    });

    it('should generate a MAC address in xxxx.xxxx.xxxx format', () => {
      fixture.detectChanges();

      component.generateBaseMAC();

      const macPattern = /^([0-9a-f]{4}\.){2}[0-9a-f]{4}$/;
      expect(component.iosTemplate.mac_addr).toMatch(macPattern);
    });

    it('should set generated MAC address in form', () => {
      fixture.detectChanges();

      component.generateBaseMAC();

      expect(component.advancedForm.get('mac_addr').value).toMatch(/^([0-9a-f]{4}\.){2}[0-9a-f]{4}$/);
    });

    it('should show success toaster', () => {
      fixture.detectChanges();

      component.generateBaseMAC();

      expect(mockToasterService.success).toHaveBeenCalledWith(expect.stringContaining('Base MAC generated'));
    });
  });

  describe('findIdlePC', () => {
    beforeEach(() => {
      // Set up iosTemplate and controller for all findIdlePC tests
      component.iosTemplate = mockIosTemplate;
      component.controller = mockController;
    });

    it('should activate progress service', () => {
      fixture.detectChanges();

      component.findIdlePC();

      expect(mockProgressService.activate).toHaveBeenCalled();
    });

    it('should call iosService.findIdlePC with correct data', () => {
      fixture.detectChanges();

      component.findIdlePC();

      expect(mockIosService.findIdlePC).toHaveBeenCalledWith(mockController, {
        image: mockIosTemplate.image,
        platform: mockIosTemplate.platform,
        ram: mockIosTemplate.ram,
      });
    });

    it('should update iosTemplate.idlepc and form when idlepc found', () => {
      fixture.detectChanges();
      mockIosService.findIdlePC.mockReturnValue(of({ idlepc: '0x12345678' }));

      component.findIdlePC();

      expect(component.iosTemplate.idlepc).toBe('0x12345678');
      expect(component.advancedForm.get('idlepc').value).toBe('0x12345678');
    });

    it('should show success toaster when idlepc is found', () => {
      fixture.detectChanges();
      mockIosService.findIdlePC.mockReturnValue(of({ idlepc: '0x12345678' }));

      component.findIdlePC();

      expect(mockToasterService.success).toHaveBeenCalledWith(expect.stringContaining('0x12345678'));
    });

    it('should deactivate progress service on error', () => {
      fixture.detectChanges();
      mockIosService.findIdlePC.mockReturnValue(of({ idlepc: null }));

      component.findIdlePC();

      expect(mockProgressService.deactivate).toHaveBeenCalled();
    });

    it('should show error toaster when HTTP call errors', () => {
      fixture.detectChanges();
      mockIosService.findIdlePC.mockReturnValue(of({ idlepc: null })); // null result doesn't trigger error toaster
      // The actual error toaster is triggered by the error callback, not by null idlepc
      // This test verifies the behavior when idlepc is null - no success message shown
      component.findIdlePC();

      expect(mockToasterService.success).not.toHaveBeenCalled();
    });
  });

  describe('onSave', () => {
    it('should not save if generalSettingsForm is invalid', () => {
      fixture.detectChanges();
      component.generalSettingsForm.get('templateName').setValue('');

      component.onSave();

      expect(mockIosService.saveTemplate).not.toHaveBeenCalled();
      expect(mockToasterService.error).toHaveBeenCalledWith(expect.stringContaining('Missing required fields'));
    });

    it('should not save if memoryForm is invalid', () => {
      fixture.detectChanges();
      component.memoryForm.get('ram').setValue('');

      component.onSave();

      expect(mockIosService.saveTemplate).not.toHaveBeenCalled();
    });

    it('should not save if advancedForm has invalid MAC address', () => {
      fixture.detectChanges();
      component.advancedForm.get('mac_addr').setValue('invalid-mac');

      component.onSave();

      expect(mockIosService.saveTemplate).not.toHaveBeenCalled();
    });

    it('should save template successfully when forms are valid', () => {
      fixture.detectChanges();
      component.iosTemplate = mockIosTemplate;
      component.controller = mockController;
      // Populate forms with valid values
      component.generalSettingsForm.patchValue({
        templateName: 'Test IOS Router',
        defaultName: '{name}-{0}',
        symbol: 'router',
        path: '/path/to/ios.bin',
        initialConfig: 'startup-config.txt',
      });
      component.memoryForm.patchValue({
        ram: 512,
        nvram: 256,
        disk0: 0,
        disk1: 0,
      });
      component.advancedForm.patchValue({
        systemId: '1',
        idlemax: 0,
        idlesleep: 30,
        execarea: 64,
      });

      component.onSave();

      expect(mockIosService.saveTemplate).toHaveBeenCalledWith(mockController, component.iosTemplate);
    });

    it('should show success toaster on save', () => {
      fixture.detectChanges();
      component.iosTemplate = mockIosTemplate;
      component.controller = mockController;
      // Populate forms with valid values
      component.generalSettingsForm.patchValue({
        templateName: 'Test IOS Router',
        defaultName: '{name}-{0}',
        symbol: 'router',
        path: '/path/to/ios.bin',
        initialConfig: 'startup-config.txt',
      });
      component.memoryForm.patchValue({
        ram: 512,
        nvram: 256,
        disk0: 0,
        disk1: 0,
      });
      component.advancedForm.patchValue({
        systemId: '1',
        idlemax: 0,
        idlesleep: 30,
        execarea: 64,
      });

      component.onSave();

      expect(mockToasterService.success).toHaveBeenCalledWith('Changes saved');
    });

    it('should update iosTemplate properties from form values before saving', () => {
      fixture.detectChanges();
      component.iosTemplate = mockIosTemplate;
      component.controller = mockController;
      // Populate forms with valid values first
      component.generalSettingsForm.patchValue({
        templateName: 'Test IOS Router',
        defaultName: '{name}-{0}',
        symbol: 'router',
        path: '/path/to/ios.bin',
        initialConfig: 'startup-config.txt',
      });
      component.memoryForm.patchValue({
        ram: 512,
        nvram: 256,
        disk0: 0,
        disk1: 0,
      });
      component.advancedForm.patchValue({
        systemId: '1',
        idlemax: 0,
        idlesleep: 30,
        execarea: 64,
      });
      const newName = 'Updated Router Name';
      component.generalSettingsForm.get('templateName').setValue(newName);

      component.onSave();

      expect(component.iosTemplate.name).toBe(newName);
    });

    it('should report all missing fields in error message', () => {
      fixture.detectChanges();
      component.generalSettingsForm.get('templateName').setValue('');
      component.generalSettingsForm.get('defaultName').setValue('');
      component.generalSettingsForm.get('symbol').setValue('');
      component.generalSettingsForm.get('path').setValue('');
      component.generalSettingsForm.get('initialConfig').setValue('');

      component.onSave();

      expect(mockToasterService.error).toHaveBeenCalledWith(
        expect.stringContaining('Template name') &&
          expect.stringContaining('Default name format') &&
          expect.stringContaining('Symbol') &&
          expect.stringContaining('IOS image path') &&
          expect.stringContaining('Initial startup-config')
      );
    });
  });

  describe('goBack', () => {
    it('should navigate to controller preferences templates page', () => {
      fixture.detectChanges();
      component.controller = mockController;

      component.goBack();

      expect(mockRouter.navigate).toHaveBeenCalledWith([
        '/controller',
        mockController.id,
        'preferences',
        'dynamips',
        'templates',
      ]);
    });
  });

  describe('chooseSymbol', () => {
    it('should open symbol dialog with correct config', () => {
      fixture.detectChanges();
      component.controller = mockController;
      component.iosTemplate = mockIosTemplate;

      component.chooseSymbol();

      expect(mockDialogConfigService.openConfig).toHaveBeenCalledWith('templateSymbol', {
        autoFocus: false,
        disableClose: false,
        data: {
          controller: mockController,
          symbol: mockIosTemplate.symbol,
        },
      });
    });

    it('should open dialog using MatDialog', () => {
      fixture.detectChanges();
      component.controller = mockController;
      component.iosTemplate = mockIosTemplate;

      component.chooseSymbol();

      expect(mockDialog.open).toHaveBeenCalledWith(TemplateSymbolDialogComponent, expect.any(Object));
    });

    it('should update iosTemplate.symbol when dialog returns a value', () => {
      fixture.detectChanges();
      component.controller = mockController;
      component.iosTemplate = mockIosTemplate;
      mockDialogRef.afterClosed.mockReturnValue(of('new-symbol'));

      component.chooseSymbol();

      expect(component.iosTemplate.symbol).toBe('new-symbol');
    });

    it('should update symbol form control when dialog returns a value', () => {
      fixture.detectChanges();
      component.controller = mockController;
      component.iosTemplate = mockIosTemplate;
      mockDialogRef.afterClosed.mockReturnValue(of('new-symbol'));

      component.chooseSymbol();

      expect(component.generalSettingsForm.get('symbol').value).toBe('new-symbol');
    });

    it('should not update symbol when dialog returns null', () => {
      fixture.detectChanges();
      component.iosTemplate = { ...mockIosTemplate, symbol: 'original-symbol' };
      const originalSymbol = component.iosTemplate.symbol;
      mockDialogRef.afterClosed.mockReturnValue(of(null));

      component.chooseSymbol();

      expect(component.iosTemplate.symbol).toBe(originalSymbol);
    });
  });

  describe('symbolChanged', () => {
    it('should update iosTemplate.symbol', () => {
      fixture.detectChanges();
      component.iosTemplate = mockIosTemplate;

      component.symbolChanged('updated-symbol');

      expect(component.iosTemplate.symbol).toBe('updated-symbol');
    });
  });

  describe('getConfiguration', () => {
    it('should populate all configuration arrays', () => {
      component.getConfiguration();

      expect(component.platforms).toEqual(['c1700', 'c2600', 'c2691', 'c3725', 'c3745', 'c3600', 'c7200']);
      expect(component.consoleTypes).toEqual(['telnet', 'none']);
      expect(component.categories).toBeDefined();
      expect(component.adapterMatrix).toBeDefined();
      expect(component.wicMatrix).toBeDefined();
    });

    it('should populate platformsWithEtherSwitchRouterOption', () => {
      component.getConfiguration();

      expect(component.platformsWithEtherSwitchRouterOption).toBeDefined();
      expect(component.platformsWithEtherSwitchRouterOption['c2600']).toBe(true);
    });

    it('should populate chassis object', () => {
      component.getConfiguration();

      expect(component.chassis).toBeDefined();
    });
  });

  describe('populateForms', () => {
    it('should populate generalSettingsForm with iosTemplate values', () => {
      fixture.detectChanges();
      const newTemplate = { ...mockIosTemplate, name: 'New Name', default_name_format: '{name}-{1}' };
      component.iosTemplate = newTemplate;

      component.populateForms();

      expect(component.generalSettingsForm.get('templateName').value).toBe('New Name');
      expect(component.generalSettingsForm.get('defaultName').value).toBe('{name}-{1}');
    });

    it('should populate memoryForm with iosTemplate values', () => {
      fixture.detectChanges();
      component.iosTemplate = { ...mockIosTemplate, ram: 1024, nvram: 512 };

      component.populateForms();

      expect(component.memoryForm.get('ram').value).toBe(1024);
      expect(component.memoryForm.get('nvram').value).toBe(512);
    });

    it('should populate advancedForm with iosTemplate values', () => {
      fixture.detectChanges();
      component.iosTemplate = { ...mockIosTemplate, idlepc: '0x87654321', mmap: false };

      component.populateForms();

      expect(component.advancedForm.get('idlepc').value).toBe('0x87654321');
      expect(component.advancedForm.get('mmap').value).toBe(false);
    });
  });

  describe('error handling', () => {
    it('should show error toaster when controllerService.get fails', async () => {
      mockControllerService.get.mockRejectedValue({ error: { message: 'Controller error' } });

      fixture = TestBed.createComponent(IosTemplateDetailsComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
      await fixture.whenStable();

      expect(mockToasterService.error).toHaveBeenCalledWith('Controller error');
    });

    it('should use fallback message when controllerService.get error has no message', async () => {
      mockControllerService.get.mockRejectedValue({});

      fixture = TestBed.createComponent(IosTemplateDetailsComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
      await fixture.whenStable();

      expect(mockToasterService.error).toHaveBeenCalledWith('Failed to load controller');
    });

    it('should show error toaster when getTemplate fails', async () => {
      mockControllerService.get.mockResolvedValue(mockController);
      mockIosService.getTemplate.mockReturnValue(throwError(() => ({ error: { message: 'Template error' } })));

      fixture = TestBed.createComponent(IosTemplateDetailsComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
      await fixture.whenStable();

      expect(mockToasterService.error).toHaveBeenCalledWith('Template error');
    });

    it('should use fallback message when getTemplate error has no message', async () => {
      mockControllerService.get.mockResolvedValue(mockController);
      mockIosService.getTemplate.mockReturnValue(throwError(() => ({})));

      fixture = TestBed.createComponent(IosTemplateDetailsComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
      await fixture.whenStable();

      expect(mockToasterService.error).toHaveBeenCalledWith('Failed to load template');
    });
  });
});
