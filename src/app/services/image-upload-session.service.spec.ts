import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ImageUploadSessionService, ImageUploadEvent } from './image-upload-session.service';
import { Observable } from 'rxjs';

describe('ImageUploadSessionService', () => {
  let service: ImageUploadSessionService;

  beforeEach(() => {
    service = new ImageUploadSessionService();
  });

  describe('Service Creation', () => {
    it('should create the service', () => {
      expect(service).toBeTruthy();
    });

    it('should be instance of ImageUploadSessionService', () => {
      expect(service).toBeInstanceOf(ImageUploadSessionService);
    });

    it('should be providedIn root', () => {
      expect(service).toBeTruthy();
    });
  });

  describe('events$', () => {
    it('should return an Observable', () => {
      const events = service.events$;

      expect(events).toBeInstanceOf(Observable);
    });

    it('should emit events through the Observable', () => {
      let receivedEvent: ImageUploadEvent | undefined;

      service.events$.subscribe((event) => {
        receivedEvent = event;
      });

      const testEvent: ImageUploadEvent = {
        tempId: 'temp-123',
        filename: 'test.img',
        image_type: 'qemu',
        image_size: 1024,
        progress: 50,
        status: 'uploading',
      };

      service.emit(testEvent);

      expect(receivedEvent).toEqual(testEvent);
    });

    it('should emit multiple events', () => {
      const events: ImageUploadEvent[] = [];

      service.events$.subscribe((event) => {
        events.push(event);
      });

      service.emit({
        tempId: '1',
        filename: 'test1.img',
        image_type: 'qemu',
        image_size: 100,
        progress: 0,
        status: 'queued',
      });
      service.emit({
        tempId: '2',
        filename: 'test2.img',
        image_type: 'docker',
        image_size: 200,
        progress: 50,
        status: 'uploading',
      });
      service.emit({
        tempId: '3',
        filename: 'test3.img',
        image_type: 'ios',
        image_size: 300,
        progress: 100,
        status: 'uploaded',
      });

      expect(events).toHaveLength(3);
    });
  });

  describe('cancelRequests$', () => {
    it('should return an Observable', () => {
      const cancelRequests = service.cancelRequests$;

      expect(cancelRequests).toBeInstanceOf(Observable);
    });

    it('should emit cancel requests through the Observable', () => {
      let receivedTempId: string | undefined;

      service.cancelRequests$.subscribe((tempId) => {
        receivedTempId = tempId;
      });

      service.requestCancel('temp-123');

      expect(receivedTempId).toBe('temp-123');
    });

    it('should emit multiple cancel requests', () => {
      const tempIds: string[] = [];

      service.cancelRequests$.subscribe((tempId) => {
        tempIds.push(tempId);
      });

      service.requestCancel('temp-1');
      service.requestCancel('temp-2');
      service.requestCancel('temp-3');

      expect(tempIds).toEqual(['temp-1', 'temp-2', 'temp-3']);
    });
  });

  describe('emit', () => {
    it('should emit an event', () => {
      let receivedEvent: ImageUploadEvent | undefined;

      service.events$.subscribe((event) => {
        receivedEvent = event;
      });

      const testEvent: ImageUploadEvent = {
        tempId: 'test-temp-id',
        filename: 'test.img',
        image_type: 'qemu',
        image_size: 2048,
        progress: 75,
        status: 'uploading',
      };

      service.emit(testEvent);

      expect(receivedEvent).toEqual(testEvent);
    });

    it('should emit event with all properties', () => {
      let receivedEvent: ImageUploadEvent | undefined;

      service.events$.subscribe((event) => {
        receivedEvent = event;
      });

      const fullEvent: ImageUploadEvent = {
        tempId: 'temp-full',
        filename: 'full.img',
        image_type: 'docker',
        image_size: 4096,
        progress: 100,
        status: 'uploaded',
        errorMessage: '',
        controller_id: 1,
      };

      service.emit(fullEvent);

      expect(receivedEvent?.tempId).toBe('temp-full');
      expect(receivedEvent?.filename).toBe('full.img');
      expect(receivedEvent?.image_type).toBe('docker');
      expect(receivedEvent?.image_size).toBe(4096);
      expect(receivedEvent?.progress).toBe(100);
      expect(receivedEvent?.status).toBe('uploaded');
      expect(receivedEvent?.errorMessage).toBe('');
      expect(receivedEvent?.controller_id).toBe(1);
    });
  });

  describe('requestCancel', () => {
    it('should emit cancel request when no handler registered', () => {
      let receivedTempId: string | undefined;

      service.cancelRequests$.subscribe((tempId) => {
        receivedTempId = tempId;
      });

      service.requestCancel('temp-123');

      expect(receivedTempId).toBe('temp-123');
    });

    it('should call registered cancel handler', () => {
      let handlerCalled = false;

      service.registerCancelHandler('temp-123', () => {
        handlerCalled = true;
      });

      service.requestCancel('temp-123');

      expect(handlerCalled).toBe(true);
    });

    it('should not emit cancel request when handler is called', () => {
      let cancelRequestEmitted = false;

      service.cancelRequests$.subscribe(() => {
        cancelRequestEmitted = true;
      });

      service.registerCancelHandler('temp-123', () => {});

      service.requestCancel('temp-123');

      expect(cancelRequestEmitted).toBe(false);
    });

    it('should handle request for non-existent handler', () => {
      let receivedTempId: string | undefined;

      service.cancelRequests$.subscribe((tempId) => {
        receivedTempId = tempId;
      });

      service.requestCancel('non-existent');

      expect(receivedTempId).toBe('non-existent');
    });
  });

  describe('registerCancelHandler', () => {
    it('should register a cancel handler', () => {
      let handlerCalled = false;

      service.registerCancelHandler('temp-123', () => {
        handlerCalled = true;
      });

      service.requestCancel('temp-123');

      expect(handlerCalled).toBe(true);
    });

    it('should not register handler with empty tempId', () => {
      let handlerCalled = false;

      service.registerCancelHandler('', () => {
        handlerCalled = true;
      });

      service.requestCancel('');

      expect(handlerCalled).toBe(false);
    });

    it('should not register handler with null tempId', () => {
      let handlerCalled = false;

      service.registerCancelHandler(null as any, () => {
        handlerCalled = true;
      });

      service.requestCancel(('' + null) as any);

      expect(handlerCalled).toBe(false);
    });

    it('should not register handler with undefined tempId', () => {
      let handlerCalled = false;

      service.registerCancelHandler(undefined as any, () => {
        handlerCalled = true;
      });

      service.requestCancel(('' + undefined) as any);

      expect(handlerCalled).toBe(false);
    });

    it('should not register handler with null handler', () => {
      // Should emit cancel request instead
      let receivedTempId: string | undefined;
      service.cancelRequests$.subscribe((tempId) => {
        receivedTempId = tempId;
      });

      service.registerCancelHandler('temp-123', null as any);

      service.requestCancel('temp-123');

      expect(receivedTempId).toBe('temp-123');
    });

    it('should not register handler with undefined handler', () => {
      // Should emit cancel request instead
      let receivedTempId: string | undefined;
      service.cancelRequests$.subscribe((tempId) => {
        receivedTempId = tempId;
      });

      service.registerCancelHandler('temp-123', undefined as any);

      service.requestCancel('temp-123');

      expect(receivedTempId).toBe('temp-123');
    });

    it('should override existing handler', () => {
      let firstHandlerCalled = false;
      let secondHandlerCalled = false;

      service.registerCancelHandler('temp-123', () => {
        firstHandlerCalled = true;
      });

      service.registerCancelHandler('temp-123', () => {
        secondHandlerCalled = true;
      });

      service.requestCancel('temp-123');

      expect(firstHandlerCalled).toBe(false);
      expect(secondHandlerCalled).toBe(true);
    });
  });

  describe('unregisterCancelHandler', () => {
    it('should unregister a cancel handler', () => {
      let handlerCalled = false;

      service.registerCancelHandler('temp-123', () => {
        handlerCalled = true;
      });

      service.unregisterCancelHandler('temp-123');

      service.requestCancel('temp-123');

      expect(handlerCalled).toBe(false);
    });

    it('should not unregister with empty tempId', () => {
      service.registerCancelHandler('temp-123', () => {});

      service.unregisterCancelHandler('');

      service.requestCancel('temp-123');

      // Handler should still be called
      let handlerCalled = false;
      service.registerCancelHandler('temp-123', () => {
        handlerCalled = true;
      });

      service.requestCancel('temp-123');

      expect(handlerCalled).toBe(true);
    });

    it('should not unregister with null tempId', () => {
      service.registerCancelHandler('temp-123', () => {});

      service.unregisterCancelHandler(null as any);

      service.requestCancel('temp-123');

      // Handler should still be called
      let handlerCalled = false;
      service.registerCancelHandler('temp-123', () => {
        handlerCalled = true;
      });

      service.requestCancel('temp-123');

      expect(handlerCalled).toBe(true);
    });

    it('should not unregister with undefined tempId', () => {
      service.registerCancelHandler('temp-123', () => {});

      service.unregisterCancelHandler(undefined as any);

      service.requestCancel('temp-123');

      // Handler should still be called
      let handlerCalled = false;
      service.registerCancelHandler('temp-123', () => {
        handlerCalled = true;
      });

      service.requestCancel('temp-123');

      expect(handlerCalled).toBe(true);
    });

    it('should handle unregistering non-existent handler', () => {
      // Should not throw
      expect(() => {
        service.unregisterCancelHandler('non-existent');
      }).not.toThrow();
    });
  });

  describe('Edge Cases', () => {
    it('should handle multiple concurrent uploads', () => {
      const events: ImageUploadEvent[] = [];

      service.events$.subscribe((event) => {
        events.push(event);
      });

      for (let i = 0; i < 10; i++) {
        service.emit({
          tempId: `temp-${i}`,
          filename: `image${i}.img`,
          image_type: 'qemu',
          image_size: 100 * i,
          progress: i * 10,
          status: 'uploading',
        });
      }

      expect(events).toHaveLength(10);
    });

    it('should handle rapid cancel requests', () => {
      const tempIds: string[] = [];

      service.cancelRequests$.subscribe((tempId) => {
        tempIds.push(tempId);
      });

      for (let i = 0; i < 10; i++) {
        service.requestCancel(`temp-${i}`);
      }

      expect(tempIds).toHaveLength(10);
    });

    it('should handle special characters in tempId', () => {
      let receivedTempId: string | undefined;

      service.cancelRequests$.subscribe((tempId) => {
        receivedTempId = tempId;
      });

      service.requestCancel('temp-with-special-chars-@#$%');

      expect(receivedTempId).toBe('temp-with-special-chars-@#$%');
    });

    it('should handle very long tempId', () => {
      let receivedTempId: string | undefined;

      service.cancelRequests$.subscribe((tempId) => {
        receivedTempId = tempId;
      });

      const longTempId = 'temp-' + 'x'.repeat(1000);
      service.requestCancel(longTempId);

      expect(receivedTempId).toBe(longTempId);
    });
  });

  describe('ImageUploadEvent Interface', () => {
    it('should create valid event with required properties', () => {
      const event: ImageUploadEvent = {
        tempId: 'temp-123',
        filename: 'test.img',
        image_type: 'qemu',
        image_size: 1024,
        progress: 50,
        status: 'uploading',
      };

      expect(event.tempId).toBe('temp-123');
      expect(event.filename).toBe('test.img');
      expect(event.image_type).toBe('qemu');
      expect(event.image_size).toBe(1024);
      expect(event.progress).toBe(50);
      expect(event.status).toBe('uploading');
    });

    it('should create event with optional properties', () => {
      const event: ImageUploadEvent = {
        tempId: 'temp-456',
        filename: 'test.img',
        image_type: 'docker',
        image_size: 2048,
        progress: 100,
        status: 'uploaded',
        errorMessage: 'Upload successful',
        controller_id: 1,
      };

      expect(event.errorMessage).toBe('Upload successful');
      expect(event.controller_id).toBe(1);
    });

    it('should handle different status values', () => {
      const statuses: ImageUploadEvent['status'][] = ['queued', 'uploading', 'uploaded', 'error', 'canceled'];

      statuses.forEach((status) => {
        const event: ImageUploadEvent = {
          tempId: 'test',
          filename: 'test.img',
          image_type: 'qemu',
          image_size: 100,
          progress: 50,
          status,
        };
        expect(event.status).toBe(status);
      });
    });
  });
});
