import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { NotificationService, ComputeNotification } from './notification.service';
import { Controller } from '@models/controller';

// Mock environment
vi.mock('environments/environment', () => ({
  environment: {
    current_version: 'v3',
  },
}));

// Mock WebSocket
class MockWebSocket {
  static instances: MockWebSocket[] = [];
  url: string;
  onopen: (() => void) | null = null;
  onmessage: ((event: { data: string }) => void) | null = null;
  onerror: (() => void) | null = null;
  onclose: (() => void) | null = null;
  close = vi.fn(() => {
    this.onclose?.();
  });

  constructor(url: string) {
    this.url = url;
    MockWebSocket.instances.push(this);
  }
}

vi.stubGlobal('WebSocket', MockWebSocket);

describe('NotificationService', () => {
  let service: NotificationService;
  let mockController: Controller;

  beforeEach(() => {
    vi.clearAllMocks();
    MockWebSocket.instances = [];

    // Ensure WebSocket stub is always set (prevents pollution from other tests)
    vi.stubGlobal('WebSocket', MockWebSocket);

    service = new NotificationService();

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

  afterEach(() => {
    service.disconnect();
    vi.unstubAllGlobals();
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
    it.each([
      { protocol: 'http:', expected: 'ws://localhost:3080/v3/notifications/ws?token=test-token-123' },
      { protocol: 'https:', expected: 'wss://localhost:3080/v3/notifications/ws?token=test-token-123' },
    ])('should build $expected protocol URL for $protocol controller', ({ protocol, expected }) => {
      const controller = { ...mockController, protocol: protocol as any };
      expect(service.notificationsPath(controller)).toBe(expected);
    });

    it.each([
      { host: '192.168.1.100', port: 3080 },
      { host: 'localhost', port: 9000 },
      { host: '192.168.1.100', port: 443 },
    ])('should include host and port in URL', ({ host, port }) => {
      const controller = { ...mockController, host, port };
      const result = service.notificationsPath(controller);
      expect(result).toContain(host);
      expect(result).toContain(`:${port}`);
    });

    it('should include auth token in URL', () => {
      const result = service.notificationsPath(mockController);
      expect(result).toContain('token=test-token-123');
    });

    it('should include current version in URL path', () => {
      const result = service.notificationsPath(mockController);
      expect(result).toContain('/v3/notifications/ws');
    });
  });

  describe('projectNotificationsPath', () => {
    it.each([
      {
        protocol: 'http:',
        expected: 'ws://localhost:3080/v3/projects/project-123/notifications/ws?token=test-token-123',
      },
      {
        protocol: 'https:',
        expected: 'wss://localhost:3080/v3/projects/project-456/notifications/ws?token=test-token-123',
      },
    ])('should build $expected protocol URL for $protocol controller', ({ protocol, expected }) => {
      const controller = { ...mockController, protocol: protocol as any };
      const projectId = protocol === 'http:' ? 'project-123' : 'project-456';
      expect(service.projectNotificationsPath(controller, projectId)).toBe(expected);
    });

    it.each([
      { projectId: 'my-project', expected: '/projects/my-project/' },
      { projectId: 'project-with-dash', expected: '/projects/project-with-dash/' },
      { projectId: 'project_with_underscore', expected: '/projects/project_with_underscore/' },
      {
        projectId: '123e4567-e89b-12d3-a456-426614174000',
        expected: '/projects/123e4567-e89b-12d3-a456-426614174000/',
      },
      { projectId: 'project-name-123_test', expected: '/projects/project-name-123_test/' },
    ])('should handle project_id: $projectId', ({ projectId, expected }) => {
      const result = service.projectNotificationsPath(mockController, projectId);
      expect(result).toContain(expected);
    });

    it('should include all required components in URL', () => {
      const result = service.projectNotificationsPath(mockController, 'proj-1');
      expect(result).toMatch(/^wss?:\/\/[^\/]+\/v3\/projects\/[^\/]+\/notifications\/ws\?token=.+$/);
    });
  });

  describe('disconnect', () => {
    it('should handle disconnect when no connection exists', () => {
      expect(() => service.disconnect()).not.toThrow();
    });

    it('should close WebSocket when connected', () => {
      service.connectToComputeNotifications(mockController);
      const ws = MockWebSocket.instances[0];

      service.disconnect();
      vi.unstubAllGlobals();

      expect(ws.close).toHaveBeenCalled();
    });

    it('should clear ws and currentController after disconnect', () => {
      service.connectToComputeNotifications(mockController);
      service.disconnect();
      vi.unstubAllGlobals();

      expect(service['ws']).toBeNull();
      expect(service['currentController']).toBeNull();
    });
  });

  describe('connectToComputeNotifications', () => {
    it('should create WebSocket with correct URL', () => {
      service.connectToComputeNotifications(mockController);

      expect(MockWebSocket.instances).toHaveLength(1);
      expect(MockWebSocket.instances[0].url).toBe('ws://localhost:3080/v3/notifications/ws?token=test-token-123');
    });

    it('should skip reconnecting to same controller', () => {
      service.connectToComputeNotifications(mockController);
      service.connectToComputeNotifications(mockController);

      expect(MockWebSocket.instances).toHaveLength(1);
    });

    it('should close existing connection when controller changes', () => {
      service.connectToComputeNotifications(mockController);
      const firstWs = MockWebSocket.instances[0];
      const closeSpy = vi.spyOn(firstWs, 'close');

      const differentController = { ...mockController, id: 2, host: 'other-host' };
      service.connectToComputeNotifications(differentController);

      expect(closeSpy).toHaveBeenCalled();
    });

    it('should create new WebSocket when controller changes', () => {
      service.connectToComputeNotifications(mockController);

      const differentController = { ...mockController, id: 2, host: 'other-host' };
      service.connectToComputeNotifications(differentController);

      expect(MockWebSocket.instances).toHaveLength(2);
    });

    it('should set up onmessage handler', () => {
      service.connectToComputeNotifications(mockController);
      const ws = MockWebSocket.instances[0];

      expect(ws.onmessage).toBeDefined();
    });

    it('should emit notification when receiving compute.created message', () => {
      const emitSpy = vi.spyOn(service.computeNotificationEmitter, 'emit');
      service.connectToComputeNotifications(mockController);
      const ws = MockWebSocket.instances[0];

      const message = { action: 'compute.created', event: { compute_id: 'compute-1', name: 'Test Compute' } };
      ws.onmessage?.({ data: JSON.stringify(message) });

      expect(emitSpy).toHaveBeenCalledWith(message);
    });

    it('should emit notification when receiving compute.updated message', () => {
      const emitSpy = vi.spyOn(service.computeNotificationEmitter, 'emit');
      service.connectToComputeNotifications(mockController);
      const ws = MockWebSocket.instances[0];

      const message = { action: 'compute.updated', event: { compute_id: 'compute-2' } };
      ws.onmessage?.({ data: JSON.stringify(message) });

      expect(emitSpy).toHaveBeenCalledWith(message);
    });

    it('should emit notification when receiving compute.deleted message', () => {
      const emitSpy = vi.spyOn(service.computeNotificationEmitter, 'emit');
      service.connectToComputeNotifications(mockController);
      const ws = MockWebSocket.instances[0];

      const message = { action: 'compute.deleted', event: { compute_id: 'compute-3' } };
      ws.onmessage?.({ data: JSON.stringify(message) });

      expect(emitSpy).toHaveBeenCalledWith(message);
    });

    it('should ignore unknown actions', () => {
      const emitSpy = vi.spyOn(service.computeNotificationEmitter, 'emit');
      service.connectToComputeNotifications(mockController);
      const ws = MockWebSocket.instances[0];

      const message = { action: 'unknown.action', event: { data: 'test' } };
      ws.onmessage?.({ data: JSON.stringify(message) });

      expect(emitSpy).not.toHaveBeenCalled();
    });

    // Note: The service does not catch JSON.parse errors, so invalid JSON causes unhandled exceptions
    // This test documents the current behavior (throws) - not ideal but reflects service implementation
    it('should throw on invalid JSON in message', () => {
      service.connectToComputeNotifications(mockController);
      const ws = MockWebSocket.instances[0];

      expect(() => ws.onmessage?.({ data: 'invalid-json' })).toThrow(SyntaxError);
    });

    it('should clean up state when WebSocket closes', () => {
      service.connectToComputeNotifications(mockController);
      const ws = MockWebSocket.instances[0];

      ws.onclose?.();

      expect(service['ws']).toBeNull();
      expect(service['currentController']).toBeNull();
    });

    it('should handle WebSocket onerror', () => {
      service.connectToComputeNotifications(mockController);
      const ws = MockWebSocket.instances[0];
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      ws.onerror?.();

      expect(consoleSpy).toHaveBeenCalledWith('Compute notifications WebSocket error');
      consoleSpy.mockRestore();
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
        event: { compute_id: 'compute-1', name: 'Test' } as any,
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
        event: { compute_id: 'compute-1' } as any,
      };

      service.computeNotificationEmitter.emit(message);

      expect(count).toBe(2);
    });

    it.each(['compute.created', 'compute.updated', 'compute.deleted'])('should emit for action: %s', (action) => {
      const emitSpy = vi.spyOn(service.computeNotificationEmitter, 'emit');
      service.connectToComputeNotifications(mockController);
      const ws = MockWebSocket.instances[0];

      ws.onmessage?.({ data: JSON.stringify({ action, event: { compute_id: 'test' } }) });

      expect(emitSpy).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it.each([
      { authToken: '', description: 'empty token' },
      { authToken: 'a'.repeat(1000), description: 'long token' },
      { authToken: 'token-with-special.chars/123?=', description: 'special characters' },
    ])('should handle $description in auth token', ({ authToken }) => {
      const controller = { ...mockController, authToken };
      const result = service.notificationsPath(controller);
      expect(result).toContain(`token=${authToken}`);
    });

    it.each([
      { host: '192.168.1.1', description: 'IPv4 address' },
      { host: '::1', description: 'IPv6 localhost' },
    ])('should handle host: $description', ({ host }) => {
      const controller = { ...mockController, host };
      const result = service.notificationsPath(controller);
      expect(result).toContain(host);
    });

    it.each([
      { port: 0, expected: ':0' },
      { port: 80, expected: ':80' },
      { port: 443, expected: ':443' },
      { port: 8080, expected: ':8080' },
    ])('should handle port: $port', ({ port, expected }) => {
      const controller = { ...mockController, port };
      const result = service.notificationsPath(controller);
      expect(result).toContain(expected);
    });

    it('should handle empty project_id', () => {
      const result = service.projectNotificationsPath(mockController, '');
      expect(result).toContain('/projects//notifications/ws');
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

    it('should maintain URL structure for notifications', () => {
      const result = service.notificationsPath(mockController);
      expect(result).toMatch(/^wss?:\/\/[^\/]+\/v3\/notifications\/ws\?token=.+$/);
    });

    it('should maintain URL structure for project notifications', () => {
      const result = service.projectNotificationsPath(mockController, 'proj-1');
      expect(result).toMatch(/^wss?:\/\/[^\/]+\/v3\/projects\/[^\/]+\/notifications\/ws\?token=.+$/);
    });
  });
});
