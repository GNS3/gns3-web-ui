import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ImageManagerService } from './image-manager.service';
import { HttpController } from './http-controller.service';
import { Observable, of } from 'rxjs';
import { Controller } from '@models/controller';

vi.mock('environments/environment', () => ({
  environment: {
    current_version: '3.0.0',
  },
}));

describe('ImageManagerService', () => {
  let service: ImageManagerService;
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

    service = new ImageManagerService(mockHttpController);
  });

  describe('Service Creation', () => {
    it('should create the service', () => {
      expect(service).toBeTruthy();
    });

    it('should be instance of ImageManagerService', () => {
      expect(service).toBeInstanceOf(ImageManagerService);
    });
  });

  describe('getImages', () => {
    it('should call httpController.get with /images endpoint', () => {
      mockHttpController.get.mockReturnValue(of([]));

      service.getImages(mockController);

      expect(mockHttpController.get).toHaveBeenCalledWith(mockController, '/images');
    });

    it('should return Observable', () => {
      mockHttpController.get.mockReturnValue(of([]));

      const result = service.getImages(mockController);

      expect(result).toBeInstanceOf(Observable);
    });
  });

  describe('getImagePath', () => {
    it('should return correct URL for image', () => {
      const result = service.getImagePath(mockController, false, 'image.img');

      expect(result).toContain('http://');
      expect(result).toContain('localhost:3080');
      expect(result).toContain('image.img');
    });

    it('should include version in path', () => {
      const result = service.getImagePath(mockController, false, 'image.img');

      expect(result).toContain('/v3/');
    });

    it('should include install_appliances parameter when true', () => {
      const result = service.getImagePath(mockController, true, 'image.img');

      expect(result).toContain('install_appliances=true');
    });

    it('should include install_appliances=false when false', () => {
      const result = service.getImagePath(mockController, false, 'image.img');

      expect(result).toContain('install_appliances=false');
    });
  });

  describe('uploadedImage', () => {
    it('should call httpController.post with correct endpoint', () => {
      mockHttpController.post.mockReturnValue(of({}));
      const file = new Blob(['test'], { type: 'application/octet-stream' });

      service.uploadedImage(mockController, false, 'image.img', file);

      expect(mockHttpController.post).toHaveBeenCalledWith(
        mockController,
        '/images/upload/image.img?install_appliances=false',
        file
      );
    });

    it('should return Observable', () => {
      mockHttpController.post.mockReturnValue(of({}));
      const file = new Blob(['test'], { type: 'application/octet-stream' });

      const result = service.uploadedImage(mockController, false, 'image.img', file);

      expect(result).toBeInstanceOf(Observable);
    });
  });

  describe('deleteFile', () => {
    it('should call httpController.delete with correct endpoint', () => {
      mockHttpController.delete.mockReturnValue(of({}));

      service.deleteFile(mockController, 'image.img');

      expect(mockHttpController.delete).toHaveBeenCalledWith(mockController, '/images/image.img');
    });

    it('should return Observable', () => {
      mockHttpController.delete.mockReturnValue(of({}));

      const result = service.deleteFile(mockController, 'image.img');

      expect(result).toBeInstanceOf(Observable);
    });
  });

  describe('pruneImages', () => {
    it('should call httpController.delete with /images/prune endpoint', () => {
      mockHttpController.delete.mockReturnValue(of({}));

      service.pruneImages(mockController);

      expect(mockHttpController.delete).toHaveBeenCalledWith(mockController, '/images/prune');
    });

    it('should return Observable', () => {
      mockHttpController.delete.mockReturnValue(of({}));

      const result = service.pruneImages(mockController);

      expect(result).toBeInstanceOf(Observable);
    });
  });

  describe('installImages', () => {
    it('should call httpController.post with /images/install endpoint', () => {
      mockHttpController.post.mockReturnValue(of({}));

      service.installImages(mockController);

      expect(mockHttpController.post).toHaveBeenCalledWith(mockController, '/images/install', {});
    });

    it('should return Observable', () => {
      mockHttpController.post.mockReturnValue(of({}));

      const result = service.installImages(mockController);

      expect(result).toBeInstanceOf(Observable);
    });
  });
});
