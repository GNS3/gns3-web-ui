import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NotificationService, ComputeNotification } from './notification.service';
import { Controller } from '@models/controller';

// Mock environment
vi.mock('environments/environment', () => ({
  environment: {
    current_version: 'v2',
  },
}));

describe('NotificationService', () => {
  let service: NotificationService;
  let mockController: Controller;

  beforeEach(() => {
    service = new NotificationService();

    // Mock Controller
    mockController = {
      id: 1,
      authToken: 'test-token-123',
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
  });

  describe('Service Creation', () => {
    it('should create the service', () => {
      expect(service).toBeTruthy();
    });

    it('should be instance of NotificationService', () => {
      expect(service).toBeInstanceOf(NotificationService);
    });

    it('should have computeNotificationEmitter defined', () => {
      expect(service.computeNotificationEmitter).toBeDefined();
    });
  });

  describe('notificationsPath', () => {
    it('should build WebSocket URL for HTTP controller', () => {
      const httpController = { ...mockController, protocol: 'http:' as any };
      const result = service.notificationsPath(httpController);

      expect(result).toBe('ws://localhost:3080/v2/notifications/ws?token=test-token-123');
    });

    it('should build WSS URL for HTTPS controller', () => {
      const httpsController = { ...mockController, protocol: 'https:' as any };
      const result = service.notificationsPath(httpsController);

      expect(result).toBe('wss://localhost:3080/v2/notifications/ws?token=test-token-123');
    });

    it('should include controller host in URL', () => {
      const customHostController = { ...mockController, host: '192.168.1.100' };
      const result = service.notificationsPath(customHostController);

      expect(result).toContain('192.168.1.100');
    });

    it('should include controller port in URL', () => {
      const customPortController = { ...mockController, port: 8080 };
      const result = service.notificationsPath(customPortController);

      expect(result).toContain(':8080');
    });

    it('should include auth token in URL', () => {
      const tokenController = { ...mockController, authToken: 'custom-token' };
      const result = service.notificationsPath(tokenController);

      expect(result).toContain('token=custom-token');
    });

    it('should include current version in URL path', () => {
      const result = service.notificationsPath(mockController);

      expect(result).toContain('/v2/notifications/ws');
    });

    it('should handle different port numbers', () => {
      const port9000Controller = { ...mockController, port: 9000 };
      const result = service.notificationsPath(port9000Controller);

      expect(result).toContain(':9000');
    });

    it('should handle standard HTTPS port 443', () => {
      const https443Controller = { ...mockController, protocol: 'https:' as any, port: 443 };
      const result = service.notificationsPath(https443Controller);

      expect(result).toBe('wss://localhost:443/v2/notifications/ws?token=test-token-123');
    });
  });

  describe('projectNotificationsPath', () => {
    it('should build WebSocket URL for HTTP controller', () => {
      const httpController = { ...mockController, protocol: 'http:' as any };
      const result = service.projectNotificationsPath(httpController, 'project-123');

      expect(result).toBe('ws://localhost:3080/v2/projects/project-123/notifications/ws?token=test-token-123');
    });

    it('should build WSS URL for HTTPS controller', () => {
      const httpsController = { ...mockController, protocol: 'https:' as any };
      const result = service.projectNotificationsPath(httpsController, 'project-456');

      expect(result).toBe('wss://localhost:3080/v2/projects/project-456/notifications/ws?token=test-token-123');
    });

    it('should include project_id in URL', () => {
      const result = service.projectNotificationsPath(mockController, 'my-project');

      expect(result).toContain('/projects/my-project/notifications/ws');
    });

    it('should handle special characters in project_id', () => {
      const result = service.projectNotificationsPath(mockController, 'project-with-dash');

      expect(result).toContain('/projects/project-with-dash/notifications/ws');
    });

    it('should include all required components in URL', () => {
      const result = service.projectNotificationsPath(mockController, 'proj-1');

      expect(result).toContain('ws://');
      expect(result).toContain('localhost:3080');
      expect(result).toContain('/v2/projects/proj-1/notifications/ws');
      expect(result).toContain('token=test-token-123');
    });

    it('should handle project_id with underscores', () => {
      const result = service.projectNotificationsPath(mockController, 'project_with_underscore');

      expect(result).toContain('/projects/project_with_underscore/notifications/ws');
    });

    it('should handle UUID-like project IDs', () => {
      const uuidProject = '123e4567-e89b-12d3-a456-426614174000';
      const result = service.projectNotificationsPath(mockController, uuidProject);

      expect(result).toContain(`/projects/${uuidProject}/notifications/ws`);
    });
  });

  describe('disconnect', () => {
    it('should handle disconnect when no connection exists', () => {
      expect(() => service.disconnect()).not.toThrow();
    });

    it('should not throw when ws is null', () => {
      service['ws'] = null;
      expect(() => service.disconnect()).not.toThrow();
    });

    it('should not throw when currentController is null', () => {
      service['currentController'] = null;
      expect(() => service.disconnect()).not.toThrow();
    });
  });

  describe('handleMessage', () => {
    it('should emit event for compute.created action', () => {
      const emitSpy = vi.spyOn(service.computeNotificationEmitter, 'emit');

      const message = {
        action: 'compute.created',
        event: { compute_id: 'compute-1', name: 'Test Compute' },
      };

      service['handleMessage'](message);

      expect(emitSpy).toHaveBeenCalledWith(message);

      emitSpy.mockRestore();
    });

    it('should emit event for compute.updated action', () => {
      const emitSpy = vi.spyOn(service.computeNotificationEmitter, 'emit');

      const message = {
        action: 'compute.updated',
        event: { compute_id: 'compute-2', name: 'Updated Compute' },
      };

      service['handleMessage'](message);

      expect(emitSpy).toHaveBeenCalledWith(message);

      emitSpy.mockRestore();
    });

    it('should emit event for compute.deleted action', () => {
      const emitSpy = vi.spyOn(service.computeNotificationEmitter, 'emit');

      const message = {
        action: 'compute.deleted',
        event: { compute_id: 'compute-3', name: 'Deleted Compute' },
      };

      service['handleMessage'](message);

      expect(emitSpy).toHaveBeenCalledWith(message);

      emitSpy.mockRestore();
    });

    it('should ignore unknown actions', () => {
      const emitSpy = vi.spyOn(service.computeNotificationEmitter, 'emit');

      const message = {
        action: 'unknown.action',
        event: { data: 'test' },
      };

      service['handleMessage'](message);

      expect(emitSpy).not.toHaveBeenCalled();

      emitSpy.mockRestore();
    });

    it('should handle compute.created with full event data', () => {
      const emitSpy = vi.spyOn(service.computeNotificationEmitter, 'emit');

      const message = {
        action: 'compute.created',
        event: {
          compute_id: 'comp-1',
          name: 'Compute 1',
          host: 'localhost',
          port: 3080,
          protocol: 'http',
          user: 'admin',
          cpu_usage_percent: 50.5,
          memory_usage_percent: 75.2,
        },
      };

      service['handleMessage'](message);

      expect(emitSpy).toHaveBeenCalledWith(message);

      emitSpy.mockRestore();
    });

    it('should handle compute.updated with partial event data', () => {
      const emitSpy = vi.spyOn(service.computeNotificationEmitter, 'emit');

      const message = {
        action: 'compute.updated',
        event: {
          compute_id: 'comp-2',
          cpu_usage_percent: 80.0,
        },
      };

      service['handleMessage'](message);

      expect(emitSpy).toHaveBeenCalledWith(message);

      emitSpy.mockRestore();
    });
  });

  describe('Emitter', () => {
    it('should allow subscribing to compute notifications', () => {
      let receivedNotification: ComputeNotification | undefined;

      service.computeNotificationEmitter.subscribe((notification) => {
        receivedNotification = notification;
      });

      const message: ComputeNotification = {
        action: 'compute.created',
        event: { compute_id: 'compute-1', name: 'Test' },
      };

      service.computeNotificationEmitter.emit(message);

      expect(receivedNotification).toEqual(message);
    });

    it('should handle multiple subscribers', () => {
      let count = 0;

      service.computeNotificationEmitter.subscribe(() => count++);
      service.computeNotificationEmitter.subscribe(() => count++);

      const message: ComputeNotification = {
        action: 'compute.created',
        event: { compute_id: 'compute-1' },
      };

      service.computeNotificationEmitter.emit(message);

      expect(count).toBe(2);
    });

    it('should emit all three valid action types', () => {
      const actions: ComputeNotification['action'][] = [
        'compute.created',
        'compute.updated',
        'compute.deleted',
      ];

      actions.forEach((action) => {
        let received = false;
        service.computeNotificationEmitter.subscribe((notification) => {
          if (notification.action === action) {
            received = true;
          }
        });

        service.computeNotificationEmitter.emit({
          action,
          event: { compute_id: 'test' },
        });

        expect(received).toBe(true);
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle controller with empty auth token', () => {
      const emptyTokenController = { ...mockController, authToken: '' };
      const result = service.notificationsPath(emptyTokenController);

      expect(result).toContain('token=');
    });

    it('should handle controller with special characters in host', () => {
      const specialHostController = { ...mockController, host: '192.168.1.1' };
      const result = service.notificationsPath(specialHostController);

      expect(result).toContain('192.168.1.1');
    });

    it('should handle project_id with underscores', () => {
      const result = service.projectNotificationsPath(mockController, 'project_with_underscore');

      expect(result).toContain('project_with_underscore');
    });

    it('should handle HTTP protocol correctly', () => {
      const httpController = { ...mockController, protocol: 'http:' as any };
      const result = service.notificationsPath(httpController);

      expect(result).toContain('ws://');
    });

    it('should handle HTTPS protocol correctly', () => {
      const httpsController = { ...mockController, protocol: 'https:' as any };
      const result = service.notificationsPath(httpsController);

      expect(result).toContain('wss://');
    });

    it('should handle controller with port 0', () => {
      const portZeroController = { ...mockController, port: 0 };
      const result = service.notificationsPath(portZeroController);

      expect(result).toContain(':0');
    });

    it('should handle empty project_id', () => {
      const result = service.projectNotificationsPath(mockController, '');

      expect(result).toContain('/projects//notifications/ws');
    });

    it('should handle project_id with special characters', () => {
      const specialProject = 'project-name-123_test';
      const result = service.projectNotificationsPath(mockController, specialProject);

      expect(result).toContain(`/projects/${specialProject}/notifications/ws`);
    });

    it('should handle very long auth tokens', () => {
      const longToken = 'a'.repeat(1000);
      const longTokenController = { ...mockController, authToken: longToken };
      const result = service.notificationsPath(longTokenController);

      expect(result).toContain(`token=${longToken}`);
    });

    it('should handle auth tokens with special characters', () => {
      const specialToken = 'token-with-special.chars/123?=';
      const specialTokenController = { ...mockController, authToken: specialToken };
      const result = service.notificationsPath(specialTokenController);

      expect(result).toContain(`token=${specialToken}`);
    });
  });

  describe('URL Building Consistency', () => {
    it('should build consistent URLs for same controller', () => {
      const url1 = service.notificationsPath(mockController);
      const url2 = service.notificationsPath(mockController);

      expect(url1).toBe(url2);
    });

    it('should build different URLs for different controllers', () => {
      const controller1 = { ...mockController, port: 3080 };
      const controller2 = { ...mockController, port: 3081 };

      const url1 = service.notificationsPath(controller1);
      const url2 = service.notificationsPath(controller2);

      expect(url1).not.toBe(url2);
    });

    it('should maintain URL structure for project notifications', () => {
      const result = service.projectNotificationsPath(mockController, 'proj-1');

      expect(result).toMatch(/^wss?:\/\/[^\/]+\/v2\/projects\/[^\/]+\/notifications\/ws\?token=.+$/);
    });
  });
});
