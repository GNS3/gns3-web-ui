import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { IosTemplatesComponent } from './ios-templates.component';
import { ControllerService } from '@services/controller.service';
import { IosService } from '@services/ios.service';
import { TemplateService } from '@services/template.service';
import { ToasterService } from '@services/toaster.service';
import { DeleteTemplateComponent } from '../../common/delete-template-component/delete-template.component';
import { EmptyTemplatesListComponent } from '../../common/empty-templates-list/empty-templates-list.component';
import { Controller } from '@models/controller';
import { IosTemplate } from '@models/templates/ios-template';
import { ChangeDetectorRef } from '@angular/core';
import { of } from 'rxjs';

describe('IosTemplatesComponent', () => {
  let fixture: ComponentFixture<IosTemplatesComponent>;
  let mockControllerService: any;
  let mockIosService: any;
  let mockCdr: any;
  let mockActivatedRoute: any;
  let mockRouter: any;

  const createMockController = (): Controller =>
    ({
      id: 1,
      name: 'Test Controller',
      location: 'local',
      host: 'localhost',
      port: 3080,
      protocol: 'http:',
      status: 'running',
      username: 'admin',
      password: 'admin',
      authToken: 'token',
      path: '/',
      ubridge_path: '/usr/bin/ubridge',
      tokenExpired: false,
    }) as Controller;

  const createMockIosTemplate = (overrides: Partial<IosTemplate> = {}): IosTemplate =>
    ({
      auto_delete_disks: false,
      builtin: false,
      category: 'Router',
      compute_id: 'local',
      console_auto_start: false,
      console_type: 'telnet',
      aux_type: '',
      default_name_format: 'Router{0}',
      disk0: 0,
      disk1: 0,
      exec_area: 0,
      idlemax: 0,
      idlepc: '',
      idlesleep: 0,
      image: 'c3720-adventerprisek9-mz124-15.image',
      mac_addr: '00:00:00:00:00:00',
      mmap: false,
      name: 'Test Router',
      nvram: 128,
      platform: 'c3720',
      private_config: '',
      ram: 128,
      sparsemem: false,
      startup_config: '',
      symbol: 'router',
      system_id: 'FTX123456',
      template_id: 'template-1',
      template_type: 'dynamips',
      usage: '',
      tags: [],
      ...overrides,
    }) as IosTemplate;

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

    mockIosService = {
      getTemplates: vi.fn().mockReturnValue(of([])),
    };

    mockRouter = {
      navigate: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [
        IosTemplatesComponent,
        RouterModule,
        MatDialogModule,
        DeleteTemplateComponent,
        EmptyTemplatesListComponent,
      ],
      providers: [
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: ControllerService, useValue: mockControllerService },
        { provide: IosService, useValue: mockIosService },
        { provide: ChangeDetectorRef, useValue: mockCdr },
        { provide: TemplateService, useValue: { deleteTemplate: vi.fn().mockReturnValue(of({})) } },
        { provide: ToasterService, useValue: { success: vi.fn() } },
        { provide: MatDialog, useValue: { open: vi.fn().mockReturnValue({ afterClosed: vi.fn().mockReturnValue(of(true)) }) } },
        { provide: Router, useValue: mockRouter },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(IosTemplatesComponent);
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
      expect(mockIosService.getTemplates).toHaveBeenCalled();
    });
  });

  describe('getTemplates', () => {
    it('should filter only dynamips templates with template_type "dynamips"', () => {
      const mixedTemplates = [
        createMockIosTemplate({ template_id: 'tmpl-1', template_type: 'dynamips' }),
        createMockIosTemplate({ template_id: 'tmpl-2', name: 'Other', template_type: 'qemu' }),
      ];
      mockIosService.getTemplates.mockReturnValue(of(mixedTemplates));

      fixture.componentInstance.getTemplates();
      fixture.detectChanges();

      expect(fixture.componentInstance.iosTemplates.length).toBe(1);
      expect(fixture.componentInstance.iosTemplates[0].template_type).toBe('dynamips');
    });

    it('should exclude builtin templates', () => {
      const templates = [
        createMockIosTemplate({ template_id: 'tmpl-1', name: 'Builtin-IOS', builtin: true }),
        createMockIosTemplate({ template_id: 'tmpl-2', name: 'User-IOS', builtin: false }),
      ];
      mockIosService.getTemplates.mockReturnValue(of(templates));

      fixture.componentInstance.getTemplates();
      fixture.detectChanges();

      expect(fixture.componentInstance.iosTemplates.length).toBe(1);
      expect(fixture.componentInstance.iosTemplates[0].name).toBe('User-IOS');
    });
  });

  describe('Template Rendering', () => {
    it('should show empty templates list when no templates exist', () => {
      mockIosService.getTemplates.mockReturnValue(of([]));
      fixture.componentInstance.getTemplates();
      fixture.detectChanges();

      const emptyListEl = fixture.nativeElement.querySelector('app-empty-templates-list');
      expect(emptyListEl).toBeTruthy();
    });

    it('should display ios templates in list when templates exist', () => {
      const templates = [createMockIosTemplate({ template_id: 'tmpl-1', name: 'IOS-1' })];
      mockIosService.getTemplates.mockReturnValue(of(templates));
      fixture.componentInstance.controller = createMockController();

      fixture.componentInstance.getTemplates();
      fixture.detectChanges();

      const listItems = fixture.nativeElement.querySelectorAll('.ios-templates__list-item');
      expect(listItems.length).toBe(1);
      expect(listItems[0].textContent).toContain('IOS-1');
    });

    it('should display back button when controller is loaded', () => {
      fixture.componentInstance.controller = createMockController();
      fixture.detectChanges();

      const backBtn = fixture.nativeElement.querySelector('.ios-templates__back-btn');
      expect(backBtn).toBeTruthy();
    });

    it('should display add button when controller is loaded', () => {
      fixture.componentInstance.controller = createMockController();
      fixture.detectChanges();

      const addBtn = fixture.nativeElement.querySelector('.ios-templates__add-btn');
      expect(addBtn).toBeTruthy();
    });
  });

  describe('copyTemplate', () => {
    it('should navigate to copy template page', () => {
      const template = createMockIosTemplate({ template_id: 'tmpl-1' });
      const controller = createMockController();
      fixture.componentInstance.controller = controller;

      fixture.componentInstance.copyTemplate(template);

      expect(mockRouter.navigate).toHaveBeenCalledWith([
        '/controller',
        controller.id,
        'preferences',
        'dynamips',
        'templates',
        template.template_id,
        'copy',
      ]);
    });
  });

  describe('onDeleteEvent', () => {
    it('should call getTemplates when delete event is emitted', () => {
      const getTemplatesSpy = vi.spyOn(fixture.componentInstance, 'getTemplates');

      fixture.componentInstance.onDeleteEvent();

      expect(getTemplatesSpy).toHaveBeenCalled();
    });
  });
});
