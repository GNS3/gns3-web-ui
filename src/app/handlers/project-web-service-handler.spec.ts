import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ProjectWebServiceHandler, WebServiceMessage } from './project-web-service-handler';
import { NodesDataSource } from '../cartography/datasources/nodes-datasource';
import { LinksDataSource } from '../cartography/datasources/links-datasource';
import { DrawingsDataSource } from '../cartography/datasources/drawings-datasource';
import { MarkerFlashService } from '@services/marker-flash.service';
import { MarkerRegistryService } from '@services/marker-registry.service';
import { Node } from '../cartography/models/node';
import { Link } from '@models/link';
import { Drawing } from '../cartography/models/drawing';

describe('ProjectWebServiceHandler', () => {
  let handler: ProjectWebServiceHandler;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockNodesDataSource: Record<string, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockLinksDataSource: Record<string, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockDrawingsDataSource: Record<string, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockMarkerFlashService: Record<string, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockMarkerRegistryService: Record<string, any>;

  const createMockNode = (id = 'node-1'): Node => ({ node_id: id, name: 'Test Node' } as Node);

  const createMockLink = (id = 'link-1'): Link => ({ link_id: id } as Link);

  const createMockDrawing = (id = 'drawing-1'): Drawing => ({ drawing_id: id } as Drawing);

  beforeEach(() => {
    vi.clearAllMocks();

    mockNodesDataSource = {
      update: vi.fn(),
      add: vi.fn(),
      remove: vi.fn(),
    };

    mockLinksDataSource = {
      update: vi.fn(),
      add: vi.fn(),
      remove: vi.fn(),
      get: vi.fn(),
    };

    mockDrawingsDataSource = {
      update: vi.fn(),
      add: vi.fn(),
      remove: vi.fn(),
    };

    mockMarkerFlashService = {
      flash: vi.fn(),
    };

    mockMarkerRegistryService = {
      reconcileLink: vi.fn(),
      removeLink: vi.fn(),
    };

    handler = new ProjectWebServiceHandler(
      mockNodesDataSource as unknown as NodesDataSource,
      mockLinksDataSource as unknown as LinksDataSource,
      mockDrawingsDataSource as unknown as DrawingsDataSource,
      mockMarkerRegistryService as unknown as MarkerRegistryService,
      mockMarkerFlashService as unknown as MarkerFlashService
    );
  });

  describe('Service Creation', () => {
    it('should create the handler', () => {
      expect(handler).toBeTruthy();
    });

    it('should be instance of ProjectWebServiceHandler', () => {
      expect(handler).toBeInstanceOf(ProjectWebServiceHandler);
    });

    it('should have nodeNotificationEmitter', () => {
      expect(handler.nodeNotificationEmitter).toBeDefined();
    });

    it('should have linkNotificationEmitter', () => {
      expect(handler.linkNotificationEmitter).toBeDefined();
    });

    it('should have drawingNotificationEmitter', () => {
      expect(handler.drawingNotificationEmitter).toBeDefined();
    });

    it('should have infoNotificationEmitter', () => {
      expect(handler.infoNotificationEmitter).toBeDefined();
    });

    it('should have warningNotificationEmitter', () => {
      expect(handler.warningNotificationEmitter).toBeDefined();
    });

    it('should have errorNotificationEmitter', () => {
      expect(handler.errorNotificationEmitter).toBeDefined();
    });
  });

  describe('handleMessage - node actions', () => {
    it('should call nodesDataSource.update and emit for node.updated', () => {
      const message: WebServiceMessage = {
        action: 'node.updated',
        event: createMockNode(),
      };

      const emitSpy = vi.spyOn(handler.nodeNotificationEmitter, 'emit');

      handler.handleMessage(message);

      expect(mockNodesDataSource.update).toHaveBeenCalledWith(message.event);
      expect(emitSpy).toHaveBeenCalledWith(message);
    });

    it('should call nodesDataSource.add and emit for node.created', () => {
      const message: WebServiceMessage = {
        action: 'node.created',
        event: createMockNode(),
      };

      const emitSpy = vi.spyOn(handler.nodeNotificationEmitter, 'emit');

      handler.handleMessage(message);

      expect(mockNodesDataSource.add).toHaveBeenCalledWith(message.event);
      expect(emitSpy).toHaveBeenCalledWith(message);
    });

    it('should call nodesDataSource.remove and emit for node.deleted', () => {
      const message: WebServiceMessage = {
        action: 'node.deleted',
        event: createMockNode(),
      };

      const emitSpy = vi.spyOn(handler.nodeNotificationEmitter, 'emit');

      handler.handleMessage(message);

      expect(mockNodesDataSource.remove).toHaveBeenCalledWith(message.event);
      expect(emitSpy).toHaveBeenCalledWith(message);
    });

    it('should handle node.updated with specific node data', () => {
      const node = createMockNode('specific-node-id');
      node.name = 'Custom Node';
      const message: WebServiceMessage = { action: 'node.updated', event: node };

      handler.handleMessage(message);

      expect(mockNodesDataSource.update).toHaveBeenCalledWith(node);
    });
  });

  describe('handleMessage - link actions', () => {
    it('should call linksDataSource.add and emit for link.created', () => {
      const message: WebServiceMessage = {
        action: 'link.created',
        event: createMockLink(),
      };

      const emitSpy = vi.spyOn(handler.linkNotificationEmitter, 'emit');

      handler.handleMessage(message);

      expect(mockLinksDataSource.add).toHaveBeenCalledWith(message.event);
      expect(emitSpy).toHaveBeenCalledWith(message);
    });

    it('should call linksDataSource.update and emit for link.updated', () => {
      const message: WebServiceMessage = {
        action: 'link.updated',
        event: createMockLink(),
      };

      const emitSpy = vi.spyOn(handler.linkNotificationEmitter, 'emit');

      handler.handleMessage(message);

      expect(mockLinksDataSource.update).toHaveBeenCalledWith(message.event);
      expect(emitSpy).toHaveBeenCalledWith(message);
    });

    it('should call linksDataSource.remove and emit for link.deleted', () => {
      const message: WebServiceMessage = {
        action: 'link.deleted',
        event: createMockLink(),
      };

      const emitSpy = vi.spyOn(handler.linkNotificationEmitter, 'emit');

      handler.handleMessage(message);

      expect(mockLinksDataSource.remove).toHaveBeenCalledWith(message.event);
      expect(emitSpy).toHaveBeenCalledWith(message);
    });

    it('should handle link.updated with specific link data', () => {
      const link = createMockLink('custom-link-id');
      const message: WebServiceMessage = { action: 'link.updated', event: link };

      handler.handleMessage(message);

      expect(mockLinksDataSource.update).toHaveBeenCalledWith(link);
    });
  });

  describe('handleMessage - drawing actions', () => {
    it('should call drawingsDataSource.add and emit for drawing.created', () => {
      const message: WebServiceMessage = {
        action: 'drawing.created',
        event: createMockDrawing(),
      };

      const emitSpy = vi.spyOn(handler.drawingNotificationEmitter, 'emit');

      handler.handleMessage(message);

      expect(mockDrawingsDataSource.add).toHaveBeenCalledWith(message.event);
      expect(emitSpy).toHaveBeenCalledWith(message);
    });

    it('should call drawingsDataSource.update and emit for drawing.updated', () => {
      const message: WebServiceMessage = {
        action: 'drawing.updated',
        event: createMockDrawing(),
      };

      const emitSpy = vi.spyOn(handler.drawingNotificationEmitter, 'emit');

      handler.handleMessage(message);

      expect(mockDrawingsDataSource.update).toHaveBeenCalledWith(message.event);
      expect(emitSpy).toHaveBeenCalledWith(message);
    });

    it('should call drawingsDataSource.remove and emit for drawing.deleted', () => {
      const message: WebServiceMessage = {
        action: 'drawing.deleted',
        event: createMockDrawing(),
      };

      const emitSpy = vi.spyOn(handler.drawingNotificationEmitter, 'emit');

      handler.handleMessage(message);

      expect(mockDrawingsDataSource.remove).toHaveBeenCalledWith(message.event);
      expect(emitSpy).toHaveBeenCalledWith(message);
    });

    it('should handle drawing.updated with specific drawing data', () => {
      const drawing = createMockDrawing('custom-drawing-id');
      const message: WebServiceMessage = { action: 'drawing.updated', event: drawing };

      handler.handleMessage(message);

      expect(mockDrawingsDataSource.update).toHaveBeenCalledWith(drawing);
    });
  });

  describe('handleMessage - log actions', () => {
    it('should emit message string for log.error', () => {
      const message = { action: 'log.error', event: { message: 'Error occurred' } };

      const emitSpy = vi.spyOn(handler.errorNotificationEmitter, 'emit');

      handler.handleMessage(message);

      expect(emitSpy).toHaveBeenCalledWith('Error occurred');
    });

    it('should emit message string for log.warning', () => {
      const message = { action: 'log.warning', event: { message: 'Warning occurred' } };

      const emitSpy = vi.spyOn(handler.warningNotificationEmitter, 'emit');

      handler.handleMessage(message);

      expect(emitSpy).toHaveBeenCalledWith('Warning occurred');
    });

    it('should emit message string for log.info', () => {
      const message = { action: 'log.info', event: { message: 'Info occurred' } };

      const emitSpy = vi.spyOn(handler.infoNotificationEmitter, 'emit');

      handler.handleMessage(message);

      expect(emitSpy).toHaveBeenCalledWith('Info occurred');
    });

    it('should handle empty message string for log.error', () => {
      const message = { action: 'log.error', event: { message: '' } };

      const emitSpy = vi.spyOn(handler.errorNotificationEmitter, 'emit');

      handler.handleMessage(message);

      expect(emitSpy).toHaveBeenCalledWith('');
    });
  });

  describe('handleMessage - unknown actions', () => {
    it('should not call any datasource methods for unknown action', () => {
      const message = { action: 'unknown.action', event: { data: 'test' } };

      handler.handleMessage(message);

      expect(mockNodesDataSource.update).not.toHaveBeenCalled();
      expect(mockNodesDataSource.add).not.toHaveBeenCalled();
      expect(mockNodesDataSource.remove).not.toHaveBeenCalled();
      expect(mockLinksDataSource.update).not.toHaveBeenCalled();
      expect(mockLinksDataSource.add).not.toHaveBeenCalled();
      expect(mockLinksDataSource.remove).not.toHaveBeenCalled();
      expect(mockDrawingsDataSource.update).not.toHaveBeenCalled();
      expect(mockDrawingsDataSource.add).not.toHaveBeenCalled();
      expect(mockDrawingsDataSource.remove).not.toHaveBeenCalled();
    });

    it('should not emit any notification for unknown action', () => {
      const message = { action: 'unknown.action', event: { data: 'test' } };

      const nodeEmitSpy = vi.spyOn(handler.nodeNotificationEmitter, 'emit');
      const linkEmitSpy = vi.spyOn(handler.linkNotificationEmitter, 'emit');
      const drawingEmitSpy = vi.spyOn(handler.drawingNotificationEmitter, 'emit');
      const infoEmitSpy = vi.spyOn(handler.infoNotificationEmitter, 'emit');
      const warningEmitSpy = vi.spyOn(handler.warningNotificationEmitter, 'emit');
      const errorEmitSpy = vi.spyOn(handler.errorNotificationEmitter, 'emit');

      handler.handleMessage(message);

      expect(nodeEmitSpy).not.toHaveBeenCalled();
      expect(linkEmitSpy).not.toHaveBeenCalled();
      expect(drawingEmitSpy).not.toHaveBeenCalled();
      expect(infoEmitSpy).not.toHaveBeenCalled();
      expect(warningEmitSpy).not.toHaveBeenCalled();
      expect(errorEmitSpy).not.toHaveBeenCalled();
    });

    it('should handle empty action string', () => {
      const message = { action: '', event: {} };

      handler.handleMessage(message);

      expect(mockNodesDataSource.add).not.toHaveBeenCalled();
    });

    it('should handle action with no event property', () => {
      const message = { action: 'node.created' } as WebServiceMessage;

      const emitSpy = vi.spyOn(handler.nodeNotificationEmitter, 'emit');

      handler.handleMessage(message);

      expect(mockNodesDataSource.add).toHaveBeenCalledWith(undefined);
      expect(emitSpy).toHaveBeenCalledWith(message);
    });
  });

  describe('Emitter subscriptions', () => {
    it('should allow subscribing to node notifications', () => {
      let receivedMessage: WebServiceMessage | undefined;

      handler.nodeNotificationEmitter.subscribe((msg) => {
        receivedMessage = msg;
      });

      const message: WebServiceMessage = {
        action: 'node.created',
        event: createMockNode(),
      };

      handler.handleMessage(message);

      expect(receivedMessage).toEqual(message);
    });

    it('should allow subscribing to link notifications', () => {
      let receivedMessage: WebServiceMessage | undefined;

      handler.linkNotificationEmitter.subscribe((msg) => {
        receivedMessage = msg;
      });

      const message: WebServiceMessage = {
        action: 'link.updated',
        event: createMockLink(),
      };

      handler.handleMessage(message);

      expect(receivedMessage).toEqual(message);
    });

    it('should allow subscribing to drawing notifications', () => {
      let receivedMessage: WebServiceMessage | undefined;

      handler.drawingNotificationEmitter.subscribe((msg) => {
        receivedMessage = msg;
      });

      const message: WebServiceMessage = {
        action: 'drawing.deleted',
        event: createMockDrawing(),
      };

      handler.handleMessage(message);

      expect(receivedMessage).toEqual(message);
    });

    it('should allow subscribing to error notifications', () => {
      let receivedMessage: string | undefined;

      handler.errorNotificationEmitter.subscribe((msg) => {
        receivedMessage = msg;
      });

      const message = { action: 'log.error', event: { message: 'Critical error' } };

      handler.handleMessage(message);

      expect(receivedMessage).toBe('Critical error');
    });

    it('should allow subscribing to warning notifications', () => {
      let receivedMessage: string | undefined;

      handler.warningNotificationEmitter.subscribe((msg) => {
        receivedMessage = msg;
      });

      const message = { action: 'log.warning', event: { message: 'Warning message' } };

      handler.handleMessage(message);

      expect(receivedMessage).toBe('Warning message');
    });

    it('should allow subscribing to info notifications', () => {
      let receivedMessage: string | undefined;

      handler.infoNotificationEmitter.subscribe((msg) => {
        receivedMessage = msg;
      });

      const message = { action: 'log.info', event: { message: 'Info message' } };

      handler.handleMessage(message);

      expect(receivedMessage).toBe('Info message');
    });

    it('should handle multiple subscribers to same emitter', () => {
      let count = 0;

      handler.nodeNotificationEmitter.subscribe(() => count++);
      handler.nodeNotificationEmitter.subscribe(() => count++);

      const message: WebServiceMessage = {
        action: 'node.created',
        event: createMockNode(),
      };

      handler.handleMessage(message);

      expect(count).toBe(2);
    });
  });

  describe('WebServiceMessage interface', () => {
    it('should accept any type for event property', () => {
      const message: WebServiceMessage = {
        action: 'node.updated',
        event: { custom: 'data', nested: { value: 123 } },
      };

      const emitSpy = vi.spyOn(handler.nodeNotificationEmitter, 'emit');

      handler.handleMessage(message);

      expect(emitSpy).toHaveBeenCalledWith(message);
    });

    it('should handle event with null value', () => {
      const message: WebServiceMessage = {
        action: 'node.updated',
        event: null,
      };

      handler.handleMessage(message);

      expect(mockNodesDataSource.update).toHaveBeenCalledWith(null);
    });
  });

  describe('handleMessage - marker.match', () => {
    it('should call markerFlashService.flash with color from link markers', () => {
      const link = createMockLink('l-1');
      link.markers = { 'marker-l1': { bpf: 'arp', color: 'red' } } as any;
      mockLinksDataSource.get = vi.fn().mockReturnValue(link);

      const event = { project_id: 'p-1', node_id: 'n-1', link_id: 'l-1', filter: 'marker-l1', tag: null, ts: 1, len: 64 };
      const message: WebServiceMessage = { action: 'marker.match', event };

      handler.handleMessage(message);

      expect(mockLinksDataSource.get).toHaveBeenCalledWith('l-1');
      expect(mockMarkerFlashService.flash).toHaveBeenCalledWith('l-1', 'red', null, null, 'n-1');
    });

    it('should flash with null when marker has no color', () => {
      const link = createMockLink('l-2');
      link.markers = { 'marker-l2': { bpf: 'arp' } } as any;
      mockLinksDataSource.get = vi.fn().mockReturnValue(link);

      const event = { project_id: 'p-1', node_id: 'n-1', link_id: 'l-2', filter: 'marker-l2', tag: null, ts: 1, len: 64 };
      const message: WebServiceMessage = { action: 'marker.match', event };

      handler.handleMessage(message);

      expect(mockMarkerFlashService.flash).toHaveBeenCalledWith('l-2', null, null, null, 'n-1');
    });

    it('should pass the marker highlight_duration to flash', () => {
      const link = createMockLink('l-3');
      link.markers = { 'marker-l3': { bpf: 'icmp', highlight_duration: 1200 } } as any;
      mockLinksDataSource.get = vi.fn().mockReturnValue(link);

      const event = { project_id: 'p-1', node_id: 'n-1', link_id: 'l-3', filter: 'marker-l3', tag: null, ts: 1, len: 64 };
      const message: WebServiceMessage = { action: 'marker.match', event };

      handler.handleMessage(message);

      expect(mockMarkerFlashService.flash).toHaveBeenCalledWith('l-3', null, 1200, null, 'n-1');
    });

    it('should pass dir + node_id to flash for the direction arrow', () => {
      const link = createMockLink('l-4');
      link.markers = { 'marker-l4': { bpf: 'tcp' } } as any;
      mockLinksDataSource.get = vi.fn().mockReturnValue(link);

      const event = {
        project_id: 'p-1',
        node_id: 'n-4',
        link_id: 'l-4',
        filter: 'marker-l4',
        tag: null,
        ts: 1,
        len: 64,
        dir: 'rx',
      };
      const message: WebServiceMessage = { action: 'marker.match', event };

      handler.handleMessage(message);

      expect(mockMarkerFlashService.flash).toHaveBeenCalledWith('l-4', null, null, 'rx', 'n-4');
    });

    it('should pass null dir when the event omits it (legacy uBridge)', () => {
      const link = createMockLink('l-5');
      link.markers = { 'marker-l5': { bpf: 'tcp' } } as any;
      mockLinksDataSource.get = vi.fn().mockReturnValue(link);

      const event = {
        project_id: 'p-1',
        node_id: 'n-5',
        link_id: 'l-5',
        filter: 'marker-l5',
        tag: null,
        ts: 1,
        len: 64,
      };
      const message: WebServiceMessage = { action: 'marker.match', event };

      handler.handleMessage(message);

      expect(mockMarkerFlashService.flash).toHaveBeenCalledWith('l-5', null, null, null, 'n-5');
    });
  });

  describe('handleMessage - marker registry reconcile on link events', () => {
    it('should call reconcileLink on link.created', () => {
      const link = createMockLink('link-1');
      const message: WebServiceMessage = { action: 'link.created', event: link };

      handler.handleMessage(message);

      expect(mockMarkerRegistryService.reconcileLink).toHaveBeenCalledWith(link);
    });

    it('should call reconcileLink on link.updated', () => {
      const link = createMockLink('link-2');
      const message: WebServiceMessage = { action: 'link.updated', event: link };

      handler.handleMessage(message);

      expect(mockMarkerRegistryService.reconcileLink).toHaveBeenCalledWith(link);
    });

    it('should call removeLink on link.deleted', () => {
      const link = createMockLink('link-3');
      const message: WebServiceMessage = { action: 'link.deleted', event: link };

      handler.handleMessage(message);

      expect(mockMarkerRegistryService.removeLink).toHaveBeenCalledWith(link.link_id);
    });
  });
});
