import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DockerService } from './docker.service';
import { HttpController } from './http-controller.service';
import { Observable, of } from 'rxjs';
import { Controller } from '@models/controller';
import { DockerTemplate } from '@models/templates/docker-template';

vi.mock('environments/environment', () => ({
  environment: {
    current_version: '3.0.0',
    compute_id: 'local',
  },
}));

describe('DockerService', () => {
  let service: DockerService;
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

    service = new DockerService(mockHttpController);
  });

  describe('Service Creation', () => {
    it('should create the service', () => {
      expect(service).toBeTruthy();
    });

    it('should be instance of DockerService', () => {
      expect(service).toBeInstanceOf(DockerService);
    });
  });

  describe('getTemplates', () => {
    it('should call httpController.get with templates endpoint', () => {
      mockHttpController.get.mockReturnValue(of([]));

      service.getTemplates(mockController);

      expect(mockHttpController.get).toHaveBeenCalledWith(mockController, '/templates');
    });

    it('should return Observable of DockerTemplate array', () => {
      mockHttpController.get.mockReturnValue(of([]));

      const result = service.getTemplates(mockController);

      expect(result).toBeInstanceOf(Observable);
    });
  });

  describe('getTemplate', () => {
    it('should call httpController.get with template_id', () => {
      mockHttpController.get.mockReturnValue(of({}));

      service.getTemplate(mockController, 'docker-1');

      expect(mockHttpController.get).toHaveBeenCalledWith(mockController, '/templates/docker-1');
    });

    it('should return Observable', () => {
      mockHttpController.get.mockReturnValue(of({}));

      const result = service.getTemplate(mockController, 'docker-1');

      expect(result).toBeInstanceOf(Observable);
    });
  });

  describe('getImages', () => {
    it('should call httpController.get with docker images endpoint', () => {
      mockHttpController.get.mockReturnValue(of([]));

      service.getImages(mockController);

      expect(mockHttpController.get).toHaveBeenCalledWith(
        mockController,
        '/computes/local/docker/images'
      );
    });

    it('should return Observable of DockerImage array', () => {
      mockHttpController.get.mockReturnValue(of([]));

      const result = service.getImages(mockController);

      expect(result).toBeInstanceOf(Observable);
    });
  });

  describe('addTemplate', () => {
    it('should call httpController.post with template', () => {
      const template: DockerTemplate = { name: 'New Docker' } as DockerTemplate;
      mockHttpController.post.mockReturnValue(of(template));

      service.addTemplate(mockController, template);

      expect(mockHttpController.post).toHaveBeenCalledWith(mockController, '/templates', template);
    });

    it('should return Observable', () => {
      const template: DockerTemplate = { name: 'New Docker' } as DockerTemplate;
      mockHttpController.post.mockReturnValue(of(template));

      const result = service.addTemplate(mockController, template);

      expect(result).toBeInstanceOf(Observable);
    });
  });

  describe('saveTemplate', () => {
    it('should call httpController.put with template_id', () => {
      const template: DockerTemplate = { template_id: 'docker-1', name: 'Updated' } as DockerTemplate;
      mockHttpController.put.mockReturnValue(of(template));

      service.saveTemplate(mockController, template);

      expect(mockHttpController.put).toHaveBeenCalledWith(
        mockController,
        '/templates/docker-1',
        template
      );
    });

    it('should return Observable', () => {
      const template: DockerTemplate = { template_id: 'docker-1', name: 'Updated' } as DockerTemplate;
      mockHttpController.put.mockReturnValue(of(template));

      const result = service.saveTemplate(mockController, template);

      expect(result).toBeInstanceOf(Observable);
    });
  });
});
