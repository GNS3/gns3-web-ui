import { describe, it, expect, beforeEach, vi } from 'vitest';
import { IouService } from './iou.service';
import { HttpController } from './http-controller.service';
import { Observable, of } from 'rxjs';
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
      name: 'Test Controller',
      location: 'local',
      host: 'localhost',
      port: 3080,
      protocol: 'http:',
      status: 'running',
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
    it('should call httpController.get with templates endpoint', () => {
      mockHttpController.get.mockReturnValue(of([]));

      service.getTemplates(mockController);

      expect(mockHttpController.get).toHaveBeenCalledWith(mockController, '/templates');
    });

    it('should return Observable of IouTemplate array', () => {
      mockHttpController.get.mockReturnValue(of([]));

      const result = service.getTemplates(mockController);

      expect(result).toBeInstanceOf(Observable);
    });
  });

  describe('getTemplate', () => {
    it('should call httpController.get with template_id', () => {
      mockHttpController.get.mockReturnValue(of({}));

      service.getTemplate(mockController, 'iou-1');

      expect(mockHttpController.get).toHaveBeenCalledWith(mockController, '/templates/iou-1');
    });

    it('should return Observable', () => {
      mockHttpController.get.mockReturnValue(of({}));

      const result = service.getTemplate(mockController, 'iou-1');

      expect(result).toBeInstanceOf(Observable);
    });
  });

  describe('getImages', () => {
    it('should call httpController.get with images endpoint', () => {
      mockHttpController.get.mockReturnValue(of([]));

      service.getImages(mockController);

      expect(mockHttpController.get).toHaveBeenCalledWith(mockController, '/images?image_type=iou');
    });

    it('should return Observable', () => {
      mockHttpController.get.mockReturnValue(of([]));

      const result = service.getImages(mockController);

      expect(result).toBeInstanceOf(Observable);
    });
  });

  describe('getImagePath', () => {
    it('should return correct URL for image', () => {
      const result = service.getImagePath(mockController, 'iou.bin');

      expect(result).toContain('http://');
      expect(result).toContain('localhost:3080');
      expect(result).toContain('iou.bin');
    });

    it('should include version in path', () => {
      const result = service.getImagePath(mockController, 'image.bin');

      expect(result).toContain('/3.0.0/');
    });
  });

  describe('addTemplate', () => {
    it('should call httpController.post with template', () => {
      const template: IouTemplate = { name: 'New IOU' } as IouTemplate;
      mockHttpController.post.mockReturnValue(of(template));

      service.addTemplate(mockController, template);

      expect(mockHttpController.post).toHaveBeenCalledWith(mockController, '/templates', template);
    });

    it('should return Observable', () => {
      const template: IouTemplate = { name: 'New IOU' } as IouTemplate;
      mockHttpController.post.mockReturnValue(of(template));

      const result = service.addTemplate(mockController, template);

      expect(result).toBeInstanceOf(Observable);
    });
  });

  describe('saveTemplate', () => {
    it('should call httpController.put with template_id', () => {
      const template: IouTemplate = { template_id: 'iou-1', name: 'Updated' } as IouTemplate;
      mockHttpController.put.mockReturnValue(of(template));

      service.saveTemplate(mockController, template);

      expect(mockHttpController.put).toHaveBeenCalledWith(
        mockController,
        '/templates/iou-1',
        template
      );
    });

    it('should return Observable', () => {
      const template: IouTemplate = { template_id: 'iou-1', name: 'Updated' } as IouTemplate;
      mockHttpController.put.mockReturnValue(of(template));

      const result = service.saveTemplate(mockController, template);

      expect(result).toBeInstanceOf(Observable);
    });
  });
});
