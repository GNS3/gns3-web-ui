import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { EthernetSwitchesTemplatesComponent } from './ethernet-switches-templates.component';
import { ControllerService } from '@services/controller.service';
import { BuiltInTemplatesService } from '@services/built-in-templates.service';
import { TemplateService } from '@services/template.service';
import { ToasterService } from '@services/toaster.service';
import { DeleteTemplateComponent } from '../../../common/delete-template-component/delete-template.component';
import { EmptyTemplatesListComponent } from '../../../common/empty-templates-list/empty-templates-list.component';
import { Controller } from '@models/controller';
import { EthernetSwitchTemplate } from '@models/templates/ethernet-switch-template';
import { ChangeDetectorRef } from '@angular/core';
import { of } from 'rxjs';

describe('EthernetSwitchesTemplatesComponent', () => {
  let fixture: ComponentFixture<EthernetSwitchesTemplatesComponent>;
  let mockControllerService: any;
  let mockBuiltInTemplatesService: any;
  let mockCdr: any;
  let mockActivatedRoute: any;
  let mockDeleteItem: ReturnType<typeof vi.fn>;

  const createMockController = (): Controller =>
    ({
      id: 1,
      name: 'Test Controller',
      location: 'local',
      host: 'localhost',
      port: 3080,
      protocol: 'http:',
      status: 'running',
    } as Controller);

  const createMockEthernetSwitchTemplate = (id: string, name: string, builtin = false): EthernetSwitchTemplate =>
    ({
      template_id: id,
      name,
      template_type: 'ethernet_switch',
      builtin,
      category: 'switch',
      console_type: 'telnet',
      symbol: 'settings_ethernet',
      compute_id: 'local',
      default_name_format: '{name}',
      ports_mapping: [],
    } as EthernetSwitchTemplate);

  beforeEach(async () => {
    mockCdr = {
      markForCheck: vi.fn(),
    };

    mockActivatedRoute = {
      snapshot: {
        paramMap: {
          get: vi.fn().mockReturnValue('1'),
        },
      },
    };

    mockControllerService = {
      get: vi.fn().mockResolvedValue(createMockController()),
    };

    mockBuiltInTemplatesService = {
      getTemplates: vi.fn().mockReturnValue(of([])),
    };

    mockDeleteItem = vi.fn();

    await TestBed.configureTestingModule({
      imports: [
        EthernetSwitchesTemplatesComponent,
        RouterModule,
        MatDialogModule,
        DeleteTemplateComponent,
        EmptyTemplatesListComponent,
      ],
      providers: [
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: ControllerService, useValue: mockControllerService },
        { provide: BuiltInTemplatesService, useValue: mockBuiltInTemplatesService },
        { provide: ChangeDetectorRef, useValue: mockCdr },
        { provide: TemplateService, useValue: { deleteTemplate: vi.fn().mockReturnValue(of({})) } },
        { provide: ToasterService, useValue: { success: vi.fn() } },
        {
          provide: MatDialog,
          useValue: { open: vi.fn().mockReturnValue({ afterClosed: vi.fn().mockReturnValue(of(true)) }) },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EthernetSwitchesTemplatesComponent);
    // Override the viewChild signal to return a mock delete component
    Object.defineProperty(fixture.componentInstance, 'deleteComponent', {
      get: () => () => ({ deleteItem: mockDeleteItem }),
    });
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture?.destroy();
  });

  describe('Component Initialization', () => {
    it('should create the component', () => {
      expect(fixture.componentInstance).toBeTruthy();
    });

    it('should load controller from route params on init', () => {
      expect(mockActivatedRoute.snapshot.paramMap.get).toHaveBeenCalledWith('controller_id');
      expect(mockControllerService.get).toHaveBeenCalledWith(1);
    });

    it('should call getTemplates after controller is loaded', () => {
      expect(mockBuiltInTemplatesService.getTemplates).toHaveBeenCalled();
    });
  });

  describe('getTemplates', () => {
    it('should fetch ethernet switch templates from service', () => {
      const templates = [
        createMockEthernetSwitchTemplate('tmpl-1', 'Switch-1'),
        createMockEthernetSwitchTemplate('tmpl-2', 'Switch-2'),
      ];
      mockBuiltInTemplatesService.getTemplates.mockReturnValue(of(templates));

      fixture.componentInstance.getTemplates();

      expect(mockBuiltInTemplatesService.getTemplates).toHaveBeenCalled();
    });

    it('should filter only ethernet_switch templates with template_type "ethernet_switch"', () => {
      const mixedTemplates = [
        createMockEthernetSwitchTemplate('tmpl-1', 'Switch-1'),
        { ...createMockEthernetSwitchTemplate('tmpl-2', 'Other'), template_type: 'vpcs' },
      ];
      mockBuiltInTemplatesService.getTemplates.mockReturnValue(of(mixedTemplates));

      fixture.componentInstance.getTemplates();
      fixture.detectChanges();

      expect(fixture.componentInstance.ethernetSwitchesTemplates.length).toBe(1);
      expect(fixture.componentInstance.ethernetSwitchesTemplates[0].name).toBe('Switch-1');
    });

    it('should exclude builtin templates', () => {
      const templates = [
        createMockEthernetSwitchTemplate('tmpl-1', 'Builtin-Switch', true),
        createMockEthernetSwitchTemplate('tmpl-2', 'User-Switch', false),
      ];
      mockBuiltInTemplatesService.getTemplates.mockReturnValue(of(templates));

      fixture.componentInstance.getTemplates();
      fixture.detectChanges();

      expect(fixture.componentInstance.ethernetSwitchesTemplates.length).toBe(1);
      expect(fixture.componentInstance.ethernetSwitchesTemplates[0].name).toBe('User-Switch');
    });
  });

  describe('deleteTemplate', () => {
    it('should call deleteItem on deleteComponent with template name and id', () => {
      const template = createMockEthernetSwitchTemplate('tmpl-1', 'Switch-1');

      fixture.componentInstance.deleteTemplate(template);

      expect(mockDeleteItem).toHaveBeenCalledWith('Switch-1', 'tmpl-1');
    });
  });

  describe('onDeleteEvent', () => {
    it('should call getTemplates when delete event is emitted', () => {
      const getTemplatesSpy = vi.spyOn(fixture.componentInstance, 'getTemplates');

      fixture.componentInstance.onDeleteEvent();

      expect(getTemplatesSpy).toHaveBeenCalled();
    });
  });

  describe('Template Rendering', () => {
    it('should show empty templates list when no templates exist', () => {
      mockBuiltInTemplatesService.getTemplates.mockReturnValue(of([]));
      fixture.componentInstance.getTemplates();
      fixture.detectChanges();

      const emptyListEl = fixture.nativeElement.querySelector('app-empty-templates-list');
      expect(emptyListEl).toBeTruthy();
    });

    it('should display ethernet switch templates in list when templates exist', () => {
      const templates = [createMockEthernetSwitchTemplate('tmpl-1', 'Switch-1')];
      mockBuiltInTemplatesService.getTemplates.mockReturnValue(of(templates));
      fixture.componentInstance.controller = createMockController();

      fixture.componentInstance.getTemplates();
      fixture.detectChanges();

      const listItems = fixture.nativeElement.querySelectorAll('.ethernet-switches__list-item');
      expect(listItems.length).toBe(1);
      expect(listItems[0].textContent).toContain('Switch-1');
    });

    it('should display back button when controller is loaded', () => {
      fixture.componentInstance.controller = createMockController();
      fixture.detectChanges();

      const backBtn = fixture.nativeElement.querySelector('.ethernet-switches__back-btn');
      expect(backBtn).toBeTruthy();
    });

    it('should display add button when controller is loaded', () => {
      fixture.componentInstance.controller = createMockController();
      fixture.detectChanges();

      const addBtn = fixture.nativeElement.querySelector('.ethernet-switches__add-btn');
      expect(addBtn).toBeTruthy();
    });

    it('should display template name for each template', () => {
      const templates = [
        createMockEthernetSwitchTemplate('tmpl-1', 'Switch-One'),
        createMockEthernetSwitchTemplate('tmpl-2', 'Switch-Two'),
      ];
      mockBuiltInTemplatesService.getTemplates.mockReturnValue(of(templates));
      fixture.componentInstance.controller = createMockController();

      fixture.componentInstance.getTemplates();
      fixture.detectChanges();

      const listItems = fixture.nativeElement.querySelectorAll('.ethernet-switches__list-name');
      expect(listItems.length).toBe(2);
      expect(listItems[0].textContent).toContain('Switch-One');
      expect(listItems[1].textContent).toContain('Switch-Two');
    });

    it('should not display list when controller is not loaded', () => {
      fixture.componentInstance.controller = undefined;
      fixture.detectChanges();

      const list = fixture.nativeElement.querySelector('.ethernet-switches__list');
      expect(list).toBeFalsy();
    });
  });
});
