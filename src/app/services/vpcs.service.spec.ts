import { describe, it, expect, beforeEach, vi } from 'vitest';
import { VpcsService } from './vpcs.service';
import { HttpController } from './http-controller.service';
import { Observable, of, throwError } from 'rxjs';
import { Controller } from '@models/controller';
import { VpcsTemplate } from '@models/templates/vpcs-template';

describe('VpcsService', () => {
  let service: VpcsService;
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

    service = new VpcsService(mockHttpController);
  });

  describe('Service Creation', () => {
    it('should create the service', () => {
      expect(service).toBeTruthy();
    });

    it('should be instance of VpcsService', () => {
      expect(service).toBeInstanceOf(VpcsService);
    });
  });

  describe('getTemplates', () => {
    it('should call httpController.get with correct endpoint', () => {
      const mockTemplates: VpcsTemplate[] = [];
      mockHttpController.get.mockReturnValue(of(mockTemplates));

      service.getTemplates(mockController);

      expect(mockHttpController.get).toHaveBeenCalledWith(mockController, '/templates');
    });

    it('should return Observable that emits VpcsTemplate array', async () => {
      const mockTemplates: VpcsTemplate[] = [
        { template_id: 'vpcs-1', name: 'VPCS 1' } as VpcsTemplate,
        { template_id: 'vpcs-2', name: 'VPCS 2' } as VpcsTemplate,
      ];
      mockHttpController.get.mockReturnValue(of(mockTemplates));

      const templates = await new Promise<VpcsTemplate[]>((resolve) => {
        service.getTemplates(mockController).subscribe((t) => resolve(t));
      });
      expect(templates).toEqual(mockTemplates);
    });

    it('should return Observable that emits empty array when no templates', async () => {
      mockHttpController.get.mockReturnValue(of([]));

      const templates = await new Promise<VpcsTemplate[]>((resolve) => {
        service.getTemplates(mockController).subscribe((t) => resolve(t));
      });
      expect(templates).toEqual([]);
    });

    it('should return Observable that emits error when httpController.get fails', () => {
      const error = new Error('Network error');
      mockHttpController.get.mockReturnValue(throwError(() => error));

      service.getTemplates(mockController).subscribe({
        error: (err) => {
          expect(err).toBe(error);
        },
      });
    });
  });

  describe('getTemplate', () => {
    it('should call httpController.get with template_id in endpoint', () => {
      const mockTemplate: VpcsTemplate = { template_id: 'vpcs-1' } as VpcsTemplate;
      mockHttpController.get.mockReturnValue(of(mockTemplate));

      service.getTemplate(mockController, 'vpcs-1');

      expect(mockHttpController.get).toHaveBeenCalledWith(mockController, '/templates/vpcs-1');
    });

    it('should return Observable that emits the template', async () => {
      const mockTemplate: VpcsTemplate = { template_id: 'vpcs-1', name: 'VPCS 1' } as VpcsTemplate;
      mockHttpController.get.mockReturnValue(of(mockTemplate));

      const template = await new Promise<VpcsTemplate>((resolve) => {
        service.getTemplate(mockController, 'vpcs-1').subscribe((t) => resolve(t));
      });
      expect(template).toEqual(mockTemplate);
    });

    it('should return Observable that emits error when httpController.get fails', () => {
      const error = new Error('Not found');
      mockHttpController.get.mockReturnValue(throwError(() => error));

      service.getTemplate(mockController, 'vpcs-1').subscribe({
        error: (err) => {
          expect(err).toBe(error);
        },
      });
    });
  });

  describe('addTemplate', () => {
    it('should call httpController.post with correct endpoint', () => {
      const mockTemplate: VpcsTemplate = { name: 'New VPCS' } as VpcsTemplate;
      mockHttpController.post.mockReturnValue(of(mockTemplate));

      service.addTemplate(mockController, mockTemplate);

      expect(mockHttpController.post).toHaveBeenCalledWith(mockController, '/templates', mockTemplate);
    });

    it('should return Observable that emits the created template', async () => {
      const mockTemplate: VpcsTemplate = { template_id: 'vpcs-new', name: 'New VPCS' } as VpcsTemplate;
      mockHttpController.post.mockReturnValue(of(mockTemplate));

      const template = await new Promise<VpcsTemplate>((resolve) => {
        service.addTemplate(mockController, mockTemplate).subscribe((t) => resolve(t));
      });
      expect(template).toEqual(mockTemplate);
    });

    it('should return Observable that emits error when httpController.post fails', () => {
      const error = new Error('Creation failed');
      mockHttpController.post.mockReturnValue(throwError(() => error));

      service.addTemplate(mockController, { name: 'New VPCS' } as VpcsTemplate).subscribe({
        error: (err) => {
          expect(err).toBe(error);
        },
      });
    });
  });

  describe('saveTemplate', () => {
    it('should call httpController.put with template_id in endpoint', () => {
      const mockTemplate: VpcsTemplate = { template_id: 'vpcs-1', name: 'Updated VPCS' } as VpcsTemplate;
      mockHttpController.put.mockReturnValue(of(mockTemplate));

      service.saveTemplate(mockController, mockTemplate);

      expect(mockHttpController.put).toHaveBeenCalledWith(mockController, '/templates/vpcs-1', mockTemplate);
    });

    it('should return Observable that emits the updated template', async () => {
      const mockTemplate: VpcsTemplate = { template_id: 'vpcs-1', name: 'Updated VPCS' } as VpcsTemplate;
      mockHttpController.put.mockReturnValue(of(mockTemplate));

      const template = await new Promise<VpcsTemplate>((resolve) => {
        service.saveTemplate(mockController, mockTemplate).subscribe((t) => resolve(t));
      });
      expect(template).toEqual(mockTemplate);
    });

    it('should return Observable that emits error when httpController.put fails', () => {
      const error = new Error('Update failed');
      mockHttpController.put.mockReturnValue(throwError(() => error));

      service.saveTemplate(mockController, { template_id: 'vpcs-1', name: 'Updated' } as VpcsTemplate).subscribe({
        error: (err) => {
          expect(err).toBe(error);
        },
      });
    });
  });
});
