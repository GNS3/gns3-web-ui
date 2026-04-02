import { describe, it, expect, beforeEach, vi } from 'vitest';
import { VpcsService } from './vpcs.service';
import { HttpController } from './http-controller.service';
import { Observable, of } from 'rxjs';
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

    it('should return Observable of VpcsTemplate array', () => {
      mockHttpController.get.mockReturnValue(of([]));

      const result = service.getTemplates(mockController);

      expect(result).toBeInstanceOf(Observable);
    });
  });

  describe('getTemplate', () => {
    it('should call httpController.get with template_id in endpoint', () => {
      const mockTemplate: VpcsTemplate = { template_id: 'vpcs-1' } as VpcsTemplate;
      mockHttpController.get.mockReturnValue(of(mockTemplate));

      service.getTemplate(mockController, 'vpcs-1');

      expect(mockHttpController.get).toHaveBeenCalledWith(mockController, '/templates/vpcs-1');
    });

    it('should return Observable of VpcsTemplate', () => {
      const mockTemplate: VpcsTemplate = { template_id: 'vpcs-1' } as VpcsTemplate;
      mockHttpController.get.mockReturnValue(of(mockTemplate));

      const result = service.getTemplate(mockController, 'vpcs-1');

      expect(result).toBeInstanceOf(Observable);
    });
  });

  describe('addTemplate', () => {
    it('should call httpController.post with correct endpoint', () => {
      const mockTemplate: VpcsTemplate = { name: 'New VPCS' } as VpcsTemplate;
      mockHttpController.post.mockReturnValue(of(mockTemplate));

      service.addTemplate(mockController, mockTemplate);

      expect(mockHttpController.post).toHaveBeenCalledWith(mockController, '/templates', mockTemplate);
    });

    it('should return Observable of VpcsTemplate', () => {
      const mockTemplate: VpcsTemplate = { name: 'New VPCS' } as VpcsTemplate;
      mockHttpController.post.mockReturnValue(of(mockTemplate));

      const result = service.addTemplate(mockController, mockTemplate);

      expect(result).toBeInstanceOf(Observable);
    });
  });

  describe('saveTemplate', () => {
    it('should call httpController.put with template_id in endpoint', () => {
      const mockTemplate: VpcsTemplate = { template_id: 'vpcs-1', name: 'Updated VPCS' } as VpcsTemplate;
      mockHttpController.put.mockReturnValue(of(mockTemplate));

      service.saveTemplate(mockController, mockTemplate);

      expect(mockHttpController.put).toHaveBeenCalledWith(
        mockController,
        '/templates/vpcs-1',
        mockTemplate
      );
    });

    it('should return Observable of VpcsTemplate', () => {
      const mockTemplate: VpcsTemplate = { template_id: 'vpcs-1', name: 'Updated VPCS' } as VpcsTemplate;
      mockHttpController.put.mockReturnValue(of(mockTemplate));

      const result = service.saveTemplate(mockController, mockTemplate);

      expect(result).toBeInstanceOf(Observable);
    });
  });
});
