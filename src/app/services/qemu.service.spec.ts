import { describe, it, expect, beforeEach, vi } from 'vitest';
import { QemuService, QemuDiskImageOptions } from './qemu.service';
import { HttpController } from './http-controller.service';
import { Observable, of } from 'rxjs';
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
  let mockController: Controller;

  beforeEach(() => {
    mockHttpController = {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
    };

    mockController = {
      id: 1,
      name: 'Test Controller',
      location: 'local',
      host: 'localhost',
      port: 3080,
      protocol: 'http:',
      status: 'running',
    } as Controller;

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
      mockHttpController.get.mockReturnValue(of([]));

      service.getTemplates(mockController);

      expect(mockHttpController.get).toHaveBeenCalledWith(mockController, '/templates');
    });

    it('should return Observable of QemuTemplate array', () => {
      mockHttpController.get.mockReturnValue(of([]));

      const result = service.getTemplates(mockController);

      expect(result).toBeInstanceOf(Observable);
    });
  });

  describe('getTemplate', () => {
    it('should call httpController.get with template_id', () => {
      mockHttpController.get.mockReturnValue(of({}));

      service.getTemplate(mockController, 'qemu-1');

      expect(mockHttpController.get).toHaveBeenCalledWith(mockController, '/templates/qemu-1');
    });

    it('should return Observable', () => {
      mockHttpController.get.mockReturnValue(of({}));

      const result = service.getTemplate(mockController, 'qemu-1');

      expect(result).toBeInstanceOf(Observable);
    });
  });

  describe('getImagePath', () => {
    it('should return correct URL for image', () => {
      const result = service.getImagePath(mockController, 'qemu.img');

      expect(result).toContain('http://');
      expect(result).toContain('localhost:3080');
      expect(result).toContain('qemu.img');
    });

    it('should include version in path', () => {
      const result = service.getImagePath(mockController, 'image.bin');

      expect(result).toContain('/v3/');
    });
  });

  describe('getImages', () => {
    it('should call httpController.get with images endpoint', () => {
      mockHttpController.get.mockReturnValue(of([]));

      service.getImages(mockController);

      expect(mockHttpController.get).toHaveBeenCalledWith(mockController, '/images?image_type=qemu');
    });

    it('should return Observable', () => {
      mockHttpController.get.mockReturnValue(of([]));

      const result = service.getImages(mockController);

      expect(result).toBeInstanceOf(Observable);
    });
  });

  describe('createDiskImage', () => {
    it('should call httpController.post with correct endpoint', () => {
      mockHttpController.post.mockReturnValue(of({}));
      const options: QemuDiskImageOptions = { format: 'qcow2', size: 1000 };

      service.createDiskImage(mockController, 'proj-1', 'node-1', 'disk1.qcow2', options);

      expect(mockHttpController.post).toHaveBeenCalledWith(
        mockController,
        '/projects/proj-1/nodes/node-1/qemu/disk_image/disk1.qcow2',
        options
      );
    });

    it('should return Observable', () => {
      mockHttpController.post.mockReturnValue(of({}));
      const options: QemuDiskImageOptions = { format: 'qcow2', size: 1000 };

      const result = service.createDiskImage(mockController, 'proj-1', 'node-1', 'disk1.qcow2', options);

      expect(result).toBeInstanceOf(Observable);
    });
  });

  describe('addTemplate', () => {
    it('should call httpController.post with template', () => {
      const template: QemuTemplate = { name: 'New QEMU' } as QemuTemplate;
      mockHttpController.post.mockReturnValue(of(template));

      service.addTemplate(mockController, template);

      expect(mockHttpController.post).toHaveBeenCalledWith(mockController, '/templates', template);
    });

    it('should return Observable', () => {
      const template: QemuTemplate = { name: 'New QEMU' } as QemuTemplate;
      mockHttpController.post.mockReturnValue(of(template));

      const result = service.addTemplate(mockController, template);

      expect(result).toBeInstanceOf(Observable);
    });
  });

  describe('saveTemplate', () => {
    it('should call httpController.put with template_id', () => {
      const template: QemuTemplate = { template_id: 'qemu-1', name: 'Updated' } as QemuTemplate;
      mockHttpController.put.mockReturnValue(of(template));

      service.saveTemplate(mockController, template);

      expect(mockHttpController.put).toHaveBeenCalledWith(
        mockController,
        '/templates/qemu-1',
        template
      );
    });

    it('should return Observable', () => {
      const template: QemuTemplate = { template_id: 'qemu-1', name: 'Updated' } as QemuTemplate;
      mockHttpController.put.mockReturnValue(of(template));

      const result = service.saveTemplate(mockController, template);

      expect(result).toBeInstanceOf(Observable);
    });
  });
});
