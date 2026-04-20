import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TemplateService } from './template.service';
import { HttpController } from './http-controller.service';
import { Observable, of, Subject, throwError } from 'rxjs';
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

      let receivedTemplates: Template[] = [];
      service.list(mockController).subscribe((templates) => {
        receivedTemplates = templates;
      });

      expect(receivedTemplates).toEqual([]);
    });

    it('should return all templates including builtin and custom', () => {
      const mockTemplates: Template[] = [
        { template_id: 'tmpl-1', name: 'Router', builtin: true } as Template,
        { template_id: 'tmpl-2', name: 'Switch', builtin: true } as Template,
        { template_id: 'tmpl-3', name: 'Custom VM', builtin: false } as Template,
      ];

      mockHttpController.get.mockReturnValue(of(mockTemplates));

      let receivedTemplates: Template[] = [];
      service.list(mockController).subscribe((templates) => {
        receivedTemplates = templates;
      });

      expect(receivedTemplates).toHaveLength(3);
      expect(receivedTemplates).toEqual(mockTemplates);
    });

    it('should emit error when httpController.get fails', () => {
      const error = new Error('Network error');
      mockHttpController.get.mockReturnValue(throwError(() => error));

      let receivedError: Error | undefined;
      let receivedTemplates: Template[] = [];

      service.list(mockController).subscribe({
        next: (templates) => (receivedTemplates = templates),
        error: (err) => (receivedError = err),
      });

      expect(receivedError).toBe(error);
      expect(receivedTemplates).toEqual([]);
    });

    it('should emit error with specific status code', () => {
      const error = new Error('Not Found');
      (error as any).status = 404;
      mockHttpController.get.mockReturnValue(throwError(() => error));

      let receivedError: Error | undefined;
      service.list(mockController).subscribe({
        error: (err) => (receivedError = err),
      });

      expect(receivedError).toBe(error);
    });
  });

  describe('deleteTemplate', () => {
    it('should call httpController.delete with correct endpoint', () => {
      mockHttpController.delete.mockReturnValue(of({}));

      service.deleteTemplate(mockController, 'tmpl-123');

      expect(mockHttpController.delete).toHaveBeenCalledWith(mockController, '/templates/tmpl-123', {
        observe: 'body',
      });
    });

    it('should return Observable', () => {
      mockHttpController.delete.mockReturnValue(of({}));

      const result = service.deleteTemplate(mockController, 'tmpl-123');

      expect(result).toBeInstanceOf(Observable);
    });

    it('should include templateId in URL', () => {
      mockHttpController.delete.mockReturnValue(of({}));

      service.deleteTemplate(mockController, 'template-to-delete');

      expect(mockHttpController.delete).toHaveBeenCalledWith(mockController, '/templates/template-to-delete', {
        observe: 'body',
      });
    });

    it('should pass observe: body option', () => {
      mockHttpController.delete.mockReturnValue(of({}));

      service.deleteTemplate(mockController, 'tmpl-456');

      const deleteCall = mockHttpController.delete.mock.calls[0];
      expect(deleteCall[2]).toEqual({ observe: 'body' });
    });

    it('should emit deleted template on success', () => {
      const deletedResponse = { success: true };
      mockHttpController.delete.mockReturnValue(of(deletedResponse));

      let receivedResponse: any;
      service.deleteTemplate(mockController, 'tmpl-123').subscribe({
        next: (response) => (receivedResponse = response),
      });

      expect(receivedResponse).toEqual(deletedResponse);
    });

    it('should emit error when httpController.delete fails', () => {
      const error = new Error('Delete failed');
      mockHttpController.delete.mockReturnValue(throwError(() => error));

      let receivedError: Error | undefined;
      service.deleteTemplate(mockController, 'tmpl-123').subscribe({
        error: (err) => (receivedError = err),
      });

      expect(receivedError).toBe(error);
    });

    it('should emit error when template not found', () => {
      const error = new Error('Template not found');
      (error as any).status = 404;
      mockHttpController.delete.mockReturnValue(throwError(() => error));

      let receivedError: Error | undefined;
      service.deleteTemplate(mockController, 'non-existent').subscribe({
        error: (err) => (receivedError = err),
      });

      expect(receivedError).toBe(error);
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

    it('should emit to all subscribers independently', () => {
      let template1: Template | undefined;
      let template2: Template | undefined;

      service.newTemplateCreated.subscribe((t) => (template1 = t));
      service.newTemplateCreated.subscribe((t) => (template2 = t));

      const newTemplate: Template = { template_id: 'tmpl-x', name: 'X' } as Template;
      service.newTemplateCreated.next(newTemplate);

      expect(template1).toEqual(newTemplate);
      expect(template2).toEqual(newTemplate);
      expect(template1).toBe(template2);
    });

    it('should not emit after unsubscribe', () => {
      let count = 0;
      const subscription = service.newTemplateCreated.subscribe(() => count++);

      const newTemplate: Template = { template_id: 'tmpl-1', name: 'T' } as Template;
      service.newTemplateCreated.next(newTemplate);
      expect(count).toBe(1);

      subscription.unsubscribe();
      service.newTemplateCreated.next(newTemplate);
      expect(count).toBe(1);
    });

    it('should complete when complete is called', () => {
      let isCompleted = false;

      service.newTemplateCreated.subscribe({
        complete: () => (isCompleted = true),
      });

      service.newTemplateCreated.complete();
      expect(isCompleted).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle template ID with various characters in URL', () => {
      mockHttpController.delete.mockReturnValue(of({}));

      const templateId = 'tmpl_with-underscore-and-dash';
      service.deleteTemplate(mockController, templateId);

      expect(mockHttpController.delete).toHaveBeenCalledWith(mockController, `/templates/${templateId}`, {
        observe: 'body',
      });
    });

    it('should handle very long template ID', () => {
      mockHttpController.delete.mockReturnValue(of({}));

      const longId = 't'.repeat(100);
      service.deleteTemplate(mockController, longId);

      expect(mockHttpController.delete).toHaveBeenCalledWith(mockController, `/templates/${longId}`, {
        observe: 'body',
      });
    });
  });
});
