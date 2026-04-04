import { describe, it, expect, beforeEach, vi } from 'vitest';
import { firstValueFrom, of, throwError } from 'rxjs';
import { VirtualBoxService } from './virtual-box.service';
import { HttpController } from './http-controller.service';
import { Controller } from '@models/controller';
import { VirtualBoxTemplate } from '@models/templates/virtualbox-template';
import { VirtualBoxVm } from '@models/virtualBox/virtual-box-vm';

vi.mock('environments/environment', () => ({
  environment: {
    current_version: '3.0.0',
    compute_id: 'local',
  },
}));

describe('VirtualBoxService', () => {
  let service: VirtualBoxService;
  let mockHttpController: any;

  const mockController: Controller = {
    id: 1,
    name: 'Test Controller',
    location: 'local',
    host: 'localhost',
    port: 3080,
    protocol: 'http:',
    status: 'running',
  } as Controller;

  beforeEach(() => {
    mockHttpController = {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
    };

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
    it('should call httpController.get with correct endpoint', async () => {
      const mockTemplates = [{ name: 'VB1' }, { name: 'VB2' }] as VirtualBoxTemplate[];
      mockHttpController.get.mockReturnValue(of(mockTemplates));

      await firstValueFrom(service.getTemplates(mockController));

      expect(mockHttpController.get).toHaveBeenCalledWith(mockController, '/templates');
    });

    it('should return VirtualBoxTemplate array', async () => {
      const mockTemplates = [{ name: 'VB1', template_id: '1' }] as VirtualBoxTemplate[];
      mockHttpController.get.mockReturnValue(of(mockTemplates));

      const result = await firstValueFrom(service.getTemplates(mockController));

      expect(result).toEqual(mockTemplates);
    });

    it('should return empty array when no templates exist', async () => {
      mockHttpController.get.mockReturnValue(of([]));

      const result = await firstValueFrom(service.getTemplates(mockController));

      expect(result).toEqual([]);
    });

    it('should propagate error when getTemplates fails', async () => {
      const error = new Error('Server error');
      mockHttpController.get.mockReturnValue(throwError(() => error));

      await expect(firstValueFrom(service.getTemplates(mockController))).rejects.toThrow('Server error');
    });
  });

  describe('getTemplate', () => {
    it('should call httpController.get with correct template_id endpoint', async () => {
      const templateId = 'vb-123';
      const mockTemplate = { name: 'VB Template', template_id: templateId } as VirtualBoxTemplate;
      mockHttpController.get.mockReturnValue(of(mockTemplate));

      await firstValueFrom(service.getTemplate(mockController, templateId));

      expect(mockHttpController.get).toHaveBeenCalledWith(mockController, `/templates/${templateId}`);
    });

    it('should return VirtualBoxTemplate', async () => {
      const mockTemplate = { name: 'VB Template', template_id: 'vb-1' } as VirtualBoxTemplate;
      mockHttpController.get.mockReturnValue(of(mockTemplate));

      const result = await firstValueFrom(service.getTemplate(mockController, 'vb-1'));

      expect(result).toEqual(mockTemplate);
    });

    it('should propagate error when getTemplate fails', async () => {
      const error = new Error('Not found');
      mockHttpController.get.mockReturnValue(throwError(() => error));

      await expect(firstValueFrom(service.getTemplate(mockController, 'vb-999'))).rejects.toThrow('Not found');
    });
  });

  describe('addTemplate', () => {
    it('should call httpController.post with correct endpoint and template', async () => {
      const inputTemplate = { name: 'New VB' } as VirtualBoxTemplate;
      const returnedTemplate = { ...inputTemplate, template_id: 'vb-new' } as VirtualBoxTemplate;
      mockHttpController.post.mockReturnValue(of(returnedTemplate));

      await firstValueFrom(service.addTemplate(mockController, inputTemplate));

      expect(mockHttpController.post).toHaveBeenCalledWith(mockController, '/templates', inputTemplate);
    });

    it('should return created VirtualBoxTemplate with template_id', async () => {
      const inputTemplate = { name: 'New VB' } as VirtualBoxTemplate;
      const returnedTemplate = { ...inputTemplate, template_id: 'vb-new' } as VirtualBoxTemplate;
      mockHttpController.post.mockReturnValue(of(returnedTemplate));

      const result = await firstValueFrom(service.addTemplate(mockController, inputTemplate));

      expect(result.template_id).toBe('vb-new');
      expect(result.name).toBe('New VB');
    });

    it('should propagate error when addTemplate fails', async () => {
      const template = { name: 'New VB' } as VirtualBoxTemplate;
      const error = new Error('Conflict');
      mockHttpController.post.mockReturnValue(throwError(() => error));

      await expect(firstValueFrom(service.addTemplate(mockController, template))).rejects.toThrow('Conflict');
    });
  });

  describe('saveTemplate', () => {
    it('should call httpController.put with correct template_id endpoint', async () => {
      const template = { template_id: 'vb-1', name: 'Updated' } as VirtualBoxTemplate;
      mockHttpController.put.mockReturnValue(of(template));

      await firstValueFrom(service.saveTemplate(mockController, template));

      expect(mockHttpController.put).toHaveBeenCalledWith(mockController, '/templates/vb-1', template);
    });

    it('should return updated VirtualBoxTemplate', async () => {
      const template = { template_id: 'vb-1', name: 'Updated Name' } as VirtualBoxTemplate;
      mockHttpController.put.mockReturnValue(of(template));

      const result = await firstValueFrom(service.saveTemplate(mockController, template));

      expect(result.template_id).toBe('vb-1');
      expect(result.name).toBe('Updated Name');
    });

    it('should propagate error when saveTemplate fails', async () => {
      const template = { template_id: 'vb-1', name: 'Updated' } as VirtualBoxTemplate;
      const error = new Error('Internal server error');
      mockHttpController.put.mockReturnValue(throwError(() => error));

      await expect(firstValueFrom(service.saveTemplate(mockController, template))).rejects.toThrow(
        'Internal server error'
      );
    });
  });

  describe('getVirtualMachines', () => {
    it('should call httpController.get with virtualbox vms endpoint', async () => {
      const mockVms = [
        { vmname: 'VM1', ram: 1024 },
        { vmname: 'VM2', ram: 2048 },
      ] as VirtualBoxVm[];
      mockHttpController.get.mockReturnValue(of(mockVms));

      await firstValueFrom(service.getVirtualMachines(mockController));

      expect(mockHttpController.get).toHaveBeenCalledWith(mockController, '/computes/local/virtualbox/vms');
    });

    it('should return VirtualBoxVm array', async () => {
      const mockVms = [
        { vmname: 'VM1', ram: 1024 },
        { vmname: 'VM2', ram: 2048 },
      ] as VirtualBoxVm[];
      mockHttpController.get.mockReturnValue(of(mockVms));

      const result = await firstValueFrom(service.getVirtualMachines(mockController));

      expect(result).toEqual(mockVms);
      expect(result.length).toBe(2);
    });

    it('should return empty array when no VMs exist', async () => {
      mockHttpController.get.mockReturnValue(of([]));

      const result = await firstValueFrom(service.getVirtualMachines(mockController));

      expect(result).toEqual([]);
    });

    it('should propagate error when getVirtualMachines fails', async () => {
      const error = new Error('Compute unavailable');
      mockHttpController.get.mockReturnValue(throwError(() => error));

      await expect(firstValueFrom(service.getVirtualMachines(mockController))).rejects.toThrow('Compute unavailable');
    });
  });
});
