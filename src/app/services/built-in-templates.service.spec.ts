import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BuiltInTemplatesService } from './built-in-templates.service';
import { HttpController } from './http-controller.service';
import { Observable, of } from 'rxjs';
import { Controller } from '@models/controller';

describe('BuiltInTemplatesService', () => {
  let service: BuiltInTemplatesService;
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

    service = new BuiltInTemplatesService(mockHttpController);
  });

  describe('Service Creation', () => {
    it('should create the service', () => {
      expect(service).toBeTruthy();
    });

    it('should be instance of BuiltInTemplatesService', () => {
      expect(service).toBeInstanceOf(BuiltInTemplatesService);
    });
  });

  describe('getTemplates', () => {
    it('should call httpController.get with templates endpoint', () => {
      mockHttpController.get.mockReturnValue(of([]));

      service.getTemplates(mockController);

      expect(mockHttpController.get).toHaveBeenCalledWith(mockController, '/templates');
    });

    it('should return Observable', () => {
      mockHttpController.get.mockReturnValue(of([]));

      const result = service.getTemplates(mockController);

      expect(result).toBeInstanceOf(Observable);
    });
  });

  describe('getTemplate', () => {
    it('should call httpController.get with template_id', () => {
      mockHttpController.get.mockReturnValue(of({}));

      service.getTemplate(mockController, 'builtin-1');

      expect(mockHttpController.get).toHaveBeenCalledWith(mockController, '/templates/builtin-1');
    });

    it('should return Observable', () => {
      mockHttpController.get.mockReturnValue(of({}));

      const result = service.getTemplate(mockController, 'builtin-1');

      expect(result).toBeInstanceOf(Observable);
    });
  });

  describe('addTemplate', () => {
    it('should call httpController.post with template', () => {
      const template = { name: 'New Built-in' };
      mockHttpController.post.mockReturnValue(of(template));

      service.addTemplate(mockController, template);

      expect(mockHttpController.post).toHaveBeenCalledWith(mockController, '/templates', template);
    });

    it('should return Observable', () => {
      const template = { name: 'New Built-in' };
      mockHttpController.post.mockReturnValue(of(template));

      const result = service.addTemplate(mockController, template);

      expect(result).toBeInstanceOf(Observable);
    });
  });

  describe('saveTemplate', () => {
    it('should call httpController.put with template_id', () => {
      const template = { template_id: 'builtin-1', name: 'Updated' };
      mockHttpController.put.mockReturnValue(of(template));

      service.saveTemplate(mockController, template);

      expect(mockHttpController.put).toHaveBeenCalledWith(
        mockController,
        '/templates/builtin-1',
        template
      );
    });

    it('should return Observable', () => {
      const template = { template_id: 'builtin-1', name: 'Updated' };
      mockHttpController.put.mockReturnValue(of(template));

      const result = service.saveTemplate(mockController, template);

      expect(result).toBeInstanceOf(Observable);
    });
  });
});
