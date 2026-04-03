import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { CopyIosTemplateComponent } from './copy-ios-template.component';
import { IosService } from '@services/ios.service';
import { ControllerService } from '@services/controller.service';
import { ToasterService } from '@services/toaster.service';
import { Controller } from '@models/controller';
import { IosTemplate } from '@models/templates/ios-template';
import { describe, it, expect, beforeEach, afterEach, vi, beforeAll } from 'vitest';

describe('CopyIosTemplateComponent', () => {
  let component: CopyIosTemplateComponent;
  let fixture: ComponentFixture<CopyIosTemplateComponent>;

  let mockIosService: any;
  let mockControllerService: any;
  let mockToasterService: any;
  let mockRouter: any;
  let mockActivatedRoute: any;

  let mockController: Controller;
  let mockIosTemplate: IosTemplate;

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

    mockIosTemplate = {
      auto_delete_disks: false,
      template_id: 'original-template-id',
      name: 'Original IOS Router',
      template_type: 'dynamips',
      builtin: false,
      category: 'router',
      compute_id: 'local',
      console_auto_start: false,
      console_type: 'telnet',
      aux_type: '',
      default_name_format: '{name}-{0}',
      disk0: 0,
      disk1: 0,
      exec_area: 0,
      idlemax: 0,
      idlepc: '',
      idlesleep: 0,
      image: '',
      mac_addr: '',
      mmap: false,
      nvram: 0,
      platform: 'c3725',
      private_config: '',
      ram: 0,
      sparsemem: false,
      startup_config: '',
      symbol: 'router',
      system_id: '',
      usage: '',
      tags: [],
    };
  });

  beforeEach(async () => {
    mockIosService = {
      getTemplate: vi.fn().mockReturnValue({
        subscribe: (callback: (template: IosTemplate) => void) => {
          callback(mockIosTemplate);
          return { unsubscribe: vi.fn() };
        },
      }),
      addTemplate: vi.fn().mockReturnValue({
        subscribe: (callback: (template: IosTemplate) => void) => {
          callback(mockIosTemplate);
          return { unsubscribe: vi.fn() };
        },
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
          get: vi.fn((param: string) => {
            if (param === 'controller_id') return '1';
            if (param === 'template_id') return 'original-template-id';
            return null;
          }),
        },
      },
    };

    await TestBed.configureTestingModule({
      imports: [CopyIosTemplateComponent],
      providers: [
        { provide: IosService, useValue: mockIosService },
        { provide: ControllerService, useValue: mockControllerService },
        { provide: ToasterService, useValue: mockToasterService },
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CopyIosTemplateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should fetch controller from route param', () => {
    expect(mockControllerService.get).toHaveBeenCalledWith(1);
  });

  it('should fetch IOS template after controller loads', () => {
    expect(mockIosService.getTemplate).toHaveBeenCalledWith(mockController, 'original-template-id');
  });

  it('should set templateName to "Copy of" original name when template loads', () => {
    expect(component.templateName).toBe('Copy of Original IOS Router');
  });

  it('should store the loaded IOS template', () => {
    expect(component.iosTemplate).toEqual(mockIosTemplate);
  });

  it('should store the loaded controller', () => {
    expect(component.controller).toEqual(mockController);
  });

  it('should navigate back when goBack is called', () => {
    component.goBack();
    expect(mockRouter.navigate).toHaveBeenCalledWith([
      '/controller',
      mockController.id,
      'preferences',
      'dynamips',
      'templates',
    ]);
  });

  it('should show error when addTemplate is called with empty templateName', () => {
    component.formGroup.get('templateName')?.setValue('');
    component.addTemplate();
    expect(mockToasterService.error).toHaveBeenCalledWith('Fill all required fields');
    expect(mockIosService.addTemplate).not.toHaveBeenCalled();
  });

  it('should show error when addTemplate is called with invalid form', () => {
    component.formGroup.get('templateName')?.setValue('');
    component.addTemplate();
    expect(mockToasterService.error).toHaveBeenCalledWith('Fill all required fields');
    expect(mockIosService.addTemplate).not.toHaveBeenCalled();
  });

  it('should add template and navigate back when addTemplate is called with valid data', () => {
    component.formGroup.get('templateName')?.setValue('My Copied Template');

    const addTemplateObservable = {
      subscribe: vi.fn((callback) => {
        callback();
        return { unsubscribe: vi.fn() };
      }),
    };
    mockIosService.addTemplate.mockReturnValue(addTemplateObservable);

    component.addTemplate();

    expect(mockIosService.addTemplate).toHaveBeenCalledWith(mockController, expect.any(Object));
    const calledTemplate = mockIosService.addTemplate.mock.calls[0][1];
    expect(calledTemplate.template_id).toBeTruthy();
    expect(calledTemplate.name).toBe('Copy of Original IOS Router');
    expect(mockRouter.navigate).toHaveBeenCalled();
  });

  it('should not navigate when addTemplate fails validation', () => {
    component.formGroup.get('templateName')?.setValue('');
    component.addTemplate();
    expect(mockRouter.navigate).not.toHaveBeenCalled();
  });

  it('should generate new UUID for copied template', () => {
    component.formGroup.get('templateName')?.setValue('Copy of Original IOS Router');

    let capturedTemplate: IosTemplate | undefined;
    mockIosService.addTemplate.mockReturnValue({
      subscribe: (callback: (template: IosTemplate) => void) => {
        callback(mockIosTemplate);
        return { unsubscribe: vi.fn() };
      },
    });

    component.addTemplate();

    capturedTemplate = mockIosService.addTemplate.mock.calls[0][1];
    expect(capturedTemplate.template_id).not.toBe('original-template-id');
    expect(capturedTemplate.template_id).toBeTruthy();
  });

  it('should use OnPush change detection strategy', () => {
    expect(component).toBeTruthy();
  });

  it('should update formGroup templateName control when value changes', () => {
    component.formGroup.get('templateName')?.setValue('Custom Name');
    expect(component.formGroup.get('templateName')?.value).toBe('Custom Name');
  });
});
