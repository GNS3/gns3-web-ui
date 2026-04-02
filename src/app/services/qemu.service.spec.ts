import { describe, it, expect, beforeEach, vi } from 'vitest';
import { QemuService, QemuDiskImageOptions } from './qemu.service';
import { HttpController } from './http-controller.service';
import { Observable, of, throwError } from 'rxjs';
import { Controller } from '@models/controller';
import { QemuTemplate } from '@models/templates/qemu-template';

vi.mock('environments/environment', () => ({
  environment: {
    current_version: '3.0.0',
  },
}));

describe('QemuService', () => {
  let service: QemuService;
  let mockHttpController: any;

  const mockController: Controller = {
    id: 1,
    name: 'Test Controller',
    location: 'local',
    host: 'localhost',
    port: 3080,
    protocol: 'http:',
    status: 'running',
  } as Controller;

  const mockQemuTemplate: QemuTemplate = {
    template_id: 'qemu-1',
    name: 'Test VM',
    category: 'guest',
    template_type: 'qemu',
    linked_clone: true,
    compute_id: 'local',
    adapters: 1,
    ram: 512,
    cpus: 1,
    hda_disk_image: 'test.img',
    symbol: 'computer',
  } as QemuTemplate;

  const mockQemuTemplates: QemuTemplate[] = [
    { ...mockQemuTemplate, template_id: 'qemu-1', name: 'VM 1' },
    { ...mockQemuTemplate, template_id: 'qemu-2', name: 'VM 2' },
  ];

  beforeEach(() => {
    mockHttpController = {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
    };

    service = new QemuService(mockHttpController);
  });

  describe('Service Creation', () => {
    it('should create the service', () => {
      expect(service).toBeTruthy();
    });

    it('should be instance of QemuService', () => {
      expect(service).toBeInstanceOf(QemuService);
    });
  });

  describe('getTemplates', () => {
    it('should call httpController.get with templates endpoint', () => {
      mockHttpController.get.mockReturnValue(of(mockQemuTemplates));

      service.getTemplates(mockController);

      expect(mockHttpController.get).toHaveBeenCalledWith(mockController, '/templates');
    });

    it('should return observable that emits array of QemuTemplate', () => {
      mockHttpController.get.mockReturnValue(of(mockQemuTemplates));

      let emittedValue: QemuTemplate[] | null = null;
      service.getTemplates(mockController).subscribe((templates) => {
        emittedValue = templates;
      });

      expect(emittedValue).toEqual(mockQemuTemplates);
      expect(emittedValue).toHaveLength(2);
      expect(emittedValue?.[0].template_id).toBe('qemu-1');
    });

    it('should return observable that emits empty array when no templates', () => {
      mockHttpController.get.mockReturnValue(of([]));

      let emittedValue: QemuTemplate[] | null = null;
      service.getTemplates(mockController).subscribe((templates) => {
        emittedValue = templates;
      });

      expect(emittedValue).toEqual([]);
      expect(emittedValue).toHaveLength(0);
    });

    it('should emit error when httpController.get fails', () => {
      const error = new Error('Server error');
      mockHttpController.get.mockReturnValue(throwError(() => error));

      let emittedError: Error | null = null;
      service.getTemplates(mockController).subscribe({
        error: (err) => {
          emittedError = err;
        },
      });

      expect(emittedError).toBe(error);
      expect(emittedError?.message).toBe('Server error');
    });
  });

  describe('getTemplate', () => {
    it('should call httpController.get with correct template_id', () => {
      mockHttpController.get.mockReturnValue(of(mockQemuTemplate));

      service.getTemplate(mockController, 'qemu-1');

      expect(mockHttpController.get).toHaveBeenCalledWith(mockController, '/templates/qemu-1');
    });

    it('should return observable that emits the template', () => {
      mockHttpController.get.mockReturnValue(of(mockQemuTemplate));

      let emittedValue: QemuTemplate | null = null;
      service.getTemplate(mockController, 'qemu-1').subscribe((template) => {
        emittedValue = template;
      });

      expect(emittedValue).toEqual(mockQemuTemplate);
      expect(emittedValue?.name).toBe('Test VM');
    });

    it('should emit error when template is not found', () => {
      const error = new Error('Template not found');
      mockHttpController.get.mockReturnValue(throwError(() => error));

      let emittedError: Error | null = null;
      service.getTemplate(mockController, 'nonexistent').subscribe({
        error: (err) => {
          emittedError = err;
        },
      });

      expect(emittedError).toBe(error);
    });

    it.each([
      ['qemu-1'],
      ['template-abc'],
      ['123'],
    ])('should call correct endpoint for template_id: %s', (templateId) => {
      mockHttpController.get.mockReturnValue(of(mockQemuTemplate));

      service.getTemplate(mockController, templateId);

      expect(mockHttpController.get).toHaveBeenCalledWith(mockController, `/templates/${templateId}`);
    });
  });

  describe('getImagePath', () => {
    it.each([
      ['qemu.img', 'http://localhost:3080/3.0.0/images/upload/qemu.img'],
      ['image.bin', 'http://localhost:3080/3.0.0/images/upload/image.bin'],
      ['path/to/file.qcow2', 'http://localhost:3080/3.0.0/images/upload/path/to/file.qcow2'],
    ])('should return correct URL for image: %s', (filename, expected) => {
      expect(service.getImagePath(mockController, filename)).toBe(expected);
    });

    it('should use controller protocol, host and port', () => {
      const controller = { ...mockController, protocol: 'https:', host: '192.168.1.1', port: 8443 };
      const result = service.getImagePath(controller as Controller, 'test.img');

      expect(result).toContain('https://');
      expect(result).toContain('192.168.1.1:8443');
      expect(result).toContain('test.img');
    });

    it('should handle filenames with spaces', () => {
      const result = service.getImagePath(mockController, 'my image.qcow2');
      expect(result).toContain('my image.qcow2');
    });

    it('should handle special characters in filename', () => {
      const result = service.getImagePath(mockController, 'test@#$.img');
      expect(result).toContain('test@');
    });
  });

  describe('getImages', () => {
    it('should call httpController.get with images endpoint and qemu filter', () => {
      mockHttpController.get.mockReturnValue(of([]));

      service.getImages(mockController);

      expect(mockHttpController.get).toHaveBeenCalledWith(mockController, '/images?image_type=qemu');
    });

    it('should return observable that emits array of images', () => {
      const mockImages = [{ filename: 'img1.img' }, { filename: 'img2.img' }];
      mockHttpController.get.mockReturnValue(of(mockImages));

      let emittedValue: any[] | null = null;
      service.getImages(mockController).subscribe((images) => {
        emittedValue = images;
      });

      expect(emittedValue).toEqual(mockImages);
      expect(emittedValue).toHaveLength(2);
    });

    it('should emit error when fetching images fails', () => {
      const error = new Error('Network failure');
      mockHttpController.get.mockReturnValue(throwError(() => error));

      let emittedError: Error | null = null;
      service.getImages(mockController).subscribe({
        error: (err) => {
          emittedError = err;
        },
      });

      expect(emittedError).toBe(error);
    });
  });

  describe('createDiskImage', () => {
    const options: QemuDiskImageOptions = { format: 'qcow2', size: 1000 };

    it('should call httpController.post with correct endpoint', () => {
      mockHttpController.post.mockReturnValue(of({}));

      service.createDiskImage(mockController, 'proj-1', 'node-1', 'disk1.qcow2', options);

      expect(mockHttpController.post).toHaveBeenCalledWith(
        mockController,
        '/projects/proj-1/nodes/node-1/qemu/disk_image/disk1.qcow2',
        options
      );
    });

    it('should return observable that emits created disk image', () => {
      const createdImage = { disk: 'disk1.qcow2', size: 1000 };
      mockHttpController.post.mockReturnValue(of(createdImage));

      let emittedValue: any | null = null;
      service.createDiskImage(mockController, 'proj-1', 'node-1', 'disk1.qcow2', options).subscribe((result) => {
        emittedValue = result;
      });

      expect(emittedValue).toEqual(createdImage);
    });

    it('should emit error when disk creation fails', () => {
      const error = new Error('Insufficient space');
      mockHttpController.post.mockReturnValue(throwError(() => error));

      let emittedError: Error | null = null;
      service.createDiskImage(mockController, 'proj-1', 'node-1', 'disk1.qcow2', options).subscribe({
        error: (err) => {
          emittedError = err;
        },
      });

      expect(emittedError).toBe(error);
    });

    it.each([
      ['disk1.img', 'proj-1', 'node-1'],
      ['another.qcow2', 'project-abc', 'node-xyz'],
    ])('should format endpoint correctly for disk: %s', (diskName, projectId, nodeId) => {
      mockHttpController.post.mockReturnValue(of({}));

      service.createDiskImage(mockController, projectId, nodeId, diskName, options);

      expect(mockHttpController.post).toHaveBeenCalledWith(
        mockController,
        `/projects/${projectId}/nodes/${nodeId}/qemu/disk_image/${diskName}`,
        options
      );
    });

    it('should pass all QemuDiskImageOptions to httpController.post', () => {
      const fullOptions: QemuDiskImageOptions = {
        format: 'qcow2',
        size: 5000,
        preallocation: 'metadata',
        cluster_size: 65536,
        lazy_refcounts: 'on',
      };
      mockHttpController.post.mockReturnValue(of({}));

      service.createDiskImage(mockController, 'proj-1', 'node-1', 'disk.qcow2', fullOptions);

      expect(mockHttpController.post).toHaveBeenCalledWith(
        mockController,
        '/projects/proj-1/nodes/node-1/qemu/disk_image/disk.qcow2',
        fullOptions
      );
    });
  });

  describe('addTemplate', () => {
    it('should call httpController.post with template to templates endpoint', () => {
      const template: QemuTemplate = { name: 'New QEMU' } as QemuTemplate;
      mockHttpController.post.mockReturnValue(of(template));

      service.addTemplate(mockController, template);

      expect(mockHttpController.post).toHaveBeenCalledWith(mockController, '/templates', template);
    });

    it('should return observable that emits created template with id', () => {
      const inputTemplate = { name: 'New QEMU' } as QemuTemplate;
      const createdTemplate = { ...inputTemplate, template_id: 'qemu-new' };
      mockHttpController.post.mockReturnValue(of(createdTemplate));

      let emittedValue: QemuTemplate | null = null;
      service.addTemplate(mockController, inputTemplate).subscribe((template) => {
        emittedValue = template;
      });

      expect(emittedValue).toEqual(createdTemplate);
      expect(emittedValue?.template_id).toBe('qemu-new');
    });

    it('should emit error when adding template fails', () => {
      const template: QemuTemplate = { name: 'New QEMU' } as QemuTemplate;
      const error = new Error('Template name already exists');
      mockHttpController.post.mockReturnValue(throwError(() => error));

      let emittedError: Error | null = null;
      service.addTemplate(mockController, template).subscribe({
        error: (err) => {
          emittedError = err;
        },
      });

      expect(emittedError).toBe(error);
    });

    it('should pass full template object to httpController.post', () => {
      const fullTemplate = { ...mockQemuTemplate, name: 'Full VM' };
      mockHttpController.post.mockReturnValue(of(fullTemplate));

      service.addTemplate(mockController, fullTemplate);

      expect(mockHttpController.post).toHaveBeenCalledWith(mockController, '/templates', fullTemplate);
    });
  });

  describe('saveTemplate', () => {
    it('should call httpController.put with template_id in endpoint', () => {
      const template: QemuTemplate = { template_id: 'qemu-1', name: 'Updated' } as QemuTemplate;
      mockHttpController.put.mockReturnValue(of(template));

      service.saveTemplate(mockController, template);

      expect(mockHttpController.put).toHaveBeenCalledWith(
        mockController,
        '/templates/qemu-1',
        template
      );
    });

    it('should return observable that emits updated template', () => {
      const template: QemuTemplate = { template_id: 'qemu-1', name: 'Updated Name' } as QemuTemplate;
      mockHttpController.put.mockReturnValue(of(template));

      let emittedValue: QemuTemplate | null = null;
      service.saveTemplate(mockController, template).subscribe((result) => {
        emittedValue = result;
      });

      expect(emittedValue).toEqual(template);
      expect(emittedValue?.name).toBe('Updated Name');
    });

    it('should emit error when saving template fails', () => {
      const template: QemuTemplate = { template_id: 'qemu-1', name: 'Updated' } as QemuTemplate;
      const error = new Error('Template not found');
      mockHttpController.put.mockReturnValue(throwError(() => error));

      let emittedError: Error | null = null;
      service.saveTemplate(mockController, template).subscribe({
        error: (err) => {
          emittedError = err;
        },
      });

      expect(emittedError).toBe(error);
    });

    it.each([
      ['qemu-1', 'VM One'],
      ['template-abc', 'Another VM'],
      ['12345', 'Numbered VM'],
    ])('should use correct template_id %s in endpoint', (templateId, name) => {
      const template: QemuTemplate = { template_id: templateId, name } as QemuTemplate;
      mockHttpController.put.mockReturnValue(of(template));

      service.saveTemplate(mockController, template);

      expect(mockHttpController.put).toHaveBeenCalledWith(
        mockController,
        `/templates/${templateId}`,
        template
      );
    });
  });
});
