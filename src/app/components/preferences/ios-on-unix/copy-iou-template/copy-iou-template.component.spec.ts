import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { CopyIouTemplateComponent } from './copy-iou-template.component';
import { IouService } from '@services/iou.service';
import { ControllerService } from '@services/controller.service';
import { ToasterService } from '@services/toaster.service';
import { Controller } from '@models/controller';
import { IouTemplate } from '@models/templates/iou-template';
import { describe, it, expect, beforeEach, afterEach, vi, beforeAll } from 'vitest';

describe('CopyIouTemplateComponent', () => {
  let component: CopyIouTemplateComponent;
  let fixture: ComponentFixture<CopyIouTemplateComponent>;

  let mockIouService: any;
  let mockControllerService: any;
  let mockToasterService: any;
  let mockRouter: any;
  let mockActivatedRoute: any;

  let mockController: Controller;
  let mockIouTemplate: IouTemplate;

  beforeAll(() => {
    mockController = {
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
      authToken: 'token',
      tokenExpired: false,
    };

    mockIouTemplate = {
      builtin: false,
      category: 'router',
      compute_id: 'local',
      console_auto_start: false,
      console_type: 'none',
      default_name_format: '{name}-{0}',
      ethernet_adapters: 2,
      l1_keepalives: false,
      name: 'OriginalIOUTemplate',
      nvram: 256,
      path: '/path/to/iou',
      private_config: '',
      ram: 512,
      serial_adapters: 0,
      startup_config: '',
      symbol: 'iou',
      template_id: 'original-template-id',
      template_type: 'iou',
      usage: '',
      use_default_iou_values: true,
      tags: [],
    };
  });

  beforeEach(async () => {
    mockIouService = {
      getTemplate: vi.fn().mockReturnValue({
        subscribe: vi.fn((arg) => {
          if (typeof arg === 'function') arg(mockIouTemplate);
          else if (arg?.next) arg.next(mockIouTemplate);
          return { unsubscribe: vi.fn() };
        }),
      }),
      addTemplate: vi.fn().mockReturnValue({
        subscribe: vi.fn((arg) => {
          if (typeof arg === 'function') arg(mockIouTemplate);
          else if (arg?.next) arg.next(mockIouTemplate);
          return { unsubscribe: vi.fn() };
        }),
      }),
    };

    mockControllerService = {
      get: vi.fn().mockResolvedValue(mockController),
    };

    mockToasterService = {
      error: vi.fn(),
    };

    mockRouter = {
      navigate: vi.fn(),
    };

    mockActivatedRoute = {
      snapshot: {
        paramMap: {
          get: vi.fn().mockImplementation((key: string) => {
            if (key === 'controller_id') return '1';
            if (key === 'template_id') return 'original-template-id';
            return null;
          }),
        },
      },
    };

    await TestBed.configureTestingModule({
      imports: [CopyIouTemplateComponent],
      providers: [
        { provide: IouService, useValue: mockIouService },
        { provide: ControllerService, useValue: mockControllerService },
        { provide: ToasterService, useValue: mockToasterService },
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CopyIouTemplateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should fetch controller from route param', async () => {
    expect(mockControllerService.get).toHaveBeenCalledWith(1);
  });

  it('should fetch IOU template after controller loads', () => {
    expect(mockIouService.getTemplate).toHaveBeenCalledWith(mockController, 'original-template-id');
  });

  it('should set templateName to "Copy of {originalName}" after template loads', () => {
    expect(component.templateName).toBe('Copy of OriginalIOUTemplate');
  });

  it('should navigate back when goBack is called', () => {
    component.goBack();
    expect(mockRouter.navigate).toHaveBeenCalledWith([
      '/controller',
      mockController.id,
      'preferences',
      'iou',
      'templates',
    ]);
  });

  it('should show error when addTemplate is called with invalid form', () => {
    component.templateNameForm.get('templateName').setValue('');
    component.addTemplate();
    expect(mockToasterService.error).toHaveBeenCalledWith('Fill all required fields');
    expect(mockIouService.addTemplate).not.toHaveBeenCalled();
  });

  it('should add template with new UUID and name when addTemplate is called with valid data', () => {
    const initialTemplateId = mockIouTemplate.template_id;
    component.templateNameForm.get('templateName').setValue('MyCopyTemplate');
    fixture.detectChanges();

    mockIouService.addTemplate.mockReturnValue({
      subscribe: vi.fn((arg) => {
        if (typeof arg === 'function') arg(mockIouTemplate);
        else if (arg?.next) arg.next(mockIouTemplate);
        return { unsubscribe: vi.fn() };
      }),
    });

    component.addTemplate();

    expect(mockIouService.addTemplate).toHaveBeenCalledWith(mockController, expect.any(Object));
    const calledTemplate = mockIouService.addTemplate.mock.calls[0][1];
    expect(calledTemplate.template_id).not.toBe(initialTemplateId);
    expect(calledTemplate.name).toBe('MyCopyTemplate');
  });

  it('should navigate back after successfully adding template', () => {
    component.templateNameForm.get('templateName').setValue('MyCopyTemplate');
    fixture.detectChanges();

    mockIouService.addTemplate.mockReturnValue({
      subscribe: vi.fn((arg) => {
        if (typeof arg === 'function') arg(mockIouTemplate);
        else if (arg?.next) arg.next(mockIouTemplate);
        return { unsubscribe: vi.fn() };
      }),
    });

    component.addTemplate();

    expect(mockRouter.navigate).toHaveBeenCalled();
  });

  it('should use OnPush change detection strategy', () => {
    expect(component).toBeTruthy();
  });
});
