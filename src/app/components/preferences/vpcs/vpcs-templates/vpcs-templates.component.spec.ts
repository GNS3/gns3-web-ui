import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { VpcsTemplatesComponent } from './vpcs-templates.component';
import { ControllerService } from '@services/controller.service';
import { VpcsService } from '@services/vpcs.service';
import { TemplateService } from '@services/template.service';
import { ToasterService } from '@services/toaster.service';
import { DeleteTemplateComponent } from '../../common/delete-template-component/delete-template.component';
import { EmptyTemplatesListComponent } from '../../common/empty-templates-list/empty-templates-list.component';
import { Controller } from '@models/controller';
import { VpcsTemplate } from '@models/templates/vpcs-template';
import { ChangeDetectorRef } from '@angular/core';
import { of } from 'rxjs';

describe('VpcsTemplatesComponent', () => {
  let fixture: ComponentFixture<VpcsTemplatesComponent>;
  let mockControllerService: any;
  let mockVpcsService: any;
  let mockCdr: any;
  let mockActivatedRoute: any;

  const createMockController = (): Controller =>
    ({
      id: 1,
      name: 'Test Controller',
      location: 'local',
      host: 'localhost',
      port: 3080,
      protocol: 'http:',
      status: 'running',
    }) as Controller;

  const createMockVpcsTemplate = (id: string, name: string, builtin = false): VpcsTemplate =>
    ({
      template_id: id,
      name,
      template_type: 'vpcs',
      builtin,
      category: 'router',
      console_type: 'telnet',
      symbol: 'computer',
      compute_id: 'local',
      default_name_format: '{name}',
      console_auto_start: false,
      base_script_file: '',
    }) as VpcsTemplate;

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

    mockVpcsService = {
      getTemplates: vi.fn().mockReturnValue(of([])),
    };

    await TestBed.configureTestingModule({
      imports: [
        VpcsTemplatesComponent,
        RouterModule,
        MatDialogModule,
        DeleteTemplateComponent,
        EmptyTemplatesListComponent,
      ],
      providers: [
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: ControllerService, useValue: mockControllerService },
        { provide: VpcsService, useValue: mockVpcsService },
        { provide: ChangeDetectorRef, useValue: mockCdr },
        { provide: TemplateService, useValue: { deleteTemplate: vi.fn().mockReturnValue(of({})) } },
        { provide: ToasterService, useValue: { success: vi.fn() } },
        { provide: MatDialog, useValue: { open: vi.fn().mockReturnValue({ afterClosed: vi.fn().mockReturnValue(of(true)) }) } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(VpcsTemplatesComponent);
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
      expect(mockVpcsService.getTemplates).toHaveBeenCalled();
    });
  });

  describe('getTemplates', () => {
    it('should fetch vpcs templates from service', () => {
      const templates = [
        createMockVpcsTemplate('tmpl-1', 'VPCS-1'),
        createMockVpcsTemplate('tmpl-2', 'VPCS-2'),
      ];
      mockVpcsService.getTemplates.mockReturnValue(of(templates));

      fixture.componentInstance.getTemplates();

      expect(mockVpcsService.getTemplates).toHaveBeenCalled();
    });

    it('should filter only vpcs templates with template_type "vpcs"', () => {
      const mixedTemplates = [
        createMockVpcsTemplate('tmpl-1', 'VPCS-1'),
        { ...createMockVpcsTemplate('tmpl-2', 'Other'), template_type: 'docker' },
      ];
      mockVpcsService.getTemplates.mockReturnValue(of(mixedTemplates));

      fixture.componentInstance.getTemplates();
      fixture.detectChanges();

      expect(fixture.componentInstance.vpcsTemplates.length).toBe(1);
      expect(fixture.componentInstance.vpcsTemplates[0].name).toBe('VPCS-1');
    });

    it('should exclude builtin templates', () => {
      const templates = [
        createMockVpcsTemplate('tmpl-1', 'Builtin-VPCS', true),
        createMockVpcsTemplate('tmpl-2', 'User-VPCS', false),
      ];
      mockVpcsService.getTemplates.mockReturnValue(of(templates));

      fixture.componentInstance.getTemplates();
      fixture.detectChanges();

      expect(fixture.componentInstance.vpcsTemplates.length).toBe(1);
      expect(fixture.componentInstance.vpcsTemplates[0].name).toBe('User-VPCS');
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
      mockVpcsService.getTemplates.mockReturnValue(of([]));
      fixture.componentInstance.getTemplates();
      fixture.detectChanges();

      const emptyListEl = fixture.nativeElement.querySelector('app-empty-templates-list');
      expect(emptyListEl).toBeTruthy();
    });

    it('should display vpcs templates in list when templates exist', () => {
      const templates = [createMockVpcsTemplate('tmpl-1', 'VPCS-1')];
      mockVpcsService.getTemplates.mockReturnValue(of(templates));
      fixture.componentInstance.controller = createMockController();

      fixture.componentInstance.getTemplates();
      fixture.detectChanges();

      const listItems = fixture.nativeElement.querySelectorAll('.vpcs-templates__list-item');
      expect(listItems.length).toBe(1);
      expect(listItems[0].textContent).toContain('VPCS-1');
    });

    it('should display back button when controller is loaded', () => {
      fixture.componentInstance.controller = createMockController();
      fixture.detectChanges();

      const backBtn = fixture.nativeElement.querySelector('.vpcs-templates__back-btn');
      expect(backBtn).toBeTruthy();
    });

    it('should display add button when controller is loaded', () => {
      fixture.componentInstance.controller = createMockController();
      fixture.detectChanges();

      const addBtn = fixture.nativeElement.querySelector('.vpcs-templates__add-btn');
      expect(addBtn).toBeTruthy();
    });
  });
});
