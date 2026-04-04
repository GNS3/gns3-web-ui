import { describe, it, expect, beforeEach, vi } from 'vitest';
import { IouService } from './iou.service';
import { HttpController } from './http-controller.service';
import { of, throwError, firstValueFrom } from 'rxjs';
import { Controller } from '@models/controller';
import { IouTemplate } from '@models/templates/iou-template';

vi.mock('environments/environment', () => ({
  environment: {
    current_version: '3.0.0',
  },
}));

describe('IouService', () => {
  let service: IouService;
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
      authToken: 'test-token',
      name: 'Test Controller',
      location: 'local',
      host: 'localhost',
      port: 3080,
      path: '',
      ubridge_path: '',
      status: 'running',
      protocol: 'http:',
      username: '',
      password: '',
      tokenExpired: false,
    } as Controller;

    service = new IouService(mockHttpController);
  });

  describe('Service Creation', () => {
    it('should create the service', () => {
      expect(service).toBeTruthy();
    });

    it('should be instance of IouService', () => {
      expect(service).toBeInstanceOf(IouService);
    });
  });

  describe('getTemplates', () => {
    it('should call httpController.get with templates endpoint', async () => {
      mockHttpController.get.mockReturnValue(of([]));
      service.getTemplates(mockController);
      expect(mockHttpController.get).toHaveBeenCalledWith(mockController, '/templates');
    });

    it('should return Observable of IouTemplate array', async () => {
      const mockTemplates: IouTemplate[] = [
        { template_id: 'iou-1', name: 'IOU 1' } as IouTemplate,
        { template_id: 'iou-2', name: 'IOU 2' } as IouTemplate,
      ];
      mockHttpController.get.mockReturnValue(of(mockTemplates));

      const result = await firstValueFrom(service.getTemplates(mockController));

      expect(result).toEqual(mockTemplates);
    });

    it('should propagate error when API fails', async () => {
      const error = new Error('Server error');
      mockHttpController.get.mockReturnValue(throwError(() => error));

      await expect(firstValueFrom(service.getTemplates(mockController))).rejects.toThrow('Server error');
    });
  });

  describe('getTemplate', () => {
    it.each([
      { template_id: 'iou-1', expectedPath: '/templates/iou-1' },
      { template_id: 'iou-abc-123', expectedPath: '/templates/iou-abc-123' },
    ])('should call httpController.get with correct path for $template_id', async ({ template_id, expectedPath }) => {
      mockHttpController.get.mockReturnValue(of({}));
      service.getTemplate(mockController, template_id);
      expect(mockHttpController.get).toHaveBeenCalledWith(mockController, expectedPath);
    });

    it('should return the template data from API', async () => {
      const mockTemplate = { template_id: 'iou-1', name: 'Test IOU' };
      mockHttpController.get.mockReturnValue(of(mockTemplate));

      const result = await firstValueFrom(service.getTemplate(mockController, 'iou-1'));

      expect(result).toEqual(mockTemplate);
    });

    it('should propagate error when API fails', async () => {
      const error = new Error('Not found');
      mockHttpController.get.mockReturnValue(throwError(() => error));

      await expect(firstValueFrom(service.getTemplate(mockController, 'iou-1'))).rejects.toThrow('Not found');
    });
  });

  describe('getImages', () => {
    it('should call httpController.get with images endpoint', async () => {
      mockHttpController.get.mockReturnValue(of([]));
      service.getImages(mockController);
      expect(mockHttpController.get).toHaveBeenCalledWith(mockController, '/images?image_type=iou');
    });

    it('should return Observable of images array', async () => {
      const mockImages = [{ filename: 'iou.bin', md5sum: 'abc123' }];
      mockHttpController.get.mockReturnValue(of(mockImages));

      const result = await firstValueFrom(service.getImages(mockController));

      expect(result).toEqual(mockImages);
    });

    it('should propagate error when API fails', async () => {
      const error = new Error('Server error');
      mockHttpController.get.mockReturnValue(throwError(() => error));

      await expect(firstValueFrom(service.getImages(mockController))).rejects.toThrow('Server error');
    });
  });

  describe('getImagePath', () => {
    it('should return correct URL for image', () => {
      const result = service.getImagePath(mockController, 'iou.bin');
      expect(result).toBe('http://localhost:3080/v3/images/upload/iou.bin');
    });

    it('should include version in path', () => {
      const result = service.getImagePath(mockController, 'image.bin');
      expect(result).toContain('/v3/');
    });

    it.each([
      {
        protocol: 'http:' as const,
        host: 'localhost',
        port: 3080,
        expected: 'http://localhost:3080/v3/images/upload/test.bin',
      },
      {
        protocol: 'https:' as const,
        host: '192.168.1.1',
        port: 443,
        expected: 'https://192.168.1.1:443/v3/images/upload/test.bin',
      },
    ])('should handle different controller configs: $protocol $host:$port', ({ protocol, host, port, expected }) => {
      const controller = { ...mockController, protocol, host, port };
      const result = service.getImagePath(controller, 'test.bin');
      expect(result).toBe(expected);
    });
  });

  describe('addTemplate', () => {
    it('should call httpController.post with template', async () => {
      const template: IouTemplate = { name: 'New IOU' } as IouTemplate;
      mockHttpController.post.mockReturnValue(of(template));
      service.addTemplate(mockController, template);
      expect(mockHttpController.post).toHaveBeenCalledWith(mockController, '/templates', template);
    });

    it('should return the created template from API', async () => {
      const template: IouTemplate = { template_id: 'iou-new', name: 'New IOU' } as IouTemplate;
      mockHttpController.post.mockReturnValue(of(template));

      const result = await firstValueFrom(service.addTemplate(mockController, template));

      expect(result).toEqual(template);
    });

    it('should propagate error when API fails', async () => {
      const template: IouTemplate = { name: 'New IOU' } as IouTemplate;
      const error = new Error('Server error');
      mockHttpController.post.mockReturnValue(throwError(() => error));

      await expect(firstValueFrom(service.addTemplate(mockController, template))).rejects.toThrow('Server error');
    });
  });

  describe('saveTemplate', () => {
    it('should call httpController.put with template_id', async () => {
      const template: IouTemplate = { template_id: 'iou-1', name: 'Updated' } as IouTemplate;
      mockHttpController.put.mockReturnValue(of(template));
      service.saveTemplate(mockController, template);
      expect(mockHttpController.put).toHaveBeenCalledWith(mockController, '/templates/iou-1', template);
    });

    it('should return the updated template from API', async () => {
      const template: IouTemplate = { template_id: 'iou-1', name: 'Updated IOU' } as IouTemplate;
      mockHttpController.put.mockReturnValue(of(template));

      const result = await firstValueFrom(service.saveTemplate(mockController, template));

      expect(result).toEqual(template);
    });

    it('should propagate error when API fails', async () => {
      const template: IouTemplate = { template_id: 'iou-1', name: 'Updated' } as IouTemplate;
      const error = new Error('Server error');
      mockHttpController.put.mockReturnValue(throwError(() => error));

      await expect(firstValueFrom(service.saveTemplate(mockController, template))).rejects.toThrow('Server error');
    });
  });
});
