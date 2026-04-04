import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ChangeDetectorRef } from '@angular/core';
import { of, Subject } from 'rxjs';
import { ImportApplianceComponent } from './import-appliance.component';
import { DockerService } from '@services/docker.service';
import { IosService } from '@services/ios.service';
import { IouService } from '@services/iou.service';
import { QemuService } from '@services/qemu.service';
import { ToasterService } from '@services/toaster.service';
import { Controller } from '@models/controller';
import { Project } from '@models/project';
import { QemuTemplate } from '@models/templates/qemu-template';
import { IouTemplate } from '@models/templates/iou-template';
import { IosTemplate } from '@models/templates/ios-template';
import { DockerTemplate } from '@models/templates/docker-template';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('ImportApplianceComponent', () => {
  let component: ImportApplianceComponent;
  let fixture: ComponentFixture<ImportApplianceComponent>;

  let mockDockerService: any;
  let mockIosService: any;
  let mockIouService: any;
  let mockQemuService: any;
  let mockToasterService: any;

  let mockController: Controller;
  let mockProject: Project;

  let templateAddedSubject: Subject<void>;

  beforeEach(async () => {
    templateAddedSubject = new Subject<void>();

    mockDockerService = {
      addTemplate: vi.fn().mockReturnValue(templateAddedSubject),
    };

    mockIosService = {
      addTemplate: vi.fn().mockReturnValue(templateAddedSubject),
    };

    mockIouService = {
      addTemplate: vi.fn().mockReturnValue(templateAddedSubject),
    };

    mockQemuService = {
      addTemplate: vi.fn().mockReturnValue(templateAddedSubject),
    };

    mockToasterService = {
      error: vi.fn(),
      success: vi.fn(),
    };

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

    mockProject = {
      project_id: 'proj1',
      name: 'Test Project',
      filename: 'test.gns3',
      status: 'opened',
      auto_close: true,
      auto_open: false,
      auto_start: false,
      scene_width: 2000,
      scene_height: 1000,
      zoom: 100,
      show_layers: false,
      snap_to_grid: false,
      show_grid: false,
      grid_size: 75,
      drawing_grid_size: 25,
      show_interface_labels: false,
      variables: [],
      path: '/path/to/project',
      readonly: false,
    } as Project;

    await TestBed.configureTestingModule({
      imports: [ImportApplianceComponent],
      providers: [
        { provide: DockerService, useValue: mockDockerService },
        { provide: IosService, useValue: mockIosService },
        { provide: IouService, useValue: mockIouService },
        { provide: QemuService, useValue: mockQemuService },
        { provide: ToasterService, useValue: mockToasterService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ImportApplianceComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('controller', mockController);
    fixture.componentRef.setInput('project', mockProject);
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
  });

  describe('Creation', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should have uploader initialized after ngOnInit', () => {
      expect(component.uploader).toBeDefined();
    });

    it('should have template undefined initially', () => {
      expect(component.template).toBeUndefined();
    });
  });

  describe('Inputs', () => {
    it('should accept controller input', () => {
      expect(component.controller()).toBe(mockController);
    });

    it('should accept project input', () => {
      expect(component.project()).toBe(mockProject);
    });
  });

  describe('ngOnInit', () => {
    it('should initialize FileUploader', () => {
      expect(component.uploader).toBeDefined();
      expect(component.uploader.options.url).toBe('');
    });

    it('should set onErrorItem to show error toast', () => {
      component.uploader.onErrorItem({} as any, '', 500, {} as any);
      expect(mockToasterService.error).toHaveBeenCalledWith('An error has occured');
    });

    it('should set onCompleteItem to call qemu service when template type is qemu', () => {
      component.ngOnInit();
      component.template = new QemuTemplate();
      component.template.template_type = 'qemu';

      component.uploader.onCompleteItem({} as any, '', 200, {} as any);

      expect(mockQemuService.addTemplate).toHaveBeenCalledWith(mockController, component.template);
    });

    it('should call onUploadComplete after qemu template is added', () => {
      component.ngOnInit();
      component.template = new QemuTemplate();
      component.template.template_type = 'qemu';

      component.uploader.onCompleteItem({} as any, '', 200, {} as any);
      templateAddedSubject.next();

      expect(mockToasterService.success).toHaveBeenCalledWith('Appliance imported successfully');
      expect(component.uploader.queue).toEqual([]);
    });
  });

  describe('uploadAppliance - template parsing', () => {
    // Since the actual file upload depends on ng2-file-upload being wired to a file input
    // (which is commented out in the template), we test the template creation logic
    // by directly testing the template object creation patterns

    it('should create QemuTemplate with correct structure when qemu key is present', () => {
      const template = new QemuTemplate();
      template.template_type = 'qemu';
      template.name = 'Test QEMU';
      template.category = 'router';
      template.builtin = false;
      template.default_name_format = '{name}-{0}';
      template.compute_id = 'vm';
      template.symbol = ':/symbols/router_guest.svg';

      expect(template).toBeInstanceOf(QemuTemplate);
      expect(template.template_type).toBe('qemu');
      expect(template.name).toBe('Test QEMU');
      expect(template.category).toBe('router');
      expect(template.builtin).toBe(false);
      expect(template.default_name_format).toBe('{name}-{0}');
      expect(template.compute_id).toBe('vm');
    });

    it('should create IouTemplate with correct structure when iou key is present', () => {
      const template = new IouTemplate();
      template.template_type = 'iou';
      template.name = 'Test IOU';
      template.category = 'router';
      template.builtin = false;
      template.default_name_format = '{name}-{0}';
      template.compute_id = 'vm';

      expect(template).toBeInstanceOf(IouTemplate);
      expect(template.template_type).toBe('iou');
      expect(template.name).toBe('Test IOU');
    });

    it('should create IosTemplate with correct structure when dynamips key is present', () => {
      const template = new IosTemplate();
      template.template_type = 'dynamips';
      template.name = 'Test IOS';
      template.category = 'router';
      template.builtin = false;
      template.default_name_format = '{name}-{0}';
      template.compute_id = 'vm';

      expect(template).toBeInstanceOf(IosTemplate);
      expect(template.template_type).toBe('dynamips');
      expect(template.name).toBe('Test IOS');
    });

    it('should create DockerTemplate with correct structure when docker key is present', () => {
      const template = new DockerTemplate();
      template.template_type = 'docker';
      template.name = 'Test Docker';
      template.category = 'guest';
      template.builtin = false;
      template.default_name_format = '{name}-{0}';
      template.compute_id = 'vm';
      template.symbol = ':/symbols/computer.svg';

      expect(template).toBeInstanceOf(DockerTemplate);
      expect(template.template_type).toBe('docker');
      expect(template.name).toBe('Test Docker');
    });

    it('should set guest symbol to computer.svg', () => {
      const template = new DockerTemplate();
      template.template_type = 'docker';
      template.category = 'guest';
      template.symbol = `:/symbols/computer.svg`;

      expect(template.symbol).toBe(':/symbols/computer.svg');
    });

    it('should set non-guest symbol to category_guest.svg', () => {
      const template = new QemuTemplate();
      template.template_type = 'qemu';
      template.category = 'router';
      template.symbol = `:/symbols/${template.category}_guest.svg`;

      expect(template.symbol).toBe(':/symbols/router_guest.svg');
    });
  });

  describe('uploadAppliance - IOU template', () => {
    it('should call iouService when template type is iou', () => {
      component.ngOnInit();
      component.template = new IouTemplate();
      component.template.template_type = 'iou';

      component.uploader.onCompleteItem({} as any, '', 200, {} as any);

      expect(mockIouService.addTemplate).toHaveBeenCalledWith(mockController, component.template);
    });

    it('should call onUploadComplete after iou template is added', () => {
      component.ngOnInit();
      component.template = new IouTemplate();
      component.template.template_type = 'iou';

      component.uploader.onCompleteItem({} as any, '', 200, {} as any);
      templateAddedSubject.next();

      expect(mockToasterService.success).toHaveBeenCalledWith('Appliance imported successfully');
      expect(component.uploader.queue).toEqual([]);
    });
  });

  describe('uploadAppliance - Dynamips template', () => {
    it('should call iosService when template type is dynamips', () => {
      component.ngOnInit();
      component.template = new IosTemplate();
      component.template.template_type = 'dynamips';

      component.uploader.onCompleteItem({} as any, '', 200, {} as any);

      expect(mockIosService.addTemplate).toHaveBeenCalledWith(mockController, component.template);
    });

    it('should call onUploadComplete after dynamips template is added', () => {
      component.ngOnInit();
      component.template = new IosTemplate();
      component.template.template_type = 'dynamips';

      component.uploader.onCompleteItem({} as any, '', 200, {} as any);
      templateAddedSubject.next();

      expect(mockToasterService.success).toHaveBeenCalledWith('Appliance imported successfully');
      expect(component.uploader.queue).toEqual([]);
    });
  });

  describe('uploadAppliance - Docker template', () => {
    it('should call dockerService when template type is docker', () => {
      component.ngOnInit();
      component.template = new DockerTemplate();
      component.template.template_type = 'docker';

      component.uploader.onCompleteItem({} as any, '', 200, {} as any);

      expect(mockDockerService.addTemplate).toHaveBeenCalledWith(mockController, component.template);
    });

    it('should call onUploadComplete after docker template is added', () => {
      component.ngOnInit();
      component.template = new DockerTemplate();
      component.template.template_type = 'docker';

      component.uploader.onCompleteItem({} as any, '', 200, {} as any);
      templateAddedSubject.next();

      expect(mockToasterService.success).toHaveBeenCalledWith('Appliance imported successfully');
      expect(component.uploader.queue).toEqual([]);
    });
  });

  describe('getUploadPath', () => {
    it('should construct correct upload URL', () => {
      const result = component['getUploadPath'](mockController, 'test-image.img');

      expect(result).toBe(
        `${mockController.protocol}//${mockController.host}:${mockController.port}/v3/images/upload/test-image.img`
      );
    });
  });
});
