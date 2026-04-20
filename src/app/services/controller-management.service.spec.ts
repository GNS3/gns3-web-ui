import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ControllerManagementService, ControllerStateEvent } from './controller-management.service';
import { Controller } from '@models/controller';

describe('ControllerManagementService', () => {
  let service: ControllerManagementService;
  let mockController: Controller;

  beforeEach(() => {
    service = new ControllerManagementService();

    mockController = {
      id: 1,
      name: 'Test Controller',
      location: 'local',
      host: 'localhost',
      port: 3080,
      protocol: 'http:' as any,
      status: 'running' as any,
    } as Controller;
  });

  describe('Service Creation', () => {
    it('should create the service', () => {
      expect(service).toBeTruthy();
    });

    it('should be instance of ControllerManagementService', () => {
      expect(service).toBeInstanceOf(ControllerManagementService);
    });
  });

  describe('statusChannel', () => {
    it('should return correct status channel name', () => {
      expect(service.statusChannel).toBe('local-controller-status-events');
    });

    it('should return string type', () => {
      expect(typeof service.statusChannel).toBe('string');
    });
  });

  describe('controllerStatusChanged', () => {
    it('should be defined', () => {
      expect(service.controllerStatusChanged).toBeDefined();
    });

    it('should be a Subject', () => {
      expect(service.controllerStatusChanged).toHaveProperty('next');
      expect(service.controllerStatusChanged).toHaveProperty('subscribe');
    });

    it('should emit events when subscribed', () => {
      let receivedEvent: ControllerStateEvent | undefined;

      service.controllerStatusChanged.subscribe((event) => {
        receivedEvent = event;
      });

      const testEvent: ControllerStateEvent = {
        controllerName: 'Test Controller',
        status: 'starting',
        message: 'Test message',
      };

      service.controllerStatusChanged.next(testEvent);

      expect(receivedEvent).toEqual(testEvent);
    });
  });

  describe('start', () => {
    it('should return a Promise', () => {
      const result = service.start(mockController);
      expect(result).toBeInstanceOf(Promise);
    });

    it('should resolve the Promise', async () => {
      await expect(service.start(mockController)).resolves.toBeUndefined();
    });

    it('should emit starting event', () => {
      let receivedEvent: ControllerStateEvent | undefined;

      service.controllerStatusChanged.subscribe((event) => {
        receivedEvent = event;
      });

      service.start(mockController);

      expect(receivedEvent).toBeDefined();
      expect(receivedEvent?.controllerName).toBe('Test Controller');
      expect(receivedEvent?.status).toBe('starting');
      expect(receivedEvent?.message).toBe('');
    });

    it('should include controller name in event', () => {
      let receivedEvent: ControllerStateEvent | undefined;

      service.controllerStatusChanged.subscribe((event) => {
        receivedEvent = event;
      });

      service.start(mockController);

      expect(receivedEvent?.controllerName).toBe('Test Controller');
    });

    it('should set status to starting', () => {
      let receivedEvent: ControllerStateEvent | undefined;

      service.controllerStatusChanged.subscribe((event) => {
        receivedEvent = event;
      });

      service.start(mockController);

      expect(receivedEvent?.status).toBe('starting');
    });

    it('should set empty message', () => {
      let receivedEvent: ControllerStateEvent | undefined;

      service.controllerStatusChanged.subscribe((event) => {
        receivedEvent = event;
      });

      service.start(mockController);

      expect(receivedEvent?.message).toBe('');
    });
  });

  describe('stop', () => {
    it('should return a Promise', () => {
      const result = service.stop(mockController);
      expect(result).toBeInstanceOf(Promise);
    });

    it('should resolve the Promise', async () => {
      await expect(service.stop(mockController)).resolves.toBeUndefined();
    });

    it('should handle stop for any controller', async () => {
      const controller1 = { ...mockController, name: 'Controller 1' };
      const controller2 = { ...mockController, name: 'Controller 2' };

      await expect(service.stop(controller1)).resolves.toBeUndefined();
      await expect(service.stop(controller2)).resolves.toBeUndefined();
    });
  });

  describe('stopAll', () => {
    it('should return a Promise', () => {
      const result = service.stopAll();
      expect(result).toBeInstanceOf(Promise);
    });

    it('should resolve the Promise', async () => {
      await expect(service.stopAll()).resolves.toBeUndefined();
    });

    it('should always resolve regardless of state', async () => {
      // Call multiple times
      await expect(service.stopAll()).resolves.toBeUndefined();
      await expect(service.stopAll()).resolves.toBeUndefined();
      await expect(service.stopAll()).resolves.toBeUndefined();
    });
  });

  describe('getRunningControllers', () => {
    it('should return an empty array', () => {
      const result = service.getRunningControllers();
      expect(result).toEqual([]);
    });

    it('should return array type', () => {
      const result = service.getRunningControllers();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should always return empty array in web application', () => {
      const result1 = service.getRunningControllers();
      const result2 = service.getRunningControllers();

      expect(result1).toEqual([]);
      expect(result2).toEqual([]);
    });
  });

  describe('Edge Cases', () => {
    it('should handle controller with special characters in name', () => {
      let receivedEvent: ControllerStateEvent | undefined;

      service.controllerStatusChanged.subscribe((event) => {
        receivedEvent = event;
      });

      const specialController = {
        ...mockController,
        name: 'Controller with special chars: @#$%',
      };

      service.start(specialController);

      expect(receivedEvent?.controllerName).toBe('Controller with special chars: @#$%');
    });

    it('should handle controller with empty name', () => {
      let receivedEvent: ControllerStateEvent | undefined;

      service.controllerStatusChanged.subscribe((event) => {
        receivedEvent = event;
      });

      const emptyNameController = {
        ...mockController,
        name: '',
      };

      service.start(emptyNameController);

      expect(receivedEvent?.controllerName).toBe('');
    });

    it('should handle multiple start calls', () => {
      let eventCount = 0;

      service.controllerStatusChanged.subscribe(() => {
        eventCount++;
      });

      service.start(mockController);
      service.start(mockController);
      service.start(mockController);

      expect(eventCount).toBe(3);
    });

    it('should handle concurrent stop calls', async () => {
      await Promise.all([service.stop(mockController), service.stop(mockController), service.stop(mockController)]);

      // Should not throw
      expect(true).toBe(true);
    });
  });

  describe('ControllerStateEvent Interface', () => {
    it('should create valid event with all properties', () => {
      const event: ControllerStateEvent = {
        controllerName: 'Test Controller',
        status: 'starting',
        message: 'Starting controller',
      };

      expect(event.controllerName).toBe('Test Controller');
      expect(event.status).toBe('starting');
      expect(event.message).toBe('Starting controller');
    });

    it('should support all status types', () => {
      const statuses: ControllerStateEvent['status'][] = ['starting', 'started', 'errored', 'stopped', 'stderr'];

      statuses.forEach((status) => {
        const event: ControllerStateEvent = {
          controllerName: 'Test',
          status,
          message: 'Test',
        };
        expect(event.status).toBe(status);
      });
    });
  });
});
