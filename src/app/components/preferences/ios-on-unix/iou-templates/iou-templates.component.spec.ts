import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { IouTemplatesComponent } from './iou-templates.component';
import { IouService } from '@services/iou.service';
import { ControllerService } from '@services/controller.service';
import { TemplateService } from '@services/template.service';
import { ToasterService } from '@services/toaster.service';
import { DeleteTemplateComponent } from '../../common/delete-template-component/delete-template.component';
import { EmptyTemplatesListComponent } from '../../common/empty-templates-list/empty-templates-list.component';
import { Controller } from '@models/controller';
import { IouTemplate } from '@models/templates/iou-template';
import { of, firstValueFrom, throwError } from 'rxjs';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('IouTemplatesComponent', () => {
  let component: IouTemplatesComponent;
  let fixture: ComponentFixture<IouTemplatesComponent>;
  let mockIouService: any;
  let mockControllerService: any;
  let mockActivatedRoute: any;
  let mockRouter: any;
  let mockDialog: any;
  let mockToasterService: any;

  const mockController: Controller = {
    id: 1,
    name: 'Test Controller',
    authToken: 'token',
    location: 'local',
    host: 'localhost',
    port: 3080,
    path: '/',
    ubridge_path: '',
    protocol: 'http:',
    username: 'admin',
    password: 'admin',
    status: 'running',
    tokenExpired: false,
  };

  const mockIouTemplates: IouTemplate[] = [
    {
      template_id: '1',
      name: 'IOU Device 1',
      template_type: 'iou',
      builtin: false,
      category: 'router',
      compute_id: 'local',
      console_auto_start: false,
      console_type: 'telnet',
      default_name_format: '{name}',
      ethernet_adapters: 2,
      l1_keepalives: false,
      nvram: 512,
      path: '/path/to/iou1',
      private_config: '',
      ram: 256,
      serial_adapters: 0,
      startup_config: '',
      symbol: 'router',
      usage: '',
      use_default_iou_values: true,
      tags: [],
    },
    {
      template_id: '2',
      name: 'IOU Device 2',
      template_type: 'iou',
      builtin: false,
      category: 'switch',
      compute_id: 'local',
      console_auto_start: false,
      console_type: 'telnet',
      default_name_format: '{name}',
      ethernet_adapters: 4,
      l1_keepalives: false,
      nvram: 256,
      path: '/path/to/iou2',
      private_config: '',
      ram: 128,
      serial_adapters: 0,
      startup_config: '',
      symbol: 'switch',
      usage: '',
      use_default_iou_values: true,
      tags: [],
    },
  ];

  beforeEach(async () => {
    mockIouService = {
      getTemplates: vi.fn().mockReturnValue(of(mockIouTemplates)),
    };

    mockControllerService = {
      get: vi.fn().mockResolvedValue(mockController),
    };

    mockActivatedRoute = {
      snapshot: {
        paramMap: {
          get: vi.fn().mockReturnValue('1'),
        },
      },
    };

    mockRouter = {
      navigate: vi.fn(),
    };

    mockDialog = {
      open: vi.fn().mockReturnValue({
        afterClosed: vi.fn().mockReturnValue(of(false)),
      }),
    };

    mockToasterService = {
      error: vi.fn(),
      success: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [IouTemplatesComponent, DeleteTemplateComponent, EmptyTemplatesListComponent],
      providers: [
        { provide: IouService, useValue: mockIouService },
        { provide: ControllerService, useValue: mockControllerService },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: Router, useValue: mockRouter },
        { provide: MatDialog, useValue: mockDialog },
        { provide: TemplateService, useValue: {} },
        { provide: ToasterService, useValue: mockToasterService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(IouTemplatesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await firstValueFrom(mockIouService.getTemplates(mockController));
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should extract controller_id from route params on ngOnInit', () => {
    expect(mockActivatedRoute.snapshot.paramMap.get).toHaveBeenCalledWith('controller_id');
    expect(mockControllerService.get).toHaveBeenCalledWith(1);
  });

  it('should load controller from ControllerService', async () => {
    expect(component.controller).toEqual(mockController);
  });

  it('should fetch IOU templates on init after controller loads', () => {
    expect(mockIouService.getTemplates).toHaveBeenCalledWith(mockController);
  });

  it('should filter templates by template_type=iou and builtin=false', () => {
    expect(component.iouTemplates).toEqual(mockIouTemplates);
  });

  it('should have empty iouTemplates array initially before async operations', () => {
    const newFixture = TestBed.createComponent(IouTemplatesComponent);
    const newComponent = newFixture.componentInstance;
    expect(newComponent.iouTemplates).toEqual([]);
  });

  it('should show IOU templates list when templates exist', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const listItems = compiled.querySelectorAll('.iou-templates__list-item');
    expect(listItems.length).toBe(2);
  });

  it('should display template names in the list', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const firstTemplateName = compiled.querySelector('.iou-templates__list-name');
    expect(firstTemplateName?.textContent).toContain('IOU Device 1');
  });

  it('should show back button when controller is loaded', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const backButton = compiled.querySelector('.iou-templates__back-btn');
    expect(backButton).toBeTruthy();
  });

  it('should show add button when controller is loaded', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const addButton = compiled.querySelector('.iou-templates__add-btn');
    expect(addButton).toBeTruthy();
  });

  it('should call getTemplates again after delete event', () => {
    mockIouService.getTemplates.mockClear();
    component.onDeleteEvent();
    expect(mockIouService.getTemplates).toHaveBeenCalledWith(mockController);
  });

  it('should filter out non-iou templates', async () => {
    const mixedTemplates: IouTemplate[] = [
      ...mockIouTemplates,
      {
        template_id: '3',
        name: 'Non-IOU Template',
        template_type: 'docker',
        builtin: false,
        category: 'guest',
        compute_id: 'local',
        console_auto_start: false,
        console_type: 'telnet',
        default_name_format: '{name}',
        ethernet_adapters: 1,
        l1_keepalives: false,
        nvram: 128,
        path: '/path/to/docker',
        private_config: '',
        ram: 64,
        serial_adapters: 0,
        startup_config: '',
        symbol: 'docker',
        usage: '',
        use_default_iou_values: true,
        tags: [],
      },
    ];
    mockIouService.getTemplates.mockReturnValue(of(mixedTemplates));
    component.getTemplates();
    fixture.detectChanges();
    await firstValueFrom(mockIouService.getTemplates(mockController));
    fixture.detectChanges();
    expect(component.iouTemplates.length).toBe(2);
    expect(component.iouTemplates.every((t) => t.template_type === 'iou')).toBe(true);
  });

  it('should filter out builtin templates', async () => {
    const templatesWithBuiltin: IouTemplate[] = [
      ...mockIouTemplates,
      {
        template_id: '3',
        name: 'Builtin IOU',
        template_type: 'iou',
        builtin: true,
        category: 'router',
        compute_id: 'local',
        console_auto_start: false,
        console_type: 'telnet',
        default_name_format: '{name}',
        ethernet_adapters: 2,
        l1_keepalives: false,
        nvram: 512,
        path: '/path/to/iou3',
        private_config: '',
        ram: 256,
        serial_adapters: 0,
        startup_config: '',
        symbol: 'router',
        usage: '',
        use_default_iou_values: true,
        tags: [],
      },
    ];
    mockIouService.getTemplates.mockReturnValue(of(templatesWithBuiltin));
    component.getTemplates();
    fixture.detectChanges();
    await firstValueFrom(mockIouService.getTemplates(mockController));
    fixture.detectChanges();
    expect(component.iouTemplates.length).toBe(2);
    expect(component.iouTemplates.every((t) => !t.builtin)).toBe(true);
  });

  it('should navigate to copy template page when copyTemplate is called', () => {
    const template = mockIouTemplates[0];
    component.copyTemplate(template);
    expect(mockRouter.navigate).toHaveBeenCalledWith([
      '/controller',
      mockController.id,
      'preferences',
      'iou',
      'templates',
      template.template_id,
      'copy',
    ]);
  });

  describe('error handling', () => {
    it('should show error toaster when controllerService.get fails', async () => {
      mockControllerService.get.mockRejectedValue({ error: { message: 'Controller error' } });

      fixture = TestBed.createComponent(IouTemplatesComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
      await fixture.whenStable();

      expect(mockToasterService.error).toHaveBeenCalledWith('Controller error');
    });

    it('should use fallback message when controllerService.get error has no message', async () => {
      mockControllerService.get.mockRejectedValue({});

      fixture = TestBed.createComponent(IouTemplatesComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
      await fixture.whenStable();

      expect(mockToasterService.error).toHaveBeenCalledWith('Failed to load controller');
    });

    it('should show error toaster when getTemplates fails', async () => {
      mockIouService.getTemplates.mockReturnValue(throwError(() => ({ error: { message: 'Templates error' } })));
      component.controller = mockController;

      component.getTemplates();
      fixture.detectChanges();
      await fixture.whenStable();

      expect(mockToasterService.error).toHaveBeenCalledWith('Templates error');
    });

    it('should use fallback message when getTemplates error has no message', async () => {
      mockIouService.getTemplates.mockReturnValue(throwError(() => ({})));
      component.controller = mockController;

      component.getTemplates();
      fixture.detectChanges();
      await fixture.whenStable();

      expect(mockToasterService.error).toHaveBeenCalledWith('Failed to load IOU templates');
    });
  });
});
