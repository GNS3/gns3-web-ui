import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AiProfilesService } from './ai-profiles.service';
import { HttpController } from './http-controller.service';
import { Observable, of } from 'rxjs';
import { Controller } from '@models/controller';

describe('AiProfilesService', () => {
  let service: AiProfilesService;
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

    service = new AiProfilesService(mockHttpController);
  });

  describe('Service Creation', () => {
    it('should create the service', () => {
      expect(service).toBeTruthy();
    });

    it('should be instance of AiProfilesService', () => {
      expect(service).toBeInstanceOf(AiProfilesService);
    });
  });

  describe('getConfigs', () => {
    it('should call httpController.get with correct endpoint', () => {
      mockHttpController.get.mockReturnValue(of({}));

      service.getConfigs(mockController, 'user-1');

      expect(mockHttpController.get).toHaveBeenCalledWith(
        mockController,
        '/access/users/user-1/llm-model-configs'
      );
    });

    it('should return Observable', () => {
      mockHttpController.get.mockReturnValue(of({}));

      const result = service.getConfigs(mockController, 'user-1');

      expect(result).toBeInstanceOf(Observable);
    });
  });

  describe('getOwnConfigs', () => {
    it('should call httpController.get with /own endpoint', () => {
      mockHttpController.get.mockReturnValue(of([]));

      service.getOwnConfigs(mockController, 'user-1');

      expect(mockHttpController.get).toHaveBeenCalledWith(
        mockController,
        '/access/users/user-1/llm-model-configs/own'
      );
    });
  });

  describe('getDefaultConfig', () => {
    it('should call httpController.get with /default endpoint', () => {
      mockHttpController.get.mockReturnValue(of({}));

      service.getDefaultConfig(mockController, 'user-1');

      expect(mockHttpController.get).toHaveBeenCalledWith(
        mockController,
        '/access/users/user-1/llm-model-configs/default'
      );
    });
  });

  describe('createConfig', () => {
    it('should call httpController.post with config', () => {
      mockHttpController.post.mockReturnValue(of({}));
      const config = { name: 'test', model_type: 'openai', provider: 'openai', base_url: 'https://api.openai.com', api_key: 'test' } as any;

      service.createConfig(mockController, 'user-1', config);

      expect(mockHttpController.post).toHaveBeenCalledWith(
        mockController,
        '/access/users/user-1/llm-model-configs',
        config
      );
    });
  });

  describe('updateConfig', () => {
    it('should call httpController.put with configId', () => {
      mockHttpController.put.mockReturnValue(of({}));
      const updates = { model: 'updated' };

      service.updateConfig(mockController, 'user-1', 'config-1', updates);

      expect(mockHttpController.put).toHaveBeenCalledWith(
        mockController,
        '/access/users/user-1/llm-model-configs/config-1',
        updates
      );
    });
  });

  describe('deleteConfig', () => {
    it('should call httpController.delete with configId', () => {
      mockHttpController.delete.mockReturnValue(of(undefined));

      service.deleteConfig(mockController, 'user-1', 'config-1');

      expect(mockHttpController.delete).toHaveBeenCalledWith(
        mockController,
        '/access/users/user-1/llm-model-configs/config-1'
      );
    });
  });

  describe('setDefaultConfig', () => {
    it('should call httpController.put with default endpoint', () => {
      mockHttpController.put.mockReturnValue(of({}));

      service.setDefaultConfig(mockController, 'user-1', 'config-1');

      expect(mockHttpController.put).toHaveBeenCalledWith(
        mockController,
        '/access/users/user-1/llm-model-configs/default/config-1',
        {}
      );
    });
  });

  describe('unsetDefaultConfig', () => {
    it('should call httpController.put with is_default: false', () => {
      mockHttpController.put.mockReturnValue(of({}));

      service.unsetDefaultConfig(mockController, 'user-1', 'config-1');

      expect(mockHttpController.put).toHaveBeenCalledWith(
        mockController,
        '/access/users/user-1/llm-model-configs/config-1',
        { is_default: false }
      );
    });
  });

  describe('getGroupConfigs', () => {
    it('should call httpController.get with group endpoint', () => {
      mockHttpController.get.mockReturnValue(of([]));

      service.getGroupConfigs(mockController, 'group-1');

      expect(mockHttpController.get).toHaveBeenCalledWith(
        mockController,
        '/access/groups/group-1/llm-model-configs'
      );
    });
  });

  describe('getDefaultGroupConfig', () => {
    it('should call httpController.get with group default endpoint', () => {
      mockHttpController.get.mockReturnValue(of({}));

      service.getDefaultGroupConfig(mockController, 'group-1');

      expect(mockHttpController.get).toHaveBeenCalledWith(
        mockController,
        '/access/groups/group-1/llm-model-configs/default'
      );
    });
  });

  describe('createGroupConfig', () => {
    it('should call httpController.post with group config', () => {
      mockHttpController.post.mockReturnValue(of({}));
      const config = { model: 'test' } as any;

      service.createGroupConfig(mockController, 'group-1', config);

      expect(mockHttpController.post).toHaveBeenCalledWith(
        mockController,
        '/access/groups/group-1/llm-model-configs',
        config
      );
    });
  });

  describe('updateGroupConfig', () => {
    it('should call httpController.put with group configId', () => {
      mockHttpController.put.mockReturnValue(of({}));
      const updates = { model: 'updated' };

      service.updateGroupConfig(mockController, 'group-1', 'config-1', updates);

      expect(mockHttpController.put).toHaveBeenCalledWith(
        mockController,
        '/access/groups/group-1/llm-model-configs/config-1',
        updates
      );
    });
  });

  describe('deleteGroupConfig', () => {
    it('should call httpController.delete with group configId', () => {
      mockHttpController.delete.mockReturnValue(of(undefined));

      service.deleteGroupConfig(mockController, 'group-1', 'config-1');

      expect(mockHttpController.delete).toHaveBeenCalledWith(
        mockController,
        '/access/groups/group-1/llm-model-configs/config-1'
      );
    });
  });

  describe('setDefaultGroupConfig', () => {
    it('should call httpController.put with group default endpoint', () => {
      mockHttpController.put.mockReturnValue(of({}));

      service.setDefaultGroupConfig(mockController, 'group-1', 'config-1');

      expect(mockHttpController.put).toHaveBeenCalledWith(
        mockController,
        '/access/groups/group-1/llm-model-configs/default/config-1',
        {}
      );
    });
  });

  describe('unsetDefaultGroupConfig', () => {
    it('should call httpController.put with is_default: false', () => {
      mockHttpController.put.mockReturnValue(of({}));

      service.unsetDefaultGroupConfig(mockController, 'group-1', 'config-1');

      expect(mockHttpController.put).toHaveBeenCalledWith(
        mockController,
        '/access/groups/group-1/llm-model-configs/config-1',
        { is_default: false }
      );
    });
  });
});
