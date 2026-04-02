import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { IosService } from './ios.service';
import { HttpController } from './http-controller.service';
import { Observable, of, throwError } from 'rxjs';
import { firstValueFrom } from 'rxjs';
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

  afterEach(() => {
    vi.clearAllMocks();
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

    it('should return Observable of IosImage array', async () => {
      const mockImages: IosImage[] = [{ filename: 'c3640.bin' } as IosImage];
      mockHttpController.get.mockReturnValue(of(mockImages));

      const images = await firstValueFrom(service.getImages(mockController));

      expect(images).toEqual(mockImages);
    });

    it('should propagate error when httpController.get fails', async () => {
      const error = new Error('Network error');
      mockHttpController.get.mockReturnValue(throwError(() => error));

      await expect(firstValueFrom(service.getImages(mockController))).rejects.toThrow('Network error');
    });

    it.each([
      { images: [] as IosImage[], description: 'empty list' },
      { images: [{ filename: 'c3640.bin' } as IosImage], description: 'single image' },
      { images: [{ filename: 'a.bin' } as IosImage, { filename: 'b.bin' } as IosImage], description: 'multiple images' },
    ])('should handle $description', async ({ images }) => {
      mockHttpController.get.mockReturnValue(of(images));

      const result = await firstValueFrom(service.getImages(mockController));

      expect(result).toEqual(images);
    });
  });

  describe('getImagePath', () => {
    it.each([
      { filename: 'c3640.bin', expected: 'c3640.bin' },
      { filename: 'test-image.bin', expected: 'test-image.bin' },
      { filename: 'i86bi-linux-l3-ipbasek9-15.5.1m.gbin', expected: 'i86bi-linux-l3-ipbasek9-15.5.1m.gbin' },
    ])('should return correct URL for image $filename', ({ filename, expected }) => {
      const result = service.getImagePath(mockController, filename);

      expect(result).toContain('http://');
      expect(result).toContain('localhost:3080');
      expect(result).toContain(expected);
    });

    it.each([
      { protocol: 'http:' as const, host: 'localhost', port: 3080 },
      { protocol: 'https:' as const, host: '192.168.1.1', port: 443 },
      { protocol: 'http:' as const, host: 'example.com', port: 8080 },
    ])('should handle different controller configurations', ({ protocol, host, port }) => {
      const controller = { ...mockController, protocol, host, port } as Controller;
      const result = service.getImagePath(controller, 'test.bin');

      expect(result).toContain(`${protocol}//${host}:${port}`);
      expect(result).toContain('/3.0.0/');
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

    it('should return Observable of IosTemplate array', async () => {
      const mockTemplates: IosTemplate[] = [{ name: 'IOS Router', template_id: 'ios-1' } as IosTemplate];
      mockHttpController.get.mockReturnValue(of(mockTemplates));

      const templates = await firstValueFrom(service.getTemplates(mockController));

      expect(templates).toEqual(mockTemplates);
    });

    it('should propagate error when httpController.get fails', async () => {
      const error = new Error('Server error');
      mockHttpController.get.mockReturnValue(throwError(() => error));

      await expect(firstValueFrom(service.getTemplates(mockController))).rejects.toThrow('Server error');
    });
  });

  describe('getTemplate', () => {
    it('should call httpController.get with template_id', () => {
      mockHttpController.get.mockReturnValue(of({}));

      service.getTemplate(mockController, 'ios-1');

      expect(mockHttpController.get).toHaveBeenCalledWith(mockController, '/templates/ios-1');
    });

    it('should return Observable of IosTemplate', async () => {
      const mockTemplate: IosTemplate = { name: 'IOS Router', template_id: 'ios-1' } as IosTemplate;
      mockHttpController.get.mockReturnValue(of(mockTemplate));

      const template = await firstValueFrom(service.getTemplate(mockController, 'ios-1'));

      expect(template).toEqual(mockTemplate);
    });

    it('should propagate error when httpController.get fails', async () => {
      const error = new Error('Not found');
      mockHttpController.get.mockReturnValue(throwError(() => error));

      await expect(firstValueFrom(service.getTemplate(mockController, 'ios-999'))).rejects.toThrow('Not found');
    });
  });

  describe('addTemplate', () => {
    it('should call httpController.post with template', () => {
      const template: IosTemplate = { name: 'New IOS' } as IosTemplate;
      mockHttpController.post.mockReturnValue(of(template));

      service.addTemplate(mockController, template);

      expect(mockHttpController.post).toHaveBeenCalledWith(mockController, '/templates', template);
    });

    it('should return Observable of created IosTemplate', async () => {
      const template: IosTemplate = { name: 'New IOS', template_id: 'ios-new' } as IosTemplate;
      mockHttpController.post.mockReturnValue(of(template));

      const result = await firstValueFrom(service.addTemplate(mockController, template));

      expect(result).toEqual(template);
    });

    it('should propagate error when httpController.post fails', async () => {
      const error = new Error('Conflict');
      const template: IosTemplate = { name: 'Duplicate' } as IosTemplate;
      mockHttpController.post.mockReturnValue(throwError(() => error));

      await expect(firstValueFrom(service.addTemplate(mockController, template))).rejects.toThrow('Conflict');
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

    it('should return Observable of updated IosTemplate', async () => {
      const template: IosTemplate = { template_id: 'ios-1', name: 'Updated' } as IosTemplate;
      mockHttpController.put.mockReturnValue(of(template));

      const result = await firstValueFrom(service.saveTemplate(mockController, template));

      expect(result).toEqual(template);
    });

    it('should propagate error when httpController.put fails', async () => {
      const error = new Error('Validation error');
      const template: IosTemplate = { template_id: 'ios-1', name: 'Bad' } as IosTemplate;
      mockHttpController.put.mockReturnValue(throwError(() => error));

      await expect(firstValueFrom(service.saveTemplate(mockController, template))).rejects.toThrow('Validation error');
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

    it('should return Observable with idle PC value', async () => {
      mockHttpController.post.mockReturnValue(of('0x5678'));

      const result = await firstValueFrom(service.findIdlePC(mockController, { path: '/path/to/image' }));

      expect(result).toBe('0x5678');
    });

    it('should propagate error when httpController.post fails', async () => {
      const error = new Error('Dynamips error');
      mockHttpController.post.mockReturnValue(throwError(() => error));

      await expect(firstValueFrom(service.findIdlePC(mockController, { path: '/path/to/image' }))).rejects.toThrow(
        'Dynamips error'
      );
    });

    it('should handle empty body', () => {
      mockHttpController.post.mockReturnValue(of('0x0000'));

      service.findIdlePC(mockController, {});

      expect(mockHttpController.post).toHaveBeenCalledWith(
        mockController,
        '/computes/local/dynamips/auto_idlepc',
        {}
      );
    });
  });
});
