import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TemplateService } from './template.service';
import { HttpController } from './http-controller.service';
import { Observable, of, Subject } from 'rxjs';
import { Controller } from '@models/controller';
import { Template } from '@models/template';

describe('TemplateService', () => {
  let service: TemplateService;
  let mockHttpController: any;
  let mockController: Controller;

  beforeEach(() => {
    // Mock HttpController
    mockHttpController = {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
    };

    // Mock Controller
    mockController = {
      id: 1,
      authToken: '',
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

    service = new TemplateService(mockHttpController);
  });

  describe('Service Creation', () => {
    it('should create the service', () => {
      expect(service).toBeTruthy();
    });

    it('should be instance of TemplateService', () => {
      expect(service).toBeInstanceOf(TemplateService);
    });

    it('should have newTemplateCreated Subject defined', () => {
      expect(service.newTemplateCreated).toBeDefined();
      expect(service.newTemplateCreated).toBeInstanceOf(Subject);
    });
  });

  describe('list', () => {
    it('should call httpController.get with correct endpoint', () => {
      const mockTemplates: Template[] = [
        { template_id: 'tmpl-1', name: 'Template 1', builtin: true } as Template,
        { template_id: 'tmpl-2', name: 'Template 2', builtin: false } as Template,
      ];

      mockHttpController.get.mockReturnValue(of(mockTemplates));

      service.list(mockController);

      expect(mockHttpController.get).toHaveBeenCalledWith(mockController, '/templates');
    });

    it('should return Observable of Template array', () => {
      const mockTemplates: Template[] = [];
      mockHttpController.get.mockReturnValue(of(mockTemplates));

      const result = service.list(mockController);

      expect(result).toBeInstanceOf(Observable);
    });

    it('should handle empty template list', () => {
      mockHttpController.get.mockReturnValue(of([]));

      const result = service.list(mockController);

      expect(result).toBeInstanceOf(Observable);
    });

    it('should return all templates including builtin and custom', () => {
      const mockTemplates: Template[] = [
        { template_id: 'tmpl-1', name: 'Router', builtin: true } as Template,
        { template_id: 'tmpl-2', name: 'Switch', builtin: true } as Template,
        { template_id: 'tmpl-3', name: 'Custom VM', builtin: false } as Template,
      ];

      mockHttpController.get.mockReturnValue(of(mockTemplates));

      let receivedTemplates: Template[] | undefined;
      service.list(mockController).subscribe((templates) => {
        receivedTemplates = templates;
      });

      expect(receivedTemplates).toHaveLength(3);
    });
  });

  describe('deleteTemplate', () => {
    it('should call httpController.delete with correct endpoint', () => {
      mockHttpController.delete.mockReturnValue(of({}));

      service.deleteTemplate(mockController, 'tmpl-123');

      expect(mockHttpController.delete).toHaveBeenCalledWith(
        mockController,
        '/templates/tmpl-123',
        { observe: 'body' }
      );
    });

    it('should return Observable', () => {
      mockHttpController.delete.mockReturnValue(of({}));

      const result = service.deleteTemplate(mockController, 'tmpl-123');

      expect(result).toBeInstanceOf(Observable);
    });

    it('should include templateId in URL', () => {
      mockHttpController.delete.mockReturnValue(of({}));

      service.deleteTemplate(mockController, 'template-to-delete');

      expect(mockHttpController.delete).toHaveBeenCalledWith(
        mockController,
        '/templates/template-to-delete',
        { observe: 'body' }
      );
    });

    it('should pass observe: body option', () => {
      mockHttpController.delete.mockReturnValue(of({}));

      service.deleteTemplate(mockController, 'tmpl-456');

      const deleteCall = mockHttpController.delete.mock.calls[0];
      expect(deleteCall[2]).toEqual({ observe: 'body' });
    });
  });

  describe('newTemplateCreated Subject', () => {
    it('should emit event when next is called', () => {
      let receivedTemplate: Template | undefined;

      service.newTemplateCreated.subscribe((template) => {
        receivedTemplate = template;
      });

      const newTemplate: Template = {
        template_id: 'tmpl-new',
        name: 'New Template',
        builtin: false,
      } as Template;

      service.newTemplateCreated.next(newTemplate);

      expect(receivedTemplate).toEqual(newTemplate);
    });

    it('should allow multiple subscribers', () => {
      let count = 0;

      service.newTemplateCreated.subscribe(() => count++);
      service.newTemplateCreated.subscribe(() => count++);

      const newTemplate: Template = { template_id: 'tmpl-1', name: 'T' } as Template;
      service.newTemplateCreated.next(newTemplate);

      expect(count).toBe(2);
    });
  });

  describe('Edge Cases', () => {
    it('should handle template ID with special characters', () => {
      mockHttpController.delete.mockReturnValue(of({}));

      service.deleteTemplate(mockController, 'tmpl-with-dash');

      expect(mockHttpController.delete).toHaveBeenCalledWith(
        mockController,
        '/templates/tmpl-with-dash',
        { observe: 'body' }
      );
    });

    it('should handle template ID with underscores', () => {
      mockHttpController.delete.mockReturnValue(of({}));

      service.deleteTemplate(mockController, 'tmpl_with_underscore');

      expect(mockHttpController.delete).toHaveBeenCalledWith(
        mockController,
        '/templates/tmpl_with_underscore',
        { observe: 'body' }
      );
    });

    it('should handle very long template ID', () => {
      mockHttpController.delete.mockReturnValue(of({}));

      const longId = 't'.repeat(100);
      service.deleteTemplate(mockController, longId);

      expect(mockHttpController.delete).toHaveBeenCalledWith(
        mockController,
        `/templates/${longId}`,
        { observe: 'body' }
      );
    });
  });
});
