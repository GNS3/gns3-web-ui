import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AclService } from './acl.service';
import { HttpController } from './http-controller.service';
import { Observable, of } from 'rxjs';
import { Controller } from '@models/controller';
import { ACE } from '@models/api/ACE';

describe('AclService', () => {
  let service: AclService;
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

    service = new AclService(mockHttpController);
  });

  describe('Service Creation', () => {
    it('should create the service', () => {
      expect(service).toBeTruthy();
    });

    it('should be instance of AclService', () => {
      expect(service).toBeInstanceOf(AclService);
    });
  });

  describe('getEndpoints', () => {
    it('should call httpController.get with /access/acl/endpoints endpoint', () => {
      mockHttpController.get.mockReturnValue(of([]));

      service.getEndpoints(mockController);

      expect(mockHttpController.get).toHaveBeenCalledWith(mockController, '/access/acl/endpoints');
    });

    it('should return Observable', () => {
      mockHttpController.get.mockReturnValue(of([]));

      const result = service.getEndpoints(mockController);

      expect(result).toBeInstanceOf(Observable);
    });
  });

  describe('list', () => {
    it('should call httpController.get with /access/acl endpoint', () => {
      mockHttpController.get.mockReturnValue(of([]));

      service.list(mockController);

      expect(mockHttpController.get).toHaveBeenCalledWith(mockController, '/access/acl');
    });

    it('should return Observable', () => {
      mockHttpController.get.mockReturnValue(of([]));

      const result = service.list(mockController);

      expect(result).toBeInstanceOf(Observable);
    });
  });

  describe('add', () => {
    it('should call httpController.post with /access/acl endpoint', () => {
      const ace = {
        name: 'test',
        ace_id: 'ace-1',
        ace_type: 'access',
        path: 'test',
        propagate: true,
        allowed: true,
        actions: [],
      } as unknown as ACE;
      mockHttpController.post.mockReturnValue(of(ace));

      service.add(mockController, ace);

      expect(mockHttpController.post).toHaveBeenCalledWith(mockController, '/access/acl', ace);
    });

    it('should return Observable', () => {
      const ace: ACE = { name: 'test' } as unknown as ACE;
      mockHttpController.post.mockReturnValue(of(ace));

      const result = service.add(mockController, ace);

      expect(result).toBeInstanceOf(Observable);
    });
  });

  describe('get', () => {
    it('should call httpController.get with ace_id in endpoint', () => {
      mockHttpController.get.mockReturnValue(
        of({
          ace_id: 'ace-1',
          name: 'test',
          ace_type: 'access',
          path: 'test',
          propagate: true,
          allowed: true,
          actions: [],
        } as unknown as unknown as ACE)
      );

      service.get(mockController, 'ace-1');

      expect(mockHttpController.get).toHaveBeenCalledWith(mockController, '/access/acl/ace-1');
    });

    it('should return Observable', () => {
      mockHttpController.get.mockReturnValue(of({}));

      const result = service.get(mockController, 'ace-1');

      expect(result).toBeInstanceOf(Observable);
    });
  });

  describe('delete', () => {
    it('should call httpController.delete with ace_id in endpoint', () => {
      mockHttpController.delete.mockReturnValue(of({}));

      service.delete(mockController, 'ace-1');

      expect(mockHttpController.delete).toHaveBeenCalledWith(mockController, '/access/acl/ace-1');
    });

    it('should return Observable', () => {
      mockHttpController.delete.mockReturnValue(of({}));

      const result = service.delete(mockController, 'ace-1');

      expect(result).toBeInstanceOf(Observable);
    });
  });

  describe('update', () => {
    it('should call httpController.put with ace_id in endpoint', () => {
      const ace = {
        ace_id: 'ace-1',
        name: 'updated',
        ace_type: 'access',
        path: 'test',
        propagate: true,
        allowed: true,
        actions: [],
      } as unknown as unknown as ACE;
      mockHttpController.put.mockReturnValue(of(ace));

      service.update(mockController, ace);

      expect(mockHttpController.put).toHaveBeenCalledWith(mockController, '/access/acl/ace-1', ace);
    });

    it('should return Observable', () => {
      mockHttpController.delete.mockReturnValue(of({}));

      const result = service.delete(mockController, 'ace-1');

      expect(result).toBeInstanceOf(Observable);
    });
  });

  describe('update', () => {
    it('should call httpController.put with ace_id in endpoint', () => {
      const ace = {
        ace_id: 'ace-1',
        name: 'updated',
        ace_type: 'access',
        path: 'test',
        propagate: true,
        allowed: true,
        actions: [],
      } as unknown as ACE;
      mockHttpController.put.mockReturnValue(of(ace));

      service.update(mockController, ace);

      expect(mockHttpController.put).toHaveBeenCalledWith(mockController, '/access/acl/ace-1', ace);
    });

    it('should return Observable', () => {
      const ace: ACE = { ace_id: 'ace-1', name: 'updated' } as unknown as ACE;
      mockHttpController.put.mockReturnValue(of(ace));

      const result = service.update(mockController, ace);

      expect(result).toBeInstanceOf(Observable);
    });
  });
});
