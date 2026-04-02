import { describe, it, expect, beforeEach, vi } from 'vitest';
import { VirtualBoxService } from './virtual-box.service';
import { HttpController } from './http-controller.service';
import { Observable, of } from 'rxjs';
import { Controller } from '@models/controller';
import { VirtualBoxTemplate } from '@models/templates/virtualbox-template';

vi.mock('environments/environment', () => ({
  environment: {
    current_version: '3.0.0',
    compute_id: 'local',
  },
}));

describe('VirtualBoxService', () => {
  let service: VirtualBoxService;
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

    service = new VirtualBoxService(mockHttpController);
  });

  describe('Service Creation', () => {
    it('should create the service', () => {
      expect(service).toBeTruthy();
    });

    it('should be instance of VirtualBoxService', () => {
      expect(service).toBeInstanceOf(VirtualBoxService);
    });
  });

  describe('getTemplates', () => {
    it('should call httpController.get with templates endpoint', () => {
      mockHttpController.get.mockReturnValue(of([]));

      service.getTemplates(mockController);

      expect(mockHttpController.get).toHaveBeenCalledWith(mockController, '/templates');
    });

    it('should return Observable of VirtualBoxTemplate array', () => {
      mockHttpController.get.mockReturnValue(of([]));

      const result = service.getTemplates(mockController);

      expect(result).toBeInstanceOf(Observable);
    });
  });

  describe('getTemplate', () => {
    it('should call httpController.get with template_id', () => {
      mockHttpController.get.mockReturnValue(of({}));

      service.getTemplate(mockController, 'vb-1');

      expect(mockHttpController.get).toHaveBeenCalledWith(mockController, '/templates/vb-1');
    });

    it('should return Observable', () => {
      mockHttpController.get.mockReturnValue(of({}));

      const result = service.getTemplate(mockController, 'vb-1');

      expect(result).toBeInstanceOf(Observable);
    });
  });

  describe('addTemplate', () => {
    it('should call httpController.post with template', () => {
      const template: VirtualBoxTemplate = { name: 'New VB' } as VirtualBoxTemplate;
      mockHttpController.post.mockReturnValue(of(template));

      service.addTemplate(mockController, template);

      expect(mockHttpController.post).toHaveBeenCalledWith(mockController, '/templates', template);
    });

    it('should return Observable', () => {
      const template: VirtualBoxTemplate = { name: 'New VB' } as VirtualBoxTemplate;
      mockHttpController.post.mockReturnValue(of(template));

      const result = service.addTemplate(mockController, template);

      expect(result).toBeInstanceOf(Observable);
    });
  });

  describe('saveTemplate', () => {
    it('should call httpController.put with template_id', () => {
      const template: VirtualBoxTemplate = { template_id: 'vb-1', name: 'Updated' } as VirtualBoxTemplate;
      mockHttpController.put.mockReturnValue(of(template));

      service.saveTemplate(mockController, template);

      expect(mockHttpController.put).toHaveBeenCalledWith(
        mockController,
        '/templates/vb-1',
        template
      );
    });

    it('should return Observable', () => {
      const template: VirtualBoxTemplate = { template_id: 'vb-1', name: 'Updated' } as VirtualBoxTemplate;
      mockHttpController.put.mockReturnValue(of(template));

      const result = service.saveTemplate(mockController, template);

      expect(result).toBeInstanceOf(Observable);
    });
  });

  describe('getVirtualMachines', () => {
    it('should call httpController.get with virtualbox vms endpoint', () => {
      mockHttpController.get.mockReturnValue(of([]));

      service.getVirtualMachines(mockController);

      expect(mockHttpController.get).toHaveBeenCalledWith(
        mockController,
        '/computes/local/virtualbox/vms'
      );
    });

    it('should return Observable', () => {
      mockHttpController.get.mockReturnValue(of([]));

      const result = service.getVirtualMachines(mockController);

      expect(result).toBeInstanceOf(Observable);
    });
  });
});
