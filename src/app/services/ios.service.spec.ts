import { describe, it, expect, beforeEach, vi } from 'vitest';
import { IosService } from './ios.service';
import { HttpController } from './http-controller.service';
import { Observable, of } from 'rxjs';
import { Controller } from '@models/controller';
import { IosTemplate } from '@models/templates/ios-template';
import { IosImage } from '@models/images/ios-image';

vi.mock('environments/environment', () => ({
  environment: {
    current_version: '3.0.0',
    compute_id: 'local',
  },
}));

describe('IosService', () => {
  let service: IosService;
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

    service = new IosService(mockHttpController);
  });

  describe('Service Creation', () => {
    it('should create the service', () => {
      expect(service).toBeTruthy();
    });

    it('should be instance of IosService', () => {
      expect(service).toBeInstanceOf(IosService);
    });
  });

  describe('getImages', () => {
    it('should call httpController.get with images endpoint', () => {
      mockHttpController.get.mockReturnValue(of([]));

      service.getImages(mockController);

      expect(mockHttpController.get).toHaveBeenCalledWith(mockController, '/images?image_type=ios');
    });

    it('should return Observable', () => {
      mockHttpController.get.mockReturnValue(of([]));

      const result = service.getImages(mockController);

      expect(result).toBeInstanceOf(Observable);
    });
  });

  describe('getImagePath', () => {
    it('should return correct URL for image', () => {
      const result = service.getImagePath(mockController, 'c3640.bin');

      expect(result).toContain('http://');
      expect(result).toContain('localhost:3080');
      expect(result).toContain('c3640.bin');
    });

    it('should include version in path', () => {
      const result = service.getImagePath(mockController, 'image.bin');

      expect(result).toContain('/3.0.0/');
    });
  });

  describe('getTemplates', () => {
    it('should call httpController.get with templates endpoint', () => {
      mockHttpController.get.mockReturnValue(of([]));

      service.getTemplates(mockController);

      expect(mockHttpController.get).toHaveBeenCalledWith(mockController, '/templates');
    });

    it('should return Observable of IosTemplate array', () => {
      mockHttpController.get.mockReturnValue(of([]));

      const result = service.getTemplates(mockController);

      expect(result).toBeInstanceOf(Observable);
    });
  });

  describe('getTemplate', () => {
    it('should call httpController.get with template_id', () => {
      mockHttpController.get.mockReturnValue(of({}));

      service.getTemplate(mockController, 'ios-1');

      expect(mockHttpController.get).toHaveBeenCalledWith(mockController, '/templates/ios-1');
    });

    it('should return Observable', () => {
      mockHttpController.get.mockReturnValue(of({}));

      const result = service.getTemplate(mockController, 'ios-1');

      expect(result).toBeInstanceOf(Observable);
    });
  });

  describe('addTemplate', () => {
    it('should call httpController.post with template', () => {
      const template: IosTemplate = { name: 'New IOS' } as IosTemplate;
      mockHttpController.post.mockReturnValue(of(template));

      service.addTemplate(mockController, template);

      expect(mockHttpController.post).toHaveBeenCalledWith(mockController, '/templates', template);
    });

    it('should return Observable', () => {
      const template: IosTemplate = { name: 'New IOS' } as IosTemplate;
      mockHttpController.post.mockReturnValue(of(template));

      const result = service.addTemplate(mockController, template);

      expect(result).toBeInstanceOf(Observable);
    });
  });

  describe('saveTemplate', () => {
    it('should call httpController.put with template_id', () => {
      const template: IosTemplate = { template_id: 'ios-1', name: 'Updated' } as IosTemplate;
      mockHttpController.put.mockReturnValue(of(template));

      service.saveTemplate(mockController, template);

      expect(mockHttpController.put).toHaveBeenCalledWith(
        mockController,
        '/templates/ios-1',
        template
      );
    });

    it('should return Observable', () => {
      const template: IosTemplate = { template_id: 'ios-1', name: 'Updated' } as IosTemplate;
      mockHttpController.put.mockReturnValue(of(template));

      const result = service.saveTemplate(mockController, template);

      expect(result).toBeInstanceOf(Observable);
    });
  });

  describe('findIdlePC', () => {
    it('should call httpController.post with auto_idlepc endpoint', () => {
      mockHttpController.post.mockReturnValue(of('0x1234'));

      service.findIdlePC(mockController, { path: '/path/to/image' });

      expect(mockHttpController.post).toHaveBeenCalledWith(
        mockController,
        '/computes/local/dynamips/auto_idlepc',
        { path: '/path/to/image' }
      );
    });

    it('should return Observable', () => {
      mockHttpController.post.mockReturnValue(of('0x1234'));

      const result = service.findIdlePC(mockController, {});

      expect(result).toBeInstanceOf(Observable);
    });
  });
});
