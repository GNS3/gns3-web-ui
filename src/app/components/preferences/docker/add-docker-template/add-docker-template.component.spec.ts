import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AddDockerTemplateComponent } from './add-docker-template.component';
import { DockerService } from '@services/docker.service';
import { ComputeService } from '@services/compute.service';
import { ControllerService } from '@services/controller.service';
import { TemplateMocksService } from '@services/template-mocks.service';
import { ToasterService } from '@services/toaster.service';
import { DockerConfigurationService } from '@services/docker-configuration.service';
import { DockerImage } from '@models/docker/docker-image';
import { DockerTemplate } from '@models/templates/docker-template';
import { Controller } from '@models/controller';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('AddDockerTemplateComponent', () => {
  let component: AddDockerTemplateComponent;
  let fixture: ComponentFixture<AddDockerTemplateComponent>;

  let mockControllerService: any;
  let mockDockerService: any;
  let mockTemplateMocksService: any;
  let mockToasterService: any;
  let mockRouter: any;
  let mockActivatedRoute: any;
  let mockComputeService: any;
  let mockConfigurationService: any;

  let mockController: Controller;
  let mockDockerTemplate: DockerTemplate;
  let mockDockerImages: DockerImage[];

  const createMockDockerTemplate = (): DockerTemplate => ({
    adapters: 1,
    builtin: false,
    category: 'container',
    compute_id: 'local',
    console_auto_start: false,
    console_http_path: '/',
    console_http_port: 80,
    console_resolution: '1024x768',
    console_type: 'telnet',
    aux_type: 'none',
    mac_address: '',
    custom_adapters: [],
    default_name_format: 'docker{0}',
    environment: '',
    extra_hosts: '',
    image: '',
    name: '',
    start_command: '',
    symbol: 'docker',
    template_id: '',
    template_type: 'docker',
    usage: '',
    tags: [],
  });

  const consoleTypes = ['telnet', 'vnc', 'http'];
  const auxConsoleTypes = ['none', 'telnet', 'http'];

  beforeEach(async () => {
    mockController = {
      id: 1,
      authToken: 'test-token',
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

    mockDockerTemplate = createMockDockerTemplate();

    mockDockerImages = [{ image: 'nginx:latest' }, { image: 'ubuntu:20.04' }, { image: 'alpine:latest' }];

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

    mockControllerService = {
      get: vi.fn().mockResolvedValue(mockController),
    };

    mockDockerService = {
      getImages: vi.fn().mockReturnValue(of(mockDockerImages)),
      addTemplate: vi.fn().mockReturnValue(of(mockDockerTemplate)),
    };

    mockTemplateMocksService = {
      getDockerTemplate: vi.fn().mockReturnValue(of(createMockDockerTemplate())),
    };

    mockToasterService = {
      error: vi.fn(),
      success: vi.fn(),
      warning: vi.fn(),
    };

    mockComputeService = {
      getComputes: vi.fn().mockReturnValue(of([])),
    };

    mockConfigurationService = {
      getConsoleTypes: vi.fn().mockReturnValue(consoleTypes),
      getAuxConsoleTypes: vi.fn().mockReturnValue(auxConsoleTypes),
    };

    await TestBed.configureTestingModule({
      imports: [AddDockerTemplateComponent],
      providers: [
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: Router, useValue: mockRouter },
        { provide: ControllerService, useValue: mockControllerService },
        { provide: DockerService, useValue: mockDockerService },
        { provide: TemplateMocksService, useValue: mockTemplateMocksService },
        { provide: ToasterService, useValue: mockToasterService },
        { provide: ComputeService, useValue: mockComputeService },
        { provide: DockerConfigurationService, useValue: mockConfigurationService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AddDockerTemplateComponent);
    component = fixture.componentInstance;
    component.ngOnInit();
    fixture.detectChanges();
    await fixture.whenStable();
  });

  afterEach(() => {
    if (fixture) {
      fixture.destroy();
    }
  });

  describe('Creation', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize isLocalComputerChosen to true', () => {
      expect(component.isLocalComputerChosen).toBe(true);
    });

    it('should initialize newImageSelected to false', () => {
      expect(component.newImageSelected).toBe(false);
    });

    it('should have empty filename model', () => {
      expect(component.filename()).toBe('');
    });

    it('should have empty templateName model', () => {
      expect(component.templateName()).toBe('');
    });

    it('should have adapters model initialized to 1', () => {
      expect(component.adapters()).toBe(1);
    });

    it('should have empty startCommand model', () => {
      expect(component.startCommand()).toBe('');
    });

    it('should have empty consoleType model', () => {
      expect(component.consoleType()).toBe('');
    });

    it('should have empty auxConsoleType model', () => {
      expect(component.auxConsoleType()).toBe('');
    });

    it('should have empty environment model', () => {
      expect(component.environment()).toBe('');
    });
  });

  describe('ngOnInit', () => {
    it('should fetch controller from route param controller_id', () => {
      expect(mockControllerService.get).toHaveBeenCalledWith(1);
    });

    it('should fetch docker images after controller is loaded', () => {
      expect(mockDockerService.getImages).toHaveBeenCalledWith(mockController);
    });

    it('should store controller when fetched', () => {
      expect(component.controller).toEqual(mockController);
    });

    it('should fetch template mock from templateMocksService', () => {
      expect(mockTemplateMocksService.getDockerTemplate).toHaveBeenCalled();
    });

    it('should set consoleTypes from configurationService', () => {
      expect(mockConfigurationService.getConsoleTypes).toHaveBeenCalled();
    });

    it('should set auxConsoleTypes from configurationService', () => {
      expect(mockConfigurationService.getAuxConsoleTypes).toHaveBeenCalled();
    });
  });

  describe('setControllerType', () => {
    it('should set isLocalComputerChosen to true when passed "local"', () => {
      component.isLocalComputerChosen = false;

      component.setControllerType('local');

      expect(component.isLocalComputerChosen).toBe(true);
    });

    it('should not change isLocalComputerChosen when passed "remote"', () => {
      component.isLocalComputerChosen = true;

      component.setControllerType('remote');

      expect(component.isLocalComputerChosen).toBe(true);
    });
  });

  describe('setDiskImage', () => {
    it('should set newImageSelected to true when passed "newImage"', () => {
      component.newImageSelected = false;

      component.setDiskImage('newImage');

      expect(component.newImageSelected).toBe(true);
    });

    it('should set newImageSelected to false when passed "existingImage"', () => {
      component.newImageSelected = true;

      component.setDiskImage('existingImage');

      expect(component.newImageSelected).toBe(false);
    });
  });

  describe('goBack', () => {
    it('should navigate to controller docker templates page', () => {
      component.controller = mockController;

      component.goBack();

      expect(mockRouter.navigate).toHaveBeenCalledWith([
        '/controller',
        mockController.id,
        'preferences',
        'docker',
        'templates',
      ]);
    });

    it('should navigate correctly even when controller id is 0', () => {
      const controllerWithZeroId = { ...mockController, id: 0 } as Controller;
      component.controller = controllerWithZeroId;

      component.goBack();

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/controller', 0, 'preferences', 'docker', 'templates']);
    });
  });

  describe('addTemplate', () => {
    it('should not add template when no image selected and newImageSelected is false', () => {
      component.newImageSelected = false;
      component.selectedImage = undefined;
      component.templateName.set('Test Template');
      component.adapters.set(1);
      fixture.detectChanges();

      component.addTemplate();

      expect(mockDockerService.addTemplate).not.toHaveBeenCalled();
    });

    it('should not add template when newImageSelected and filename is empty', () => {
      component.newImageSelected = true;
      component.filename.set('');
      component.templateName.set('Test Template');
      component.adapters.set(1);
      fixture.detectChanges();

      component.addTemplate();

      expect(mockDockerService.addTemplate).not.toHaveBeenCalled();
    });

    it('should not add template when newImageSelected and templateName is empty', () => {
      component.newImageSelected = true;
      component.filename.set('nginx:latest');
      component.templateName.set('');
      component.adapters.set(1);
      fixture.detectChanges();

      component.addTemplate();

      expect(mockDockerService.addTemplate).not.toHaveBeenCalled();
    });

    it('should not add template when newImageSelected and adapters is 0', () => {
      component.newImageSelected = true;
      component.filename.set('nginx:latest');
      component.templateName.set('Test Template');
      component.adapters.set(0);
      fixture.detectChanges();

      component.addTemplate();

      expect(mockDockerService.addTemplate).not.toHaveBeenCalled();
    });

    it('should call toasterService.error when required fields are missing', () => {
      component.newImageSelected = false;
      component.selectedImage = undefined;
      fixture.detectChanges();

      component.addTemplate();

      expect(mockToasterService.error).toHaveBeenCalledWith('Fill all required fields');
    });

    it('should add template when valid with existing image', async () => {
      component.newImageSelected = false;
      component.selectedImage = mockDockerImages[0];
      component.templateName.set('Test Template');
      component.adapters.set(1);
      fixture.detectChanges();

      component.addTemplate();
      await fixture.whenStable();

      expect(mockDockerService.addTemplate).toHaveBeenCalled();
    });

    it('should add template when valid with new image', async () => {
      component.newImageSelected = true;
      component.filename.set('nginx:latest');
      component.templateName.set('Test Template');
      component.adapters.set(1);
      fixture.detectChanges();

      component.addTemplate();
      await fixture.whenStable();

      expect(mockDockerService.addTemplate).toHaveBeenCalled();
    });

    it('should navigate to goBack after successful template addition', async () => {
      component.newImageSelected = false;
      component.selectedImage = mockDockerImages[0];
      component.templateName.set('Test Template');
      component.adapters.set(1);
      fixture.detectChanges();

      component.addTemplate();
      await fixture.whenStable();

      expect(mockRouter.navigate).toHaveBeenCalledWith([
        '/controller',
        mockController.id,
        'preferences',
        'docker',
        'templates',
      ]);
    });

    it('should set template_id to a uuid', async () => {
      component.newImageSelected = false;
      component.selectedImage = mockDockerImages[0];
      component.templateName.set('Test Template');
      component.adapters.set(1);
      fixture.detectChanges();

      let capturedTemplate: DockerTemplate | undefined;
      mockDockerService.addTemplate = vi.fn().mockImplementation((controller, template) => {
        capturedTemplate = template;
        return of(mockDockerTemplate);
      });

      component.addTemplate();
      await fixture.whenStable();

      expect(capturedTemplate?.template_id).toBeTruthy();
      expect(capturedTemplate?.template_id).not.toBe('');
    });

    it('should set name from templateName model', async () => {
      component.newImageSelected = false;
      component.selectedImage = mockDockerImages[0];
      component.templateName.set('My Docker Template');
      component.adapters.set(1);
      fixture.detectChanges();

      let capturedTemplate: DockerTemplate | undefined;
      mockDockerService.addTemplate = vi.fn().mockImplementation((controller, template) => {
        capturedTemplate = template;
        return of(mockDockerTemplate);
      });

      component.addTemplate();
      await fixture.whenStable();

      expect(capturedTemplate?.name).toBe('My Docker Template');
    });

    it('should set compute_id to local', async () => {
      component.newImageSelected = false;
      component.selectedImage = mockDockerImages[0];
      component.templateName.set('Test Template');
      component.adapters.set(1);
      fixture.detectChanges();

      let capturedTemplate: DockerTemplate | undefined;
      mockDockerService.addTemplate = vi.fn().mockImplementation((controller, template) => {
        capturedTemplate = template;
        return of(mockDockerTemplate);
      });

      component.addTemplate();
      await fixture.whenStable();

      expect(capturedTemplate?.compute_id).toBe('local');
    });

    it('should set image from selectedImage when newImageSelected is false', async () => {
      component.newImageSelected = false;
      component.selectedImage = mockDockerImages[0];
      component.templateName.set('Test Template');
      component.adapters.set(1);
      fixture.detectChanges();

      let capturedTemplate: DockerTemplate | undefined;
      mockDockerService.addTemplate = vi.fn().mockImplementation((controller, template) => {
        capturedTemplate = template;
        return of(mockDockerTemplate);
      });

      component.addTemplate();
      await fixture.whenStable();

      expect(capturedTemplate?.image).toBe('nginx:latest');
    });

    it('should set image from filename when newImageSelected is true', async () => {
      component.newImageSelected = true;
      component.filename.set('new_nginx:latest');
      component.templateName.set('Test Template');
      component.adapters.set(1);
      fixture.detectChanges();

      let capturedTemplate: DockerTemplate | undefined;
      mockDockerService.addTemplate = vi.fn().mockImplementation((controller, template) => {
        capturedTemplate = template;
        return of(mockDockerTemplate);
      });

      component.addTemplate();
      await fixture.whenStable();

      expect(capturedTemplate?.image).toBe('new_nginx:latest');
    });

    it('should set adapters from adapters model', async () => {
      component.newImageSelected = false;
      component.selectedImage = mockDockerImages[0];
      component.templateName.set('Test Template');
      component.adapters.set(4);
      fixture.detectChanges();

      let capturedTemplate: DockerTemplate | undefined;
      mockDockerService.addTemplate = vi.fn().mockImplementation((controller, template) => {
        capturedTemplate = template;
        return of(mockDockerTemplate);
      });

      component.addTemplate();
      await fixture.whenStable();

      expect(capturedTemplate?.adapters).toBe(4);
    });

    it('should set start_command from startCommand model', async () => {
      component.newImageSelected = false;
      component.selectedImage = mockDockerImages[0];
      component.templateName.set('Test Template');
      component.adapters.set(1);
      component.startCommand.set('/bin/bash');
      fixture.detectChanges();

      let capturedTemplate: DockerTemplate | undefined;
      mockDockerService.addTemplate = vi.fn().mockImplementation((controller, template) => {
        capturedTemplate = template;
        return of(mockDockerTemplate);
      });

      component.addTemplate();
      await fixture.whenStable();

      expect(capturedTemplate?.start_command).toBe('/bin/bash');
    });

    it('should set console_type from consoleType model', async () => {
      component.newImageSelected = false;
      component.selectedImage = mockDockerImages[0];
      component.templateName.set('Test Template');
      component.adapters.set(1);
      component.consoleType.set('vnc');
      fixture.detectChanges();

      let capturedTemplate: DockerTemplate | undefined;
      mockDockerService.addTemplate = vi.fn().mockImplementation((controller, template) => {
        capturedTemplate = template;
        return of(mockDockerTemplate);
      });

      component.addTemplate();
      await fixture.whenStable();

      expect(capturedTemplate?.console_type).toBe('vnc');
    });

    it('should set aux_type from auxConsoleType model', async () => {
      component.newImageSelected = false;
      component.selectedImage = mockDockerImages[0];
      component.templateName.set('Test Template');
      component.adapters.set(1);
      component.auxConsoleType.set('telnet');
      fixture.detectChanges();

      let capturedTemplate: DockerTemplate | undefined;
      mockDockerService.addTemplate = vi.fn().mockImplementation((controller, template) => {
        capturedTemplate = template;
        return of(mockDockerTemplate);
      });

      component.addTemplate();
      await fixture.whenStable();

      expect(capturedTemplate?.aux_type).toBe('telnet');
    });

    it('should set environment from environment model', async () => {
      component.newImageSelected = false;
      component.selectedImage = mockDockerImages[0];
      component.templateName.set('Test Template');
      component.adapters.set(1);
      component.environment.set('DEBUG=1');
      fixture.detectChanges();

      let capturedTemplate: DockerTemplate | undefined;
      mockDockerService.addTemplate = vi.fn().mockImplementation((controller, template) => {
        capturedTemplate = template;
        return of(mockDockerTemplate);
      });

      component.addTemplate();
      await fixture.whenStable();

      expect(capturedTemplate?.environment).toBe('DEBUG=1');
    });
  });

  describe('dockerImages', () => {
    it('should contain docker images when loaded', () => {
      expect(component.dockerImages).toEqual(mockDockerImages);
    });

    it('should have multiple docker images', () => {
      expect(component.dockerImages.length).toBe(3);
    });
  });

  describe('error handling', () => {
    it('should show error toaster when controllerService.get fails', async () => {
      mockControllerService.get.mockRejectedValue({ error: { message: 'Controller error' } });

      fixture = TestBed.createComponent(AddDockerTemplateComponent);
      component = fixture.componentInstance;
      component.ngOnInit();
      fixture.detectChanges();
      await fixture.whenStable();

      expect(mockToasterService.error).toHaveBeenCalledWith('Controller error');
    });

    it('should use fallback message when controllerService.get error has no message', async () => {
      mockControllerService.get.mockRejectedValue({});

      fixture = TestBed.createComponent(AddDockerTemplateComponent);
      component = fixture.componentInstance;
      component.ngOnInit();
      fixture.detectChanges();
      await fixture.whenStable();

      expect(mockToasterService.error).toHaveBeenCalledWith('Failed to load controller');
    });

    it('should show error toaster when getDockerTemplate fails', async () => {
      mockTemplateMocksService.getDockerTemplate.mockReturnValue(throwError(() => ({ error: { message: 'Template error' } })));

      fixture = TestBed.createComponent(AddDockerTemplateComponent);
      component = fixture.componentInstance;
      component.ngOnInit();
      fixture.detectChanges();
      await fixture.whenStable();

      expect(mockToasterService.error).toHaveBeenCalledWith('Template error');
    });

    it('should show error toaster when getImages fails', async () => {
      mockDockerService.getImages.mockReturnValue(throwError(() => ({ error: { message: 'Images error' } })));

      fixture = TestBed.createComponent(AddDockerTemplateComponent);
      component = fixture.componentInstance;
      component.ngOnInit();
      fixture.detectChanges();
      await fixture.whenStable();

      expect(mockToasterService.error).toHaveBeenCalledWith('Images error');
    });
  });
});
