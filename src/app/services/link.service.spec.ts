import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LinkService } from './link.service';
import { HttpController } from './http-controller.service';
import { Observable, of } from 'rxjs';
import { Controller } from '@models/controller';
import { Node } from '../cartography/models/node';
import { Port } from '@models/port';
import { Link } from '@models/link';
import { LinkNode } from '@models/link-node';
import { CapturingSettings } from '@models/capturingSettings';
import { FilterDescription } from '@models/filter-description';

describe('LinkService', () => {
  let service: LinkService;
  let mockHttpController: any;
  let mockController: Controller;

  beforeEach(() => {
    // Mock HttpController
    mockHttpController = {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
    };

    // Mock Controller
    mockController = {
      id: 1,
      authToken: '',
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

    service = new LinkService(mockHttpController);
  });

  describe('Service Creation', () => {
    it('should create the service', () => {
      expect(service).toBeTruthy();
    });

    it('should be created with HttpController', () => {
      expect(service).toBeInstanceOf(LinkService);
    });
  });

  describe('createLink', () => {
    let mockSourceNode: Node;
    let mockTargetNode: Node;
    let mockSourcePort: Port;
    let mockTargetPort: Port;

    beforeEach(() => {
      mockSourceNode = {
        node_id: 'node-1',
        project_id: 'project-123',
        name: 'Source Node',
        node_type: 'vpcs',
        x: 100,
        y: 200,
        z: 0,
        locked: false,
        ports: [],
        link_type: 'ethernet',
      } as unknown as Node;

      mockTargetNode = {
        node_id: 'node-2',
        project_id: 'project-123',
        name: 'Target Node',
        node_type: 'vpcs',
        x: 300,
        y: 400,
        z: 0,
        locked: false,
        ports: [],
        link_type: 'ethernet',
      } as unknown as Node;

      mockSourcePort = {
        port_number: 0,
        adapter_number: 0,
        short_name: 'Ethernet0',
        name: 'Ethernet0',
        link_type: 'ethernet',
        data_link_types: ['ethernet'],
      } as unknown as Port;

      mockTargetPort = {
        port_number: 0,
        adapter_number: 0,
        short_name: 'Ethernet0',
        name: 'Ethernet0',
        link_type: 'ethernet',
        data_link_types: ['ethernet'],
      } as unknown as Port;
    });

    it('should call httpController.post with correct endpoint', () => {
      mockHttpController.post.mockReturnValue(of({}));

      service.createLink(
        mockController,
        mockSourceNode,
        mockSourcePort,
        mockTargetNode,
        mockTargetPort,
        10,
        20,
        30,
        40
      );

      expect(mockHttpController.post).toHaveBeenCalledWith(
        mockController,
        '/projects/project-123/links',
        expect.any(Object)
      );
    });

    it('should include source node in payload', () => {
      mockHttpController.post.mockReturnValue(of({}));

      service.createLink(
        mockController,
        mockSourceNode,
        mockSourcePort,
        mockTargetNode,
        mockTargetPort,
        10,
        20,
        30,
        40
      );

      const postCall = mockHttpController.post.mock.calls[0];
      const payload = postCall[2];

      expect(payload.nodes[0].node_id).toBe('node-1');
      expect(payload.nodes[0].port_number).toBe(0);
      expect(payload.nodes[0].adapter_number).toBe(0);
    });

    it('should include target node in payload', () => {
      mockHttpController.post.mockReturnValue(of({}));

      service.createLink(
        mockController,
        mockSourceNode,
        mockSourcePort,
        mockTargetNode,
        mockTargetPort,
        10,
        20,
        30,
        40
      );

      const postCall = mockHttpController.post.mock.calls[0];
      const payload = postCall[2];

      expect(payload.nodes[1].node_id).toBe('node-2');
      expect(payload.nodes[1].port_number).toBe(0);
      expect(payload.nodes[1].adapter_number).toBe(0);
    });

    it('should include label positions in payload', () => {
      mockHttpController.post.mockReturnValue(of({}));

      service.createLink(
        mockController,
        mockSourceNode,
        mockSourcePort,
        mockTargetNode,
        mockTargetPort,
        15,
        25,
        35,
        45
      );

      const postCall = mockHttpController.post.mock.calls[0];
      const payload = postCall[2];

      expect(payload.nodes[0].label.x).toBe(15);
      expect(payload.nodes[0].label.y).toBe(25);
      expect(payload.nodes[1].label.x).toBe(35);
      expect(payload.nodes[1].label.y).toBe(45);
    });

    it('should include port short names in labels', () => {
      mockHttpController.post.mockReturnValue(of({}));

      service.createLink(
        mockController,
        mockSourceNode,
        mockSourcePort,
        mockTargetNode,
        mockTargetPort,
        10,
        20,
        30,
        40
      );

      const postCall = mockHttpController.post.mock.calls[0];
      const payload = postCall[2];

      expect(payload.nodes[0].label.text).toBe('Ethernet0');
      expect(payload.nodes[1].label.text).toBe('Ethernet0');
    });

    it('should return Observable from httpController', () => {
      mockHttpController.post.mockReturnValue(of({ link_id: 'link-1' }));

      const result = service.createLink(
        mockController,
        mockSourceNode,
        mockSourcePort,
        mockTargetNode,
        mockTargetPort,
        10,
        20,
        30,
        40
      );

      expect(result).toBeInstanceOf(Observable);
    });
  });

  describe('getLink', () => {
    it('should call httpController.get with correct endpoint', () => {
      const mockLink: Link = {
        link_id: 'link-123',
        project_id: 'project-456',
      } as unknown as Link;

      mockHttpController.get.mockReturnValue(of(mockLink));

      service.getLink(mockController, 'project-456', 'link-123');

      expect(mockHttpController.get).toHaveBeenCalledWith(
        mockController,
        '/projects/project-456/links/link-123'
      );
    });

    it('should return Observable from httpController', () => {
      const mockLink: Link = {
        link_id: 'link-789',
        project_id: 'project-101',
      } as unknown as Link;

      mockHttpController.get.mockReturnValue(of(mockLink));

      const result = service.getLink(mockController, 'project-101', 'link-789');

      expect(result).toBeInstanceOf(Observable);
    });

    it('should include project_id and link_id in URL', () => {
      mockHttpController.get.mockReturnValue(of({}));

      service.getLink(mockController, 'my-project', 'my-link');

      expect(mockHttpController.get).toHaveBeenCalledWith(
        mockController,
        '/projects/my-project/links/my-link'
      );
    });
  });

  describe('deleteLink', () => {
    it('should call httpController.delete with correct endpoint', () => {
      const mockLink: Link = {
        link_id: 'link-delete',
        project_id: 'project-delete',
      } as unknown as Link;

      mockHttpController.delete.mockReturnValue(of({}));

      service.deleteLink(mockController, mockLink);

      expect(mockHttpController.delete).toHaveBeenCalledWith(
        mockController,
        '/projects/project-delete/links/link-delete'
      );
    });

    it('should return Observable from httpController', () => {
      const mockLink: Link = {
        link_id: 'link-1',
        project_id: 'project-1',
      } as unknown as Link;

      mockHttpController.delete.mockReturnValue(of({}));

      const result = service.deleteLink(mockController, mockLink);

      expect(result).toBeInstanceOf(Observable);
    });

    it('should construct URL from link object', () => {
      const mockLink: Link = {
        link_id: 'link-to-delete',
        project_id: 'proj-123',
      } as unknown as Link;

      mockHttpController.delete.mockReturnValue(of({}));

      service.deleteLink(mockController, mockLink);

      expect(mockHttpController.delete).toHaveBeenCalledWith(
        mockController,
        '/projects/proj-123/links/link-to-delete'
      );
    });
  });

  describe('updateLink', () => {
    it('should include nodes in payload when defined', () => {
      const mockLink: Link = {
        link_id: 'link-1',
        project_id: 'project-1',
        nodes: [
          {
            node_id: 'node-1',
            port_number: 0,
            adapter_number: 0,
            label: { rotation: 0, style: 'style', text: 'text', x: 10, y: 20 },
          },
        ],
      } as unknown as Link;

      mockHttpController.put.mockReturnValue(of(mockLink));

      service.updateLink(mockController, mockLink);

      const putCall = mockHttpController.put.mock.calls[0];
      const payload = putCall[2];

      expect(payload.nodes).toBeDefined();
      expect(payload.nodes).toEqual(mockLink.nodes);
    });

    it('should include filters in payload when defined', () => {
      const mockLink: Link = {
        link_id: 'link-2',
        project_id: 'project-2',
        filters: {
          'ethernet0': {
            protocol: 'ethernet',
          },
        },
      } as unknown as Link;

      mockHttpController.put.mockReturnValue(of(mockLink));

      service.updateLink(mockController, mockLink);

      const putCall = mockHttpController.put.mock.calls[0];
      const payload = putCall[2];

      expect(payload.filters).toBeDefined();
      expect(payload.filters).toEqual(mockLink.filters);
    });

    it('should include suspend in payload when defined', () => {
      const mockLink: Link = {
        link_id: 'link-3',
        project_id: 'project-3',
        suspend: true,
      } as unknown as Link;

      mockHttpController.put.mockReturnValue(of(mockLink));

      service.updateLink(mockController, mockLink);

      const putCall = mockHttpController.put.mock.calls[0];
      const payload = putCall[2];

      expect(payload.suspend).toBe(true);
    });

    it('should include all defined properties in payload', () => {
      const mockLink: Link = {
        link_id: 'link-4',
        project_id: 'project-4',
        nodes: [],
        filters: {},
        suspend: false,
      } as unknown as Link;

      mockHttpController.put.mockReturnValue(of(mockLink));

      service.updateLink(mockController, mockLink);

      const putCall = mockHttpController.put.mock.calls[0];
      const payload = putCall[2];

      expect(payload.nodes).toBeDefined();
      expect(payload.filters).toBeDefined();
      expect(payload.suspend).toBeDefined();
    });

    it('should handle link with no optional properties', () => {
      const mockLink: Link = {
        link_id: 'link-5',
        project_id: 'project-5',
      } as unknown as Link;

      mockHttpController.put.mockReturnValue(of(mockLink));

      service.updateLink(mockController, mockLink);

      const putCall = mockHttpController.put.mock.calls[0];
      const payload = putCall[2];

      expect(payload).toEqual({});
    });

    it('should call correct endpoint', () => {
      const mockLink: Link = {
        link_id: 'link-update',
        project_id: 'project-update',
      } as unknown as Link;

      mockHttpController.put.mockReturnValue(of(mockLink));

      service.updateLink(mockController, mockLink);

      expect(mockHttpController.put).toHaveBeenCalledWith(
        mockController,
        '/projects/project-update/links/link-update',
        expect.any(Object)
      );
    });
  });

  describe('updateLinkStyle', () => {
    it('should call httpController.put with link_style in payload', () => {
      const mockLink: Link = {
        link_id: 'link-1',
        project_id: 'project-1',
        link_style: 'elastic',
      } as unknown as Link;

      mockHttpController.put.mockReturnValue(of(mockLink));

      service.updateLinkStyle(mockController, mockLink);

      const putCall = mockHttpController.put.mock.calls[0];
      const payload = putCall[2];

      expect(payload.link_style).toBe('elastic');
    });

    it('should call correct endpoint', () => {
      const mockLink: Link = {
        link_id: 'link-style',
        project_id: 'project-style',
        link_style: 'manhattan',
      } as unknown as Link;

      mockHttpController.put.mockReturnValue(of(mockLink));

      service.updateLinkStyle(mockController, mockLink);

      expect(mockHttpController.put).toHaveBeenCalledWith(
        mockController,
        '/projects/project-style/links/link-style',
        { link_style: 'manhattan' }
      );
    });

    it('should return Observable from httpController', () => {
      const mockLink: Link = {
        link_id: 'link-1',
        project_id: 'project-1',
        link_style: 'linear',
      } as unknown as Link;

      mockHttpController.put.mockReturnValue(of(mockLink));

      const result = service.updateLinkStyle(mockController, mockLink);

      expect(result).toBeInstanceOf(Observable);
    });
  });

  describe('getAvailableFilters', () => {
    it('should call httpController.get with correct endpoint', () => {
      const mockLink: Link = {
        link_id: 'link-1',
        project_id: 'project-1',
      } as unknown as Link;

      const mockFilters: FilterDescription[] = [
        { type: 'ethernet', name: 'Ethernet Filter' } as FilterDescription,
      ];

      mockHttpController.get.mockReturnValue(of(mockFilters));

      service.getAvailableFilters(mockController, mockLink);

      expect(mockHttpController.get).toHaveBeenCalledWith(
        mockController,
        '/projects/project-1/links/link-1/available_filters'
      );
    });

    it('should return Observable of FilterDescription array', () => {
      const mockLink: Link = {
        link_id: 'link-2',
        project_id: 'project-2',
      } as unknown as Link;

      const mockFilters: FilterDescription[] = [
        { type: 'udp', name: 'UDP Filter' } as FilterDescription,
      ];

      mockHttpController.get.mockReturnValue(of(mockFilters));

      const result = service.getAvailableFilters(mockController, mockLink);

      expect(result).toBeInstanceOf(Observable);
    });

    it('should handle empty filters list', () => {
      const mockLink: Link = {
        link_id: 'link-3',
        project_id: 'project-3',
      } as unknown as Link;

      mockHttpController.get.mockReturnValue(of([]));

      const result = service.getAvailableFilters(mockController, mockLink);

      expect(result).toBeInstanceOf(Observable);
    });
  });

  describe('updateNodes', () => {
    it('should call httpController.put with correct endpoint', () => {
      const mockLink: Link = {
        link_id: 'link-1',
        project_id: 'project-1',
      } as unknown as Link;

      const mockNodes: LinkNode[] = [
        {
          node_id: 'node-1',
          port_number: 0,
          adapter_number: 0,
          label: { rotation: 0, style: 'style', text: 'text', x: 10, y: 20 },
        },
      ] as LinkNode[];

      mockHttpController.put.mockReturnValue(of({}));

      service.updateNodes(mockController, mockLink, mockNodes);

      expect(mockHttpController.put).toHaveBeenCalledWith(
        mockController,
        '/projects/project-1/links/link-1',
        expect.any(Object)
      );
    });

    it('should map nodes correctly', () => {
      const mockLink: Link = {
        link_id: 'link-2',
        project_id: 'project-2',
      } as unknown as Link;

      const mockNodes: LinkNode[] = [
        {
          node_id: 'node-abc',
          port_number: 1,
          adapter_number: 2,
          label: { rotation: 90, style: 'font-size: 12', text: 'Label', x: 100, y: 200 },
        },
      ] as LinkNode[];

      mockHttpController.put.mockReturnValue(of({}));

      service.updateNodes(mockController, mockLink, mockNodes);

      const putCall = mockHttpController.put.mock.calls[0];
      const payload = putCall[2];

      expect(payload.nodes[0].node_id).toBe('node-abc');
      expect(payload.nodes[0].port_number).toBe(1);
      expect(payload.nodes[0].adapter_number).toBe(2);
      expect(payload.nodes[0].label.rotation).toBe(90);
      expect(payload.nodes[0].label.style).toBe('font-size: 12');
      expect(payload.nodes[0].label.text).toBe('Label');
      expect(payload.nodes[0].label.x).toBe(100);
      expect(payload.nodes[0].label.y).toBe(200);
    });

    it('should return Observable from httpController', () => {
      const mockLink: Link = {
        link_id: 'link-3',
        project_id: 'project-3',
      } as unknown as Link;

      const mockNodes: LinkNode[] = [] as LinkNode[];

      mockHttpController.put.mockReturnValue(of({}));

      const result = service.updateNodes(mockController, mockLink, mockNodes);

      expect(result).toBeInstanceOf(Observable);
    });

    it('should handle multiple nodes', () => {
      const mockLink: Link = {
        link_id: 'link-4',
        project_id: 'project-4',
      } as unknown as Link;

      const mockNodes: LinkNode[] = [
        {
          node_id: 'node-1',
          port_number: 0,
          adapter_number: 0,
          label: { rotation: 0, style: 'style1', text: 'text1', x: 10, y: 20 },
        },
        {
          node_id: 'node-2',
          port_number: 0,
          adapter_number: 0,
          label: { rotation: 0, style: 'style2', text: 'text2', x: 30, y: 40 },
        },
      ] as LinkNode[];

      mockHttpController.put.mockReturnValue(of({}));

      service.updateNodes(mockController, mockLink, mockNodes);

      const putCall = mockHttpController.put.mock.calls[0];
      const payload = putCall[2];

      expect(payload.nodes.length).toBe(2);
    });
  });

  describe('startCaptureOnLink', () => {
    it('should call httpController.post with correct endpoint', () => {
      const mockLink: Link = {
        link_id: 'link-1',
        project_id: 'project-1',
      } as unknown as Link;

      const mockSettings: CapturingSettings = {
        capture_file_name: 'test.pcap',
        data_link_type: 'ethernet',
      } as CapturingSettings;

      mockHttpController.post.mockReturnValue(of({}));

      service.startCaptureOnLink(mockController, mockLink, mockSettings);

      expect(mockHttpController.post).toHaveBeenCalledWith(
        mockController,
        '/projects/project-1/links/link-1/capture/start',
        mockSettings
      );
    });

    it('should include capture settings in payload', () => {
      const mockLink: Link = {
        link_id: 'link-2',
        project_id: 'project-2',
      } as unknown as Link;

      const mockSettings: CapturingSettings = {
        capture_file_name: 'capture-test.pcap',
        data_link_type: 'ethernet',
      } as CapturingSettings;

      mockHttpController.post.mockReturnValue(of({}));

      service.startCaptureOnLink(mockController, mockLink, mockSettings);

      const postCall = mockHttpController.post.mock.calls[0];
      expect(postCall[2]).toEqual(mockSettings);
    });

    it('should return Observable from httpController', () => {
      const mockLink: Link = {
        link_id: 'link-3',
        project_id: 'project-3',
      } as unknown as Link;

      const mockSettings: CapturingSettings = {} as CapturingSettings;

      mockHttpController.post.mockReturnValue(of({}));

      const result = service.startCaptureOnLink(mockController, mockLink, mockSettings);

      expect(result).toBeInstanceOf(Observable);
    });
  });

  describe('stopCaptureOnLink', () => {
    it('should call httpController.post with correct endpoint', () => {
      const mockLink: Link = {
        link_id: 'link-1',
        project_id: 'project-1',
      } as unknown as Link;

      mockHttpController.post.mockReturnValue(of({}));

      service.stopCaptureOnLink(mockController, mockLink);

      expect(mockHttpController.post).toHaveBeenCalledWith(
        mockController,
        '/projects/project-1/links/link-1/capture/stop',
        {}
      );
    });

    it('should pass empty body', () => {
      const mockLink: Link = {
        link_id: 'link-2',
        project_id: 'project-2',
      } as unknown as Link;

      mockHttpController.post.mockReturnValue(of({}));

      service.stopCaptureOnLink(mockController, mockLink);

      const postCall = mockHttpController.post.mock.calls[0];
      expect(postCall[2]).toEqual({});
    });

    it('should return Observable from httpController', () => {
      const mockLink: Link = {
        link_id: 'link-3',
        project_id: 'project-3',
      } as unknown as Link;

      mockHttpController.post.mockReturnValue(of({}));

      const result = service.stopCaptureOnLink(mockController, mockLink);

      expect(result).toBeInstanceOf(Observable);
    });
  });

  describe('resetLink', () => {
    it('should call httpController.post with correct endpoint', () => {
      const mockLink: Link = {
        link_id: 'link-1',
        project_id: 'project-1',
      } as unknown as Link;

      mockHttpController.post.mockReturnValue(of({}));

      service.resetLink(mockController, mockLink);

      expect(mockHttpController.post).toHaveBeenCalledWith(
        mockController,
        '/projects/project-1/links/link-1/reset',
        {}
      );
    });

    it('should pass empty body', () => {
      const mockLink: Link = {
        link_id: 'link-2',
        project_id: 'project-2',
      } as unknown as Link;

      mockHttpController.post.mockReturnValue(of({}));

      service.resetLink(mockController, mockLink);

      const postCall = mockHttpController.post.mock.calls[0];
      expect(postCall[2]).toEqual({});
    });

    it('should return Observable from httpController', () => {
      const mockLink: Link = {
        link_id: 'link-3',
        project_id: 'project-3',
      } as unknown as Link;

      mockHttpController.post.mockReturnValue(of({}));

      const result = service.resetLink(mockController, mockLink);

      expect(result).toBeInstanceOf(Observable);
    });
  });

  describe('streamPcap', () => {
    it('should call httpController.get with correct endpoint', () => {
      const mockLink: Link = {
        link_id: 'link-1',
        project_id: 'project-1',
      } as unknown as Link;

      mockHttpController.get.mockReturnValue(of({}));

      service.streamPcap(mockController, mockLink);

      expect(mockHttpController.get).toHaveBeenCalledWith(
        mockController,
        '/projects/project-1/links/link-1/capture/stream'
      );
    });

    it('should return Observable from httpController', () => {
      const mockLink: Link = {
        link_id: 'link-2',
        project_id: 'project-2',
      } as unknown as Link;

      mockHttpController.get.mockReturnValue(of({}));

      const result = service.streamPcap(mockController, mockLink);

      expect(result).toBeInstanceOf(Observable);
    });

    it('should include project_id and link_id in URL', () => {
      const mockLink: Link = {
        link_id: 'pcap-link',
        project_id: 'pcap-project',
      } as unknown as Link;

      mockHttpController.get.mockReturnValue(of({}));

      service.streamPcap(mockController, mockLink);

      expect(mockHttpController.get).toHaveBeenCalledWith(
        mockController,
        '/projects/pcap-project/links/pcap-link/capture/stream'
      );
    });
  });

  describe('URL Construction', () => {
    it('should construct correct URL for different project IDs', () => {
      const mockLink: Link = {
        link_id: 'link-1',
        project_id: 'proj-alpha',
      } as unknown as Link;

      mockHttpController.get.mockReturnValue(of({}));

      service.getLink(mockController, 'proj-alpha', 'link-1');
      service.getLink(mockController, 'proj-beta', 'link-2');
      service.getLink(mockController, 'proj-gamma', 'link-3');

      expect(mockHttpController.get).toHaveBeenCalledTimes(3);
      expect(mockHttpController.get).toHaveBeenNthCalledWith(1, mockController, '/projects/proj-alpha/links/link-1');
      expect(mockHttpController.get).toHaveBeenNthCalledWith(2, mockController, '/projects/proj-beta/links/link-2');
      expect(mockHttpController.get).toHaveBeenNthCalledWith(3, mockController, '/projects/proj-gamma/links/link-3');
    });
  });

  describe('Edge Cases', () => {
    it('should handle special characters in project_id', () => {
      const mockLink: Link = {
        link_id: 'link-1',
        project_id: 'project-with-dash',
      } as unknown as Link;

      mockHttpController.get.mockReturnValue(of({}));

      service.getLink(mockController, 'project-with-dash', 'link-1');

      expect(mockHttpController.get).toHaveBeenCalledWith(
        mockController,
        '/projects/project-with-dash/links/link-1'
      );
    });

    it('should handle special characters in link_id', () => {
      const mockLink: Link = {
        link_id: 'link-with_underscore',
        project_id: 'project-1',
      } as unknown as Link;

      mockHttpController.get.mockReturnValue(of({}));

      service.getLink(mockController, 'project-1', 'link-with_underscore');

      expect(mockHttpController.get).toHaveBeenCalledWith(
        mockController,
        '/projects/project-1/links/link-with_underscore'
      );
    });

    it('should handle empty nodes array in updateNodes', () => {
      const mockLink: Link = {
        link_id: 'link-1',
        project_id: 'project-1',
      } as unknown as Link;

      mockHttpController.put.mockReturnValue(of({}));

      service.updateNodes(mockController, mockLink, []);

      const putCall = mockHttpController.put.mock.calls[0];
      const payload = putCall[2];

      expect(payload.nodes).toEqual([]);
    });

    it('should handle null link_style', () => {
      const mockLink: Link = {
        link_id: 'link-1',
        project_id: 'project-1',
        link_style: null as any,
      } as unknown as Link;

      mockHttpController.put.mockReturnValue(of({}));

      service.updateLinkStyle(mockController, mockLink);

      const putCall = mockHttpController.put.mock.calls[0];
      const payload = putCall[2];

      expect(payload.link_style).toBeNull();
    });
  });
});
