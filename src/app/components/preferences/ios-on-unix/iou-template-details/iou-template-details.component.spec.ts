import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';
import { IouTemplateDetailsComponent } from './iou-template-details.component';
import { IouTemplate } from '@models/templates/iou-template';
import { IouService } from '@services/iou.service';
import { IouConfigurationService } from '@services/iou-configuration.service';
import { ControllerService } from '@services/controller.service';
import { ToasterService } from '@services/toaster.service';
import { DialogConfigService } from '@services/dialog-config.service';
import { Controller } from '@models/controller';
import { TemplateSymbolDialogComponent } from '@components/project-map/template-symbol-dialog/template-symbol-dialog.component';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('IouTemplateDetailsComponent', () => {
  let fixture: ComponentFixture<IouTemplateDetailsComponent>;
  let mockActivatedRoute: any;
  let mockRouter: any;
  let mockIouService: any;
  let mockControllerService: any;
  let mockIouConfigurationService: any;
  let mockToasterService: any;
  let mockMatDialog: any;
  let mockDialogRef: any;
  let mockDialogConfigService: any;

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

  const mockIouTemplate: IouTemplate = {
    template_id: 'template-123',
    template_type: 'iou',
    name: 'Test IOU Device',
    default_name_format: '{name}-{0}',
    symbol: '/symbols/iou.svg',
    category: 'router',
    console_type: 'telnet',
    console_auto_start: true,
    l1_keepalives: false,
    use_default_iou_values: true,
    ram: 256,
    nvram: 128,
    ethernet_adapters: 2,
    serial_adapters: 0,
    path: '/path/to/iou.bin',
    startup_config: 'startup.cfg',
    private_config: 'private.cfg',
    usage: 'Test usage notes',
    builtin: false,
    compute_id: 'local',
    tags: ['tag1', 'tag2'],
  };

  beforeEach(async () => {
    mockActivatedRoute = {
      snapshot: {
        paramMap: {
          get: vi.fn().mockImplementation((key: string) => {
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

    mockIouService = {
      getTemplate: vi.fn().mockReturnValue(of(mockIouTemplate)),
      saveTemplate: vi.fn().mockReturnValue(of(mockIouTemplate)),
    };

    mockIouConfigurationService = {
      getConsoleTypes: vi.fn().mockReturnValue(['telnet', 'none']),
      getCategories: vi.fn().mockReturnValue([
        ['Default', 'guest'],
        ['Routers', 'router'],
        ['Switches', 'switch'],
      ]),
    };

    mockToasterService = {
      error: vi.fn(),
      success: vi.fn(),
    };

    mockDialogRef = {
      afterClosed: vi.fn().mockReturnValue(of(null)),
    };

    mockMatDialog = {
      open: vi.fn().mockReturnValue(mockDialogRef),
    };

    mockDialogConfigService = {
      openConfig: vi.fn().mockReturnValue({
        autoFocus: false,
        disableClose: false,
        data: {},
      }),
    };

    await TestBed.configureTestingModule({
      imports: [IouTemplateDetailsComponent, MatDialogModule, RouterModule],
      providers: [
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: Router, useValue: mockRouter },
        { provide: IouService, useValue: mockIouService },
        { provide: ControllerService, useValue: mockControllerService },
        { provide: IouConfigurationService, useValue: mockIouConfigurationService },
        { provide: ToasterService, useValue: mockToasterService },
        { provide: MatDialog, useValue: mockMatDialog },
        { provide: DialogConfigService, useValue: mockDialogConfigService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(IouTemplateDetailsComponent);
  });

  afterEach(() => {
    fixture.destroy();
  });

  describe('Creation', () => {
    it('should create the component', () => {
      expect(fixture.componentInstance).toBeTruthy();
    });

    it('should have correct separatorKeysCodes', () => {
      expect(fixture.componentInstance.separatorKeysCodes).toContain(13); // ENTER
      expect(fixture.componentInstance.separatorKeysCodes).toContain(188); // COMMA
    });

    it('should have empty consoleTypes and categories initially', () => {
      expect(fixture.componentInstance.consoleTypes).toEqual([]);
      expect(fixture.componentInstance.categories).toEqual([]);
    });
  });

  describe('ngOnInit', () => {
    it('should fetch controller by id from route params', async () => {
      fixture.detectChanges();
      await fixture.whenStable();

      expect(mockControllerService.get).toHaveBeenCalledWith(1);
    });

    it('should fetch iouTemplate after controller is loaded', async () => {
      fixture.detectChanges();
      await fixture.whenStable();

      expect(mockIouService.getTemplate).toHaveBeenCalledWith(mockController, 'template-123');
    });

    it('should set controller on component after loading', async () => {
      fixture.detectChanges();
      await fixture.whenStable();

      expect(fixture.componentInstance.controller).toBe(mockController);
    });

    it('should set iouTemplate on component after loading', async () => {
      fixture.detectChanges();
      await fixture.whenStable();

      expect(fixture.componentInstance.iouTemplate).toBe(mockIouTemplate);
    });

    it('should initialize tags array if template has no tags', async () => {
      const templateWithoutTags = { ...mockIouTemplate, tags: undefined };
      mockIouService.getTemplate.mockReturnValue(of(templateWithoutTags));

      fixture.detectChanges();
      await fixture.whenStable();

      expect(fixture.componentInstance.iouTemplate.tags).toEqual([]);
    });

    it('should call getConfiguration after template load', async () => {
      fixture.detectChanges();
      await fixture.whenStable();

      expect(mockIouConfigurationService.getConsoleTypes).toHaveBeenCalled();
      expect(mockIouConfigurationService.getCategories).toHaveBeenCalled();
    });

    it('should initialize form fields from template', async () => {
      fixture.detectChanges();
      await fixture.whenStable();

      expect(fixture.componentInstance.templateName()).toBe(mockIouTemplate.name);
      expect(fixture.componentInstance.defaultName()).toBe(mockIouTemplate.default_name_format);
      expect(fixture.componentInstance.symbol()).toBe(mockIouTemplate.symbol);
      expect(fixture.componentInstance.path()).toBe(mockIouTemplate.path);
      expect(fixture.componentInstance.initialConfig()).toBe(mockIouTemplate.startup_config);
      expect(fixture.componentInstance.privateConfig()).toBe(mockIouTemplate.private_config);
      expect(fixture.componentInstance.category()).toBe(mockIouTemplate.category);
      expect(fixture.componentInstance.consoleType()).toBe(mockIouTemplate.console_type);
      expect(fixture.componentInstance.consoleAutoStart()).toBe(mockIouTemplate.console_auto_start);
      expect(fixture.componentInstance.l1Keepalives()).toBe(mockIouTemplate.l1_keepalives);
      expect(fixture.componentInstance.useDefaultIouValues()).toBe(mockIouTemplate.use_default_iou_values);
      expect(fixture.componentInstance.ram()).toBe(mockIouTemplate.ram);
      expect(fixture.componentInstance.nvram()).toBe(mockIouTemplate.nvram);
      expect(fixture.componentInstance.ethernetAdapters()).toBe(mockIouTemplate.ethernet_adapters);
      expect(fixture.componentInstance.serialAdapters()).toBe(mockIouTemplate.serial_adapters);
      expect(fixture.componentInstance.usage()).toBe(mockIouTemplate.usage);
      expect(fixture.componentInstance.tags()).toEqual(mockIouTemplate.tags);
    });

    it('should set consoleTypes and categories from configuration service', async () => {
      fixture.detectChanges();
      await fixture.whenStable();

      expect(fixture.componentInstance.consoleTypes).toEqual(['telnet', 'none']);
      expect(fixture.componentInstance.categories).toEqual([
        ['Default', 'guest'],
        ['Routers', 'router'],
        ['Switches', 'switch'],
      ]);
    });
  });

  describe('goBack', () => {
    it('should navigate to templates list', async () => {
      fixture.detectChanges();
      await fixture.whenStable();

      fixture.componentInstance.goBack();

      expect(mockRouter.navigate).toHaveBeenCalledWith([
        '/controller',
        mockController.id,
        'preferences',
        'iou',
        'templates',
      ]);
    });
  });

  describe('onSave', () => {
    beforeEach(async () => {
      fixture.detectChanges();
      await fixture.whenStable();
    });

    it('should update iouTemplate from form values before saving', () => {
      fixture.componentInstance.templateName.set('New Name');
      fixture.componentInstance.defaultName.set('{name}');
      fixture.componentInstance.symbol.set('new_symbol');
      fixture.componentInstance.path.set('/new/path.bin');
      fixture.componentInstance.initialConfig.set('new_startup.cfg');
      fixture.componentInstance.privateConfig.set('new_private.cfg');
      fixture.componentInstance.category.set('switch');
      fixture.componentInstance.consoleType.set('none');
      fixture.componentInstance.consoleAutoStart.set(false);
      fixture.componentInstance.l1Keepalives.set(true);
      fixture.componentInstance.useDefaultIouValues.set(false);
      fixture.componentInstance.ram.set(512);
      fixture.componentInstance.nvram.set(256);
      fixture.componentInstance.ethernetAdapters.set(4);
      fixture.componentInstance.serialAdapters.set(2);
      fixture.componentInstance.usage.set('new usage');
      fixture.componentInstance.tags.set(['new', 'tags']);

      fixture.componentInstance.onSave();

      expect(fixture.componentInstance.iouTemplate.name).toBe('New Name');
      expect(fixture.componentInstance.iouTemplate.default_name_format).toBe('{name}');
      expect(fixture.componentInstance.iouTemplate.symbol).toBe('new_symbol');
      expect(fixture.componentInstance.iouTemplate.path).toBe('/new/path.bin');
      expect(fixture.componentInstance.iouTemplate.startup_config).toBe('new_startup.cfg');
      expect(fixture.componentInstance.iouTemplate.private_config).toBe('new_private.cfg');
      expect(fixture.componentInstance.iouTemplate.category).toBe('switch');
      expect(fixture.componentInstance.iouTemplate.console_type).toBe('none');
      expect(fixture.componentInstance.iouTemplate.console_auto_start).toBe(false);
      expect(fixture.componentInstance.iouTemplate.l1_keepalives).toBe(true);
      expect(fixture.componentInstance.iouTemplate.use_default_iou_values).toBe(false);
      expect(fixture.componentInstance.iouTemplate.ram).toBe(512);
      expect(fixture.componentInstance.iouTemplate.nvram).toBe(256);
      expect(fixture.componentInstance.iouTemplate.ethernet_adapters).toBe(4);
      expect(fixture.componentInstance.iouTemplate.serial_adapters).toBe(2);
      expect(fixture.componentInstance.iouTemplate.usage).toBe('new usage');
      expect(fixture.componentInstance.iouTemplate.tags).toEqual(['new', 'tags']);
    });

    it('should call iouService.saveTemplate with updated template', () => {
      fixture.componentInstance.templateName.set('Updated Name');

      fixture.componentInstance.onSave();

      expect(mockIouService.saveTemplate).toHaveBeenCalledWith(mockController, fixture.componentInstance.iouTemplate);
    });

    it('should show success toast after successful save', () => {
      fixture.componentInstance.onSave();

      expect(mockToasterService.success).toHaveBeenCalledWith('Changes saved');
    });
  });

  describe('chooseSymbol', () => {
    beforeEach(async () => {
      fixture.detectChanges();
      await fixture.whenStable();
    });

    it('should open dialog with correct config', () => {
      fixture.componentInstance.chooseSymbol();

      expect(mockDialogConfigService.openConfig).toHaveBeenCalledWith('templateSymbol', {
        autoFocus: false,
        disableClose: false,
        data: {
          controller: mockController,
          symbol: mockIouTemplate.symbol,
        },
      });
    });

    it('should open TemplateSymbolDialogComponent', () => {
      fixture.componentInstance.chooseSymbol();

      expect(mockMatDialog.open).toHaveBeenCalledWith(
        TemplateSymbolDialogComponent,
        expect.objectContaining({
          autoFocus: false,
          disableClose: false,
        })
      );
    });

    it('should update symbol when dialog returns a result', async () => {
      mockDialogRef.afterClosed.mockReturnValue(of('new_symbol_path'));

      fixture.componentInstance.chooseSymbol();

      expect(mockDialogRef.afterClosed).toHaveBeenCalled();
      expect(fixture.componentInstance.symbol()).toBe('new_symbol_path');
    });

    it('should not update symbol when dialog returns null', async () => {
      const originalSymbol = fixture.componentInstance.symbol();
      mockDialogRef.afterClosed.mockReturnValue(of(null));

      fixture.componentInstance.chooseSymbol();

      expect(fixture.componentInstance.symbol()).toBe(originalSymbol);
    });

    it('should not update symbol when dialog returns undefined', async () => {
      const originalSymbol = fixture.componentInstance.symbol();
      mockDialogRef.afterClosed.mockReturnValue(of(undefined));

      fixture.componentInstance.chooseSymbol();

      expect(fixture.componentInstance.symbol()).toBe(originalSymbol);
    });
  });

  describe('addTag', () => {
    beforeEach(async () => {
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.componentInstance.tags.set(['existing1', 'existing2']);
    });

    it('should add new tag to tags array', () => {
      const mockEvent = {
        value: 'newTag',
        chipInput: { clear: vi.fn() },
      } as any;

      fixture.componentInstance.addTag(mockEvent);

      expect(fixture.componentInstance.tags()).toContain('newTag');
      expect(fixture.componentInstance.tags()).toHaveLength(3);
    });

    it('should trim whitespace from tag value', () => {
      const mockEvent = {
        value: '  trimmedTag  ',
        chipInput: { clear: vi.fn() },
      } as any;

      fixture.componentInstance.addTag(mockEvent);

      expect(fixture.componentInstance.tags()).toContain('trimmedTag');
    });

    it('should not add empty tag', () => {
      const mockEvent = {
        value: '   ',
        chipInput: { clear: vi.fn() },
      } as any;

      fixture.componentInstance.addTag(mockEvent);

      expect(fixture.componentInstance.tags()).toHaveLength(2);
    });

    it('should clear chipInput', () => {
      const mockEvent = {
        value: 'newTag',
        chipInput: { clear: vi.fn() },
      } as any;

      fixture.componentInstance.addTag(mockEvent);

      expect(mockEvent.chipInput.clear).toHaveBeenCalled();
    });

    it('should handle missing chipInput', () => {
      const mockEvent = {
        value: 'newTag',
        chipInput: null,
      } as any;

      expect(() => fixture.componentInstance.addTag(mockEvent)).not.toThrow();
    });
  });

  describe('removeTag', () => {
    beforeEach(async () => {
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.componentInstance.tags.set(['tag1', 'tag2', 'tag3']);
    });

    it('should remove existing tag from tags array', () => {
      fixture.componentInstance.removeTag('tag2');

      expect(fixture.componentInstance.tags()).not.toContain('tag2');
      expect(fixture.componentInstance.tags()).toHaveLength(2);
    });

    it('should preserve other tags when removing one', () => {
      fixture.componentInstance.removeTag('tag2');

      expect(fixture.componentInstance.tags()).toEqual(['tag1', 'tag3']);
    });

    it('should not modify tags array if tag not found', () => {
      const originalTags = [...fixture.componentInstance.tags()];

      fixture.componentInstance.removeTag('nonexistent');

      expect(fixture.componentInstance.tags()).toEqual(originalTags);
    });

    it('should handle removing last tag', () => {
      fixture.componentInstance.tags.set(['onlyTag']);

      fixture.componentInstance.removeTag('onlyTag');

      expect(fixture.componentInstance.tags()).toEqual([]);
    });
  });

  describe('uploadImageFile', () => {
    beforeEach(async () => {
      fixture.detectChanges();
      await fixture.whenStable();
    });

    it('should set path when file is selected', () => {
      const mockEvent = {
        target: {
          files: [{ name: 'test-image.bin' }],
        },
      } as any;

      fixture.componentInstance.uploadImageFile(mockEvent);

      expect(fixture.componentInstance.path()).toBe('test-image.bin');
    });

    it('should not update path when no file is selected', () => {
      const mockEvent = {
        target: {
          files: [],
        },
      } as any;

      fixture.componentInstance.uploadImageFile(mockEvent);

      expect(fixture.componentInstance.path()).toBe(mockIouTemplate.path);
    });

    it('should not update path when files is null', () => {
      const mockEvent = {
        target: {
          files: null,
        },
      } as any;

      fixture.componentInstance.uploadImageFile(mockEvent);

      expect(fixture.componentInstance.path()).toBe(mockIouTemplate.path);
    });
  });

  describe('toggleSection', () => {
    beforeEach(async () => {
      fixture.detectChanges();
      await fixture.whenStable();
    });

    it('should toggle general settings section', () => {
      expect(fixture.componentInstance.generalSettingsExpanded()).toBe(false);

      fixture.componentInstance.toggleSection('general');
      expect(fixture.componentInstance.generalSettingsExpanded()).toBe(true);

      fixture.componentInstance.toggleSection('general');
      expect(fixture.componentInstance.generalSettingsExpanded()).toBe(false);
    });

    it('should toggle network section', () => {
      expect(fixture.componentInstance.networkExpanded()).toBe(false);

      fixture.componentInstance.toggleSection('network');
      expect(fixture.componentInstance.networkExpanded()).toBe(true);

      fixture.componentInstance.toggleSection('network');
      expect(fixture.componentInstance.networkExpanded()).toBe(false);
    });

    it('should toggle usage section', () => {
      expect(fixture.componentInstance.usageExpanded()).toBe(false);

      fixture.componentInstance.toggleSection('usage');
      expect(fixture.componentInstance.usageExpanded()).toBe(true);

      fixture.componentInstance.toggleSection('usage');
      expect(fixture.componentInstance.usageExpanded()).toBe(false);
    });
  });

  describe('getConfiguration', () => {
    beforeEach(async () => {
      fixture.detectChanges();
      await fixture.whenStable();
    });

    it('should load consoleTypes and categories', () => {
      fixture.componentInstance.getConfiguration();

      expect(mockIouConfigurationService.getConsoleTypes).toHaveBeenCalled();
      expect(mockIouConfigurationService.getCategories).toHaveBeenCalled();
      expect(fixture.componentInstance.consoleTypes).toEqual(['telnet', 'none']);
      expect(fixture.componentInstance.categories).toEqual([
        ['Default', 'guest'],
        ['Routers', 'router'],
        ['Switches', 'switch'],
      ]);
    });
  });

  describe('error handling', () => {
    it('should show error toaster when controllerService.get fails', async () => {
      mockControllerService.get.mockRejectedValue({ error: { message: 'Controller error' } });

      fixture = TestBed.createComponent(IouTemplateDetailsComponent);
      fixture.detectChanges();
      await fixture.whenStable();

      expect(mockToasterService.error).toHaveBeenCalledWith('Controller error');
    });

    it('should use fallback message when controllerService.get error has no message', async () => {
      mockControllerService.get.mockRejectedValue({});

      fixture = TestBed.createComponent(IouTemplateDetailsComponent);
      fixture.detectChanges();
      await fixture.whenStable();

      expect(mockToasterService.error).toHaveBeenCalledWith('Failed to load controller');
    });

    it('should show error toaster when iouService.getTemplate fails', async () => {
      mockIouService.getTemplate.mockReturnValue(throwError(() => ({ error: { message: 'Template error' } })));

      fixture = TestBed.createComponent(IouTemplateDetailsComponent);
      fixture.detectChanges();
      await fixture.whenStable();

      expect(mockToasterService.error).toHaveBeenCalledWith('Template error');
    });

    it('should use fallback message when iouService.getTemplate error has no message', async () => {
      mockIouService.getTemplate.mockReturnValue(throwError(() => ({})));

      fixture = TestBed.createComponent(IouTemplateDetailsComponent);
      fixture.detectChanges();
      await fixture.whenStable();

      expect(mockToasterService.error).toHaveBeenCalledWith('Failed to load IOU template');
    });

    it('should show error toaster when iouService.saveTemplate fails', async () => {
      mockIouService.saveTemplate.mockReturnValue(throwError(() => ({ error: { message: 'Save error' } })));

      fixture.detectChanges();
      await fixture.whenStable();

      fixture.componentInstance.onSave();
      fixture.detectChanges();
      await fixture.whenStable();

      expect(mockToasterService.error).toHaveBeenCalledWith('Save error');
    });

    it('should use fallback message when iouService.saveTemplate error has no message', async () => {
      mockIouService.saveTemplate.mockReturnValue(throwError(() => ({})));

      fixture.detectChanges();
      await fixture.whenStable();

      fixture.componentInstance.onSave();
      fixture.detectChanges();
      await fixture.whenStable();

      expect(mockToasterService.error).toHaveBeenCalledWith('Failed to save IOU template');
    });
  });
});
