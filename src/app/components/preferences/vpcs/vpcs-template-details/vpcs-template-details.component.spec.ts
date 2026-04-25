import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { of, Subject, throwError } from 'rxjs';
import { VpcsTemplateDetailsComponent } from './vpcs-template-details.component';
import { ControllerService } from '@services/controller.service';
import { VpcsService } from '@services/vpcs.service';
import { VpcsConfigurationService } from '@services/vpcs-configuration.service';
import { ToasterService } from '@services/toaster.service';
import { DialogConfigService } from '@services/dialog-config.service';
import { Controller } from '@models/controller';
import { VpcsTemplate } from '@models/templates/vpcs-template';
import { TemplateSymbolDialogComponent } from '@components/project-map/template-symbol-dialog/template-symbol-dialog.component';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('VpcsTemplateDetailsComponent', () => {
  let component: VpcsTemplateDetailsComponent;
  let fixture: ComponentFixture<VpcsTemplateDetailsComponent>;

  let mockControllerService: any;
  let mockVpcsService: any;
  let mockVpcsConfigurationService: any;
  let mockToasterService: any;
  let mockRouter: any;
  let mockDialog: any;
  let mockDialogRef: any;
  let mockDialogConfigService: any;
  let mockActivatedRoute: any;

  let mockController: Controller;
  let mockVpcsTemplate: VpcsTemplate;

  const createMockVpcsTemplate = (): VpcsTemplate => ({
    base_script_file: 'test_script.sh',
    builtin: false,
    category: 'guest',
    compute_id: 'local',
    console_auto_start: true,
    console_type: 'telnet',
    default_name_format: '{name}-{0}',
    name: 'Test VPCS',
    symbol: 'computer',
    template_id: 'template-123',
    template_type: 'vpcs',
    tags: ['tag1', 'tag2'],
    usage: 'Test usage',
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

    mockVpcsTemplate = createMockVpcsTemplate();

    mockActivatedRoute = {
      snapshot: {
        paramMap: {
          get: vi.fn((key: string) => {
            if (key === 'controller_id') return '1';
            if (key === 'template_id') return 'template-123';
            return null;
          }),
        },
      },
    };

    mockControllerService = {
      get: vi.fn().mockResolvedValue(mockController),
    };

    mockVpcsService = {
      getTemplate: vi.fn().mockReturnValue(of(mockVpcsTemplate)),
      saveTemplate: vi.fn().mockReturnValue(of(mockVpcsTemplate)),
    };

    mockVpcsConfigurationService = {
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

    mockRouter = {
      navigate: vi.fn(),
    };

    mockDialogRef = {
      afterClosed: vi.fn().mockReturnValue(of(null)),
    };

    mockDialog = {
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
      imports: [VpcsTemplateDetailsComponent, MatDialogModule, RouterModule],
      providers: [
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: ControllerService, useValue: mockControllerService },
        { provide: VpcsService, useValue: mockVpcsService },
        { provide: VpcsConfigurationService, useValue: mockVpcsConfigurationService },
        { provide: ToasterService, useValue: mockToasterService },
        { provide: Router, useValue: mockRouter },
        { provide: MatDialog, useValue: mockDialog },
        { provide: DialogConfigService, useValue: mockDialogConfigService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(VpcsTemplateDetailsComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    fixture.destroy();
  });

  describe('Creation', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should have correct separatorKeysCodes', () => {
      expect(component.separatorKeysCodes).toContain(13); // ENTER
      expect(component.separatorKeysCodes).toContain(188); // COMMA
    });

    it('should have empty consoleTypes and categories initially', () => {
      expect(component.consoleTypes).toEqual([]);
      expect(component.categories).toEqual([]);
    });
  });

  describe('ngOnInit', () => {
    it('should fetch controller by id from route params', async () => {
      fixture.detectChanges();
      await fixture.whenStable();

      expect(mockControllerService.get).toHaveBeenCalledWith(1);
    });

    it('should fetch vpcsTemplate after controller is loaded', async () => {
      fixture.detectChanges();
      await fixture.whenStable();

      expect(mockVpcsService.getTemplate).toHaveBeenCalledWith(mockController, 'template-123');
    });

    it('should set controller on component after loading', async () => {
      fixture.detectChanges();
      await fixture.whenStable();

      expect(component.controller).toBe(mockController);
    });

    it('should set vpcsTemplate on component after loading', async () => {
      fixture.detectChanges();
      await fixture.whenStable();

      expect(component.vpcsTemplate).toBe(mockVpcsTemplate);
    });

    it('should initialize tags array if template has no tags', async () => {
      const templateWithoutTags = { ...mockVpcsTemplate, tags: undefined };
      mockVpcsService.getTemplate.mockReturnValue(of(templateWithoutTags));

      fixture.detectChanges();
      await fixture.whenStable();

      expect(component.vpcsTemplate.tags).toEqual([]);
    });

    it('should call getConfiguration after template load', async () => {
      fixture.detectChanges();
      await fixture.whenStable();

      expect(mockVpcsConfigurationService.getConsoleTypes).toHaveBeenCalled();
      expect(mockVpcsConfigurationService.getCategories).toHaveBeenCalled();
    });

    it('should initialize form fields from template via initFormFromTemplate', async () => {
      fixture.detectChanges();
      await fixture.whenStable();

      expect(component.templateName()).toBe(mockVpcsTemplate.name);
      expect(component.defaultName()).toBe(mockVpcsTemplate.default_name_format);
      expect(component.scriptFile()).toBe(mockVpcsTemplate.base_script_file);
      expect(component.symbol()).toBe(mockVpcsTemplate.symbol);
      expect(component.category()).toBe(mockVpcsTemplate.category);
      expect(component.consoleType()).toBe(mockVpcsTemplate.console_type);
      expect(component.consoleAutoStart()).toBe(mockVpcsTemplate.console_auto_start);
      expect(component.tags()).toEqual(mockVpcsTemplate.tags);
      expect(component.usage()).toBe(mockVpcsTemplate.usage);
    });

    it('should set consoleTypes and categories from configuration service', async () => {
      fixture.detectChanges();
      await fixture.whenStable();

      expect(component.consoleTypes).toEqual(['telnet', 'none']);
      expect(component.categories).toEqual([
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

      component.goBack();

      expect(mockRouter.navigate).toHaveBeenCalledWith([
        '/controller',
        mockController.id,
        'preferences',
        'vpcs',
        'templates',
      ]);
    });
  });

  describe('onSave', () => {
    beforeEach(async () => {
      fixture.detectChanges();
      await fixture.whenStable();
    });

    it('should show error toast when templateName is empty', () => {
      // templateName becomes empty, others keep their initialized values
      component.templateName.set('');

      component.onSave();

      expect(mockToasterService.error).toHaveBeenCalledWith('Missing required fields: Template name');
      expect(mockVpcsService.saveTemplate).not.toHaveBeenCalled();
    });

    it('should show error toast when defaultName is empty', () => {
      component.defaultName.set('');

      component.onSave();

      expect(mockToasterService.error).toHaveBeenCalledWith('Missing required fields: Default name format');
      expect(mockVpcsService.saveTemplate).not.toHaveBeenCalled();
    });

    it('should show error toast when scriptFile is empty', () => {
      component.scriptFile.set('');

      component.onSave();

      expect(mockToasterService.error).toHaveBeenCalledWith('Missing required fields: Base script file');
      expect(mockVpcsService.saveTemplate).not.toHaveBeenCalled();
    });

    it('should show error toast when symbol is empty', () => {
      component.symbol.set('');

      component.onSave();

      expect(mockToasterService.error).toHaveBeenCalledWith('Missing required fields: Symbol');
      expect(mockVpcsService.saveTemplate).not.toHaveBeenCalled();
    });

    it('should update vpcsTemplate from form values before saving', () => {
      component.templateName.set('New Name');
      component.defaultName.set('{name}');
      component.scriptFile.set('new_script.sh');
      component.symbol.set('new_symbol');
      component.category.set('router');
      component.consoleType.set('none');
      component.consoleAutoStart.set(false);
      component.tags.set(['new', 'tags']);
      component.usage.set('new usage');

      component.onSave();

      expect(component.vpcsTemplate.name).toBe('New Name');
      expect(component.vpcsTemplate.default_name_format).toBe('{name}');
      expect(component.vpcsTemplate.base_script_file).toBe('new_script.sh');
      expect(component.vpcsTemplate.symbol).toBe('new_symbol');
      expect(component.vpcsTemplate.category).toBe('router');
      expect(component.vpcsTemplate.console_type).toBe('none');
      expect(component.vpcsTemplate.console_auto_start).toBe(false);
      expect(component.vpcsTemplate.tags).toEqual(['new', 'tags']);
      expect(component.vpcsTemplate.usage).toBe('new usage');
    });

    it('should call vpcsService.saveTemplate with updated template', () => {
      component.templateName.set('Updated Name');

      component.onSave();

      expect(mockVpcsService.saveTemplate).toHaveBeenCalledWith(mockController, component.vpcsTemplate);
    });

    it('should show success toast after successful save', () => {
      component.onSave();

      expect(mockToasterService.success).toHaveBeenCalledWith('Changes saved');
    });
  });

  describe('chooseSymbol', () => {
    beforeEach(async () => {
      fixture.detectChanges();
      await fixture.whenStable();
    });

    it('should open dialog with correct config', () => {
      component.chooseSymbol();

      expect(mockDialogConfigService.openConfig).toHaveBeenCalledWith('templateSymbol', {
        autoFocus: false,
        disableClose: false,
        data: {
          controller: mockController,
          symbol: mockVpcsTemplate.symbol,
        },
      });
    });

    it('should open TemplateSymbolDialogComponent', () => {
      component.chooseSymbol();

      expect(mockDialog.open).toHaveBeenCalledWith(
        TemplateSymbolDialogComponent,
        expect.objectContaining({
          autoFocus: false,
          disableClose: false,
        })
      );
    });

    it('should update symbol when dialog returns a result', async () => {
      mockDialogRef.afterClosed.mockReturnValue(of('new_symbol_path'));

      component.chooseSymbol();

      expect(mockDialogRef.afterClosed).toHaveBeenCalled();
      expect(component.symbol()).toBe('new_symbol_path');
    });

    it('should not update symbol when dialog returns null', async () => {
      const originalSymbol = component.symbol();
      mockDialogRef.afterClosed.mockReturnValue(of(null));

      component.chooseSymbol();

      expect(component.symbol()).toBe(originalSymbol);
    });

    it('should not update symbol when dialog returns undefined', async () => {
      const originalSymbol = component.symbol();
      mockDialogRef.afterClosed.mockReturnValue(of(undefined));

      component.chooseSymbol();

      expect(component.symbol()).toBe(originalSymbol);
    });
  });

  describe('addTag', () => {
    beforeEach(async () => {
      fixture.detectChanges();
      await fixture.whenStable();
      component.tags.set(['existing1', 'existing2']);
    });

    it('should add new tag to tags array', () => {
      const mockEvent = {
        value: 'newTag',
        chipInput: { clear: vi.fn() },
      } as any;

      component.addTag(mockEvent);

      expect(component.tags()).toContain('newTag');
      expect(component.tags()).toHaveLength(3);
    });

    it('should trim whitespace from tag value', () => {
      const mockEvent = {
        value: '  trimmedTag  ',
        chipInput: { clear: vi.fn() },
      } as any;

      component.addTag(mockEvent);

      expect(component.tags()).toContain('trimmedTag');
    });

    it('should not add empty tag', () => {
      const mockEvent = {
        value: '   ',
        chipInput: { clear: vi.fn() },
      } as any;

      component.addTag(mockEvent);

      expect(component.tags()).toHaveLength(2);
    });

    it('should clear chipInput', () => {
      const mockEvent = {
        value: 'newTag',
        chipInput: { clear: vi.fn() },
      } as any;

      component.addTag(mockEvent);

      expect(mockEvent.chipInput.clear).toHaveBeenCalled();
    });

    it('should handle missing chipInput', () => {
      const mockEvent = {
        value: 'newTag',
        chipInput: null,
      } as any;

      expect(() => component.addTag(mockEvent)).not.toThrow();
    });
  });

  describe('removeTag', () => {
    beforeEach(async () => {
      fixture.detectChanges();
      await fixture.whenStable();
      component.tags.set(['tag1', 'tag2', 'tag3']);
    });

    it('should remove existing tag from tags array', () => {
      component.removeTag('tag2');

      expect(component.tags()).not.toContain('tag2');
      expect(component.tags()).toHaveLength(2);
    });

    it('should preserve other tags when removing one', () => {
      component.removeTag('tag2');

      expect(component.tags()).toEqual(['tag1', 'tag3']);
    });

    it('should not modify tags array if tag not found', () => {
      const originalTags = [...component.tags()];

      component.removeTag('nonexistent');

      expect(component.tags()).toEqual(originalTags);
    });

    it('should handle removing last tag', () => {
      component.tags.set(['onlyTag']);

      component.removeTag('onlyTag');

      expect(component.tags()).toEqual([]);
    });
  });

  describe('error handling', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should show error toaster when controllerService.get fails', async () => {
      mockControllerService.get.mockRejectedValue({ error: { message: 'Controller error' } });

      fixture = TestBed.createComponent(VpcsTemplateDetailsComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
      await fixture.whenStable();

      expect(mockToasterService.error).toHaveBeenCalledWith('Controller error');
    });

    it('should use fallback message when controllerService.get error has no message', async () => {
      mockControllerService.get.mockRejectedValue({});

      fixture = TestBed.createComponent(VpcsTemplateDetailsComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
      await fixture.whenStable();

      expect(mockToasterService.error).toHaveBeenCalledWith('Failed to load controller');
    });

    it('should show error toaster when getTemplate fails', async () => {
      mockVpcsService.getTemplate.mockReturnValue(
        throwError(() => ({ error: { message: 'Template error' } }))
      );

      fixture = TestBed.createComponent(VpcsTemplateDetailsComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
      await fixture.whenStable();

      expect(mockToasterService.error).toHaveBeenCalledWith('Template error');
    });

    it('should use fallback message when getTemplate error has no message', async () => {
      mockVpcsService.getTemplate.mockReturnValue(throwError(() => ({})));

      fixture = TestBed.createComponent(VpcsTemplateDetailsComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
      await fixture.whenStable();

      expect(mockToasterService.error).toHaveBeenCalledWith('Failed to load VPCS template');
    });

    it('should show error toaster when saveTemplate fails', async () => {
      mockVpcsService.saveTemplate.mockReturnValue(
        throwError(() => ({ error: { message: 'Save error' } }))
      );
      fixture.detectChanges();
      await fixture.whenStable();

      component.onSave();

      expect(mockToasterService.error).toHaveBeenCalledWith('Save error');
    });

    it('should use fallback message when saveTemplate error has no message', async () => {
      mockVpcsService.saveTemplate.mockReturnValue(throwError(() => ({})));
      fixture.detectChanges();
      await fixture.whenStable();

      component.onSave();

      expect(mockToasterService.error).toHaveBeenCalledWith('Failed to save VPCS template');
    });
  });
});
