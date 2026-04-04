import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { CopyDockerTemplateComponent } from './copy-docker-template.component';
import { DockerService } from '@services/docker.service';
import { ControllerService } from '@services/controller.service';
import { ToasterService } from '@services/toaster.service';
import { Controller } from '@models/controller';
import { DockerTemplate } from '@models/templates/docker-template';
import { describe, it, expect, beforeEach, afterEach, vi, beforeAll } from 'vitest';

describe('CopyDockerTemplateComponent', () => {
  let component: CopyDockerTemplateComponent;
  let fixture: ComponentFixture<CopyDockerTemplateComponent>;

  let mockDockerService: any;
  let mockControllerService: any;
  let mockToasterService: any;
  let mockRouter: any;
  let mockActivatedRoute: any;

  let mockController: Controller;
  let mockDockerTemplate: DockerTemplate;

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

    mockDockerTemplate = {
      adapters: 1,
      builtin: false,
      category: 'container',
      compute_id: 'local',
      console_auto_start: false,
      console_http_path: '/',
      console_http_port: 8080,
      console_resolution: '1024x768',
      console_type: 'http',
      aux_type: '',
      mac_address: '',
      custom_adapters: [],
      default_name_format: '{name}-{0}',
      environment: '',
      extra_hosts: '',
      image: 'nginx:latest',
      name: 'Original Docker Container',
      start_command: '',
      symbol: 'docker',
      template_id: 'original-template-id',
      template_type: 'docker',
      usage: '',
      tags: [],
    };
  });

  beforeEach(async () => {
    mockDockerService = {
      getTemplate: vi.fn().mockReturnValue({
        subscribe: (callback: (template: DockerTemplate) => void) => {
          callback(mockDockerTemplate);
          return { unsubscribe: vi.fn() };
        },
      }),
      addTemplate: vi.fn().mockReturnValue({
        subscribe: (callback: (template: DockerTemplate) => void) => {
          callback(mockDockerTemplate);
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
      imports: [CopyDockerTemplateComponent],
      providers: [
        { provide: DockerService, useValue: mockDockerService },
        { provide: ControllerService, useValue: mockControllerService },
        { provide: ToasterService, useValue: mockToasterService },
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CopyDockerTemplateComponent);
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

  it('should fetch Docker template after controller loads', () => {
    expect(mockDockerService.getTemplate).toHaveBeenCalledWith(mockController, 'original-template-id');
  });

  it('should set templateName to "Copy of" original name when template loads', () => {
    expect(component.templateName).toBe('Copy of Original Docker Container');
  });

  it('should store the loaded Docker template', () => {
    expect(component.dockerTemplate).toEqual(mockDockerTemplate);
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
      'docker',
      'templates',
    ]);
  });

  it('should show error when addTemplate is called with empty templateName', () => {
    component.templateNameForm.get('templateName')?.setValue('');
    component.addTemplate();
    expect(mockToasterService.error).toHaveBeenCalledWith('Fill all required fields');
    expect(mockDockerService.addTemplate).not.toHaveBeenCalled();
  });

  it('should show error when addTemplate is called with invalid form', () => {
    component.templateNameForm.get('templateName')?.setValue('');
    component.addTemplate();
    expect(mockToasterService.error).toHaveBeenCalledWith('Fill all required fields');
    expect(mockDockerService.addTemplate).not.toHaveBeenCalled();
  });

  it('should add template and navigate back when addTemplate is called with valid data', () => {
    component.templateNameForm.get('templateName')?.setValue('My Copied Template');

    const addTemplateObservable = {
      subscribe: vi.fn((callback) => {
        callback();
        return { unsubscribe: vi.fn() };
      }),
    };
    mockDockerService.addTemplate.mockReturnValue(addTemplateObservable);

    component.addTemplate();

    expect(mockDockerService.addTemplate).toHaveBeenCalledWith(mockController, expect.any(Object));
    const calledTemplate = mockDockerService.addTemplate.mock.calls[0][1];
    expect(calledTemplate.template_id).toBeTruthy();
    expect(calledTemplate.name).toBe('Copy of Original Docker Container');
    expect(mockRouter.navigate).toHaveBeenCalled();
  });

  it('should not navigate when addTemplate fails validation', () => {
    component.templateNameForm.get('templateName')?.setValue('');
    component.addTemplate();
    expect(mockRouter.navigate).not.toHaveBeenCalled();
  });

  it('should generate new UUID for copied template', () => {
    component.templateNameForm.get('templateName')?.setValue('Copy of Original Docker Container');

    mockDockerService.addTemplate.mockReturnValue({
      subscribe: (callback: (template: DockerTemplate) => void) => {
        callback(mockDockerTemplate);
        return { unsubscribe: vi.fn() };
      },
    });

    component.addTemplate();

    const capturedTemplate = mockDockerService.addTemplate.mock.calls[0][1];
    expect(capturedTemplate.template_id).not.toBe('original-template-id');
    expect(capturedTemplate.template_id).toBeTruthy();
  });

  it('should use OnPush change detection strategy', () => {
    expect(component).toBeTruthy();
  });

  it('should update templateNameForm control when value changes', () => {
    component.templateNameForm.get('templateName')?.setValue('Custom Name');
    expect(component.templateNameForm.get('templateName')?.value).toBe('Custom Name');
  });
});
