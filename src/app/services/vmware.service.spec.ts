import { describe, it, expect, beforeEach, vi } from 'vitest';
import { firstValueFrom, of, throwError } from 'rxjs';
import { VmwareService } from './vmware.service';
import { HttpController } from './http-controller.service';
import { Controller } from '@models/controller';
import { VmwareTemplate } from '@models/templates/vmware-template';
import { VmwareVm } from '@models/vmware/vmware-vm';

vi.mock('environments/environment', () => ({
  environment: {
    current_version: '3.0.0',
    compute_id: 'local',
  },
}));

describe('VmwareService', () => {
  let service: VmwareService;
  let mockHttpController: {
    get: ReturnType<typeof vi.fn>;
    post: ReturnType<typeof vi.fn>;
    put: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };
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

    service = new VmwareService(mockHttpController as unknown as HttpController);
  });

  describe('Service Creation', () => {
    it('should create the service', () => {
      expect(service).toBeTruthy();
    });

    it('should be instance of VmwareService', () => {
      expect(service).toBeInstanceOf(VmwareService);
    });
  });

  describe('getTemplates', () => {
    const mockTemplates: VmwareTemplate[] = [
      { name: 'VMware 1', template_id: 'vm-1' } as VmwareTemplate,
      { name: 'VMware 2', template_id: 'vm-2' } as VmwareTemplate,
    ];

    it('should call httpController.get with templates endpoint', async () => {
      mockHttpController.get.mockReturnValue(of(mockTemplates));

      await firstValueFrom(service.getTemplates(mockController));

      expect(mockHttpController.get).toHaveBeenCalledWith(mockController, '/templates');
    });

    it('should return array of VmwareTemplate', async () => {
      mockHttpController.get.mockReturnValue(of(mockTemplates));

      const result = await firstValueFrom(service.getTemplates(mockController));

      expect(result).toEqual(mockTemplates);
    });

    it('should return empty array when no templates exist', async () => {
      mockHttpController.get.mockReturnValue(of([]));

      const result = await firstValueFrom(service.getTemplates(mockController));

      expect(result).toEqual([]);
    });

    it('should propagate error when API fails', async () => {
      const error = new Error('Server error');
      mockHttpController.get.mockReturnValue(throwError(() => error));

      await expect(firstValueFrom(service.getTemplates(mockController))).rejects.toThrow('Server error');
    });
  });

  describe('getTemplate', () => {
    const templateId = 'vmware-1';
    const mockTemplate: VmwareTemplate = { name: 'Test VM', template_id: templateId } as VmwareTemplate;

    it('should call httpController.get with template_id', async () => {
      mockHttpController.get.mockReturnValue(of(mockTemplate));

      await firstValueFrom(service.getTemplate(mockController, templateId));

      expect(mockHttpController.get).toHaveBeenCalledWith(mockController, `/templates/${templateId}`);
    });

    it('should return VmwareTemplate', async () => {
      mockHttpController.get.mockReturnValue(of(mockTemplate));

      const result = await firstValueFrom(service.getTemplate(mockController, templateId));

      expect(result).toEqual(mockTemplate);
    });

    it('should propagate error when template not found', async () => {
      const error = new Error('Not found');
      mockHttpController.get.mockReturnValue(throwError(() => error));

      await expect(firstValueFrom(service.getTemplate(mockController, templateId))).rejects.toThrow('Not found');
    });
  });

  describe('addTemplate', () => {
    const newTemplate: VmwareTemplate = { name: 'New VMware' } as VmwareTemplate;
    const createdTemplate: VmwareTemplate = { name: 'New VMware', template_id: 'vm-2' } as VmwareTemplate;

    it('should call httpController.post with template', async () => {
      mockHttpController.post.mockReturnValue(of(createdTemplate));

      await firstValueFrom(service.addTemplate(mockController, newTemplate));

      expect(mockHttpController.post).toHaveBeenCalledWith(mockController, '/templates', newTemplate);
    });

    it('should return created VmwareTemplate with id', async () => {
      mockHttpController.post.mockReturnValue(of(createdTemplate));

      const result = await firstValueFrom(service.addTemplate(mockController, newTemplate));

      expect(result).toEqual(createdTemplate);
    });

    it('should propagate error when creation fails', async () => {
      const error = new Error('Creation failed');
      mockHttpController.post.mockReturnValue(throwError(() => error));

      await expect(firstValueFrom(service.addTemplate(mockController, newTemplate))).rejects.toThrow(
        'Creation failed'
      );
    });
  });

  describe('saveTemplate', () => {
    const template: VmwareTemplate = { template_id: 'vmware-1', name: 'Updated' } as VmwareTemplate;

    it('should call httpController.put with template_id', async () => {
      mockHttpController.put.mockReturnValue(of(template));

      await firstValueFrom(service.saveTemplate(mockController, template));

      expect(mockHttpController.put).toHaveBeenCalledWith(mockController, '/templates/vmware-1', template);
    });

    it('should return updated VmwareTemplate', async () => {
      mockHttpController.put.mockReturnValue(of(template));

      const result = await firstValueFrom(service.saveTemplate(mockController, template));

      expect(result).toEqual(template);
    });

    it('should propagate error when update fails', async () => {
      const error = new Error('Update failed');
      mockHttpController.put.mockReturnValue(throwError(() => error));

      await expect(firstValueFrom(service.saveTemplate(mockController, template))).rejects.toThrow('Update failed');
    });
  });

  describe('getVirtualMachines', () => {
    const mockVms: VmwareVm[] = [
      { vmname: 'VM 1', vmx_path: '/path/to/vm1.vmx' },
      { vmname: 'VM 2', vmx_path: '/path/to/vm2.vmx' },
    ];

    it('should call httpController.get with vmware vms endpoint', async () => {
      mockHttpController.get.mockReturnValue(of(mockVms));

      await firstValueFrom(service.getVirtualMachines(mockController));

      expect(mockHttpController.get).toHaveBeenCalledWith(mockController, '/computes/local/vmware/vms');
    });

    it('should return array of VMwareVm', async () => {
      mockHttpController.get.mockReturnValue(of(mockVms));

      const result = await firstValueFrom(service.getVirtualMachines(mockController));

      expect(result).toEqual(mockVms);
    });

    it('should return empty array when no VMs exist', async () => {
      mockHttpController.get.mockReturnValue(of([]));

      const result = await firstValueFrom(service.getVirtualMachines(mockController));

      expect(result).toEqual([]);
    });

    it('should propagate error when API fails', async () => {
      const error = new Error('Failed to load VMs');
      mockHttpController.get.mockReturnValue(throwError(() => error));

      await expect(firstValueFrom(service.getVirtualMachines(mockController))).rejects.toThrow(
        'Failed to load VMs'
      );
    });
  });
});
