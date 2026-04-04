import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { of } from 'rxjs';
import { EthernetSwitchesTemplateDetailsComponent } from './ethernet-switches-template-details.component';
import { ControllerService } from '@services/controller.service';
import { BuiltInTemplatesService } from '@services/built-in-templates.service';
import { BuiltInTemplatesConfigurationService } from '@services/built-in-templates-configuration.service';
import { ToasterService } from '@services/toaster.service';
import { DialogConfigService } from '@services/dialog-config.service';
import { PortsComponent } from '../../../common/ports/ports.component';
import { TemplateSymbolDialogComponent } from '@components/project-map/template-symbol-dialog/template-symbol-dialog.component';
import { Controller } from '@models/controller';
import { EthernetSwitchTemplate } from '@models/templates/ethernet-switch-template';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('EthernetSwitchesTemplateDetailsComponent', () => {
  let component: EthernetSwitchesTemplateDetailsComponent;
  let fixture: ComponentFixture<EthernetSwitchesTemplateDetailsComponent>;

  let mockControllerService: any;
  let mockBuiltInTemplatesService: any;
  let mockBuiltInTemplatesConfigurationService: any;
  let mockToasterService: any;
  let mockRouter: any;
  let mockDialog: any;
  let mockDialogRef: any;
  let mockDialogConfigService: any;
  let mockActivatedRoute: any;

  let mockController: Controller;
  let mockEthernetSwitchTemplate: EthernetSwitchTemplate;

  const createMockEthernetSwitchTemplate = (): EthernetSwitchTemplate => ({
    builtin: true,
    category: 'switch',
    compute_id: 'local',
    console_type: 'telnet',
    default_name_format: '{name}-{0}',
    name: 'Test Ethernet Switch',
    ports_mapping: [
      { name: 'Ethernet0', port_number: 0, vlan: 1, type: 'access', ethertype: '0x8100' },
      { name: 'Ethernet1', port_number: 1, vlan: 1, type: 'access', ethertype: '0x8100' },
    ],
    symbol: 'switch',
    template_id: 'template-123',
    template_type: 'ethernet_switch',
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

    mockEthernetSwitchTemplate = createMockEthernetSwitchTemplate();

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

    mockBuiltInTemplatesService = {
      getTemplate: vi.fn().mockReturnValue(of(mockEthernetSwitchTemplate)),
      saveTemplate: vi.fn().mockReturnValue(of(mockEthernetSwitchTemplate)),
    };

    mockBuiltInTemplatesConfigurationService = {
      getCategoriesForEthernetSwitches: vi.fn().mockReturnValue([
        ['Default', 'guest'],
        ['Routers', 'router'],
        ['Switches', 'switch'],
        ['End devices', 'guest'],
        ['Security devices', 'firewall'],
      ]),
      getConsoleTypesForEthernetSwitches: vi.fn().mockReturnValue(['telnet', 'none']),
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
      imports: [
        EthernetSwitchesTemplateDetailsComponent,
        MatDialogModule,
        RouterModule,
        PortsComponent,
      ],
      providers: [
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: ControllerService, useValue: mockControllerService },
        { provide: BuiltInTemplatesService, useValue: mockBuiltInTemplatesService },
        { provide: BuiltInTemplatesConfigurationService, useValue: mockBuiltInTemplatesConfigurationService },
        { provide: ToasterService, useValue: mockToasterService },
        { provide: Router, useValue: mockRouter },
        { provide: MatDialog, useValue: mockDialog },
        { provide: DialogConfigService, useValue: mockDialogConfigService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EthernetSwitchesTemplateDetailsComponent);
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

    it('should fetch ethernetSwitchTemplate after controller is loaded', async () => {
      fixture.detectChanges();
      await fixture.whenStable();

      expect(mockBuiltInTemplatesService.getTemplate).toHaveBeenCalledWith(mockController, 'template-123');
    });

    it('should set controller on component after loading', async () => {
      fixture.detectChanges();
      await fixture.whenStable();

      expect(component.controller).toBe(mockController);
    });

    it('should set ethernetSwitchTemplate on component after loading', async () => {
      fixture.detectChanges();
      await fixture.whenStable();

      expect(component.ethernetSwitchTemplate).toBe(mockEthernetSwitchTemplate);
    });

    it('should initialize tags array if template has no tags', async () => {
      const templateWithoutTags = { ...mockEthernetSwitchTemplate, tags: undefined };
      mockBuiltInTemplatesService.getTemplate.mockReturnValue(of(templateWithoutTags));

      fixture.detectChanges();
      await fixture.whenStable();

      expect(component.ethernetSwitchTemplate.tags).toEqual([]);
    });

    it('should call getConfiguration after template load', async () => {
      fixture.detectChanges();
      await fixture.whenStable();

      expect(mockBuiltInTemplatesConfigurationService.getCategoriesForEthernetSwitches).toHaveBeenCalled();
      expect(mockBuiltInTemplatesConfigurationService.getConsoleTypesForEthernetSwitches).toHaveBeenCalled();
    });

    it('should initialize form fields from template', async () => {
      fixture.detectChanges();
      await fixture.whenStable();

      expect(component.templateName()).toBe(mockEthernetSwitchTemplate.name);
      expect(component.defaultName()).toBe(mockEthernetSwitchTemplate.default_name_format);
      expect(component.symbol()).toBe(mockEthernetSwitchTemplate.symbol);
      expect(component.category()).toBe(mockEthernetSwitchTemplate.category);
      expect(component.consoleType()).toBe(mockEthernetSwitchTemplate.console_type);
      expect(component.tags()).toEqual(mockEthernetSwitchTemplate.tags);
      expect(component.usage()).toBe(mockEthernetSwitchTemplate.usage);
    });

    it('should set consoleTypes and categories from configuration service', async () => {
      fixture.detectChanges();
      await fixture.whenStable();

      expect(component.consoleTypes).toEqual(['telnet', 'none']);
      expect(component.categories).toEqual([
        ['Default', 'guest'],
        ['Routers', 'router'],
        ['Switches', 'switch'],
        ['End devices', 'guest'],
        ['Security devices', 'firewall'],
      ]);
    });
  });

  describe('goBack', () => {
    it('should navigate to ethernet switches list', async () => {
      fixture.detectChanges();
      await fixture.whenStable();

      component.goBack();

      expect(mockRouter.navigate).toHaveBeenCalledWith([
        '/controller',
        mockController.id,
        'preferences',
        'builtin',
        'ethernet-switches',
      ]);
    });
  });

  describe('onSave', () => {
    beforeEach(async () => {
      fixture.detectChanges();
      await fixture.whenStable();
      // Mock the portsComponent ViewChild
      component.portsComponent = {
        ethernetPorts: mockEthernetSwitchTemplate.ports_mapping,
      } as any;
    });

    it('should update ethernetSwitchTemplate from form values before saving', () => {
      component.templateName.set('New Name');
      component.defaultName.set('{name}');
      component.symbol.set('new_symbol');
      component.category.set('router');
      component.consoleType.set('none');
      component.tags.set(['new', 'tags']);
      component.usage.set('new usage');

      component.onSave();

      expect(component.ethernetSwitchTemplate.name).toBe('New Name');
      expect(component.ethernetSwitchTemplate.default_name_format).toBe('{name}');
      expect(component.ethernetSwitchTemplate.symbol).toBe('new_symbol');
      expect(component.ethernetSwitchTemplate.category).toBe('router');
      expect(component.ethernetSwitchTemplate.console_type).toBe('none');
      expect(component.ethernetSwitchTemplate.tags).toEqual(['new', 'tags']);
      expect(component.ethernetSwitchTemplate.usage).toBe('new usage');
    });

    it('should call builtInTemplatesService.saveTemplate with updated template', () => {
      component.templateName.set('Updated Name');

      component.onSave();

      expect(mockBuiltInTemplatesService.saveTemplate).toHaveBeenCalledWith(
        mockController,
        component.ethernetSwitchTemplate
      );
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
          symbol: mockEthernetSwitchTemplate.symbol,
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

  describe('toggleSection', () => {
    beforeEach(async () => {
      fixture.detectChanges();
      await fixture.whenStable();
    });

    it('should toggle generalSettingsExpanded when section is general', () => {
      const initialValue = component.generalSettingsExpanded();

      component.toggleSection('general');

      expect(component.generalSettingsExpanded()).toBe(!initialValue);
    });

    it('should toggle portsExpanded when section is ports', () => {
      const initialValue = component.portsExpanded();

      component.toggleSection('ports');

      expect(component.portsExpanded()).toBe(!initialValue);
    });

    it('should toggle usageExpanded when section is usage', () => {
      const initialValue = component.usageExpanded();

      component.toggleSection('usage');

      expect(component.usageExpanded()).toBe(!initialValue);
    });

    it('should not toggle for unknown section', () => {
      const generalInitial = component.generalSettingsExpanded();
      const portsInitial = component.portsExpanded();
      const usageInitial = component.usageExpanded();

      component.toggleSection('unknown');

      expect(component.generalSettingsExpanded()).toBe(generalInitial);
      expect(component.portsExpanded()).toBe(portsInitial);
      expect(component.usageExpanded()).toBe(usageInitial);
    });
  });
});
