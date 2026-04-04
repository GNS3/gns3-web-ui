import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Observable, of, throwError } from 'rxjs';
import { LinkService } from './link.service';
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

    it('should handle HTTP error', () => {
      mockHttpController.post.mockReturnValue(throwError(() => new Error('Network error')));

      service
        .createLink(mockController, mockSourceNode, mockSourcePort, mockTargetNode, mockTargetPort, 10, 20, 30, 40)
        .subscribe({
          error: (err) => expect(err.message).toBe('Network error'),
        });
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

      expect(mockHttpController.get).toHaveBeenCalledWith(mockController, '/projects/project-456/links/link-123');
    });

    it('should handle HTTP error', () => {
      mockHttpController.get.mockReturnValue(throwError(() => new Error('Network error')));

      service.getLink(mockController, 'project-456', 'link-123').subscribe({
        error: (err) => expect(err.message).toBe('Network error'),
      });
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

    it('should handle HTTP error', () => {
      mockHttpController.delete.mockReturnValue(throwError(() => new Error('Network error')));

      const mockLink = { link_id: 'link-1', project_id: 'project-1' } as unknown as Link;

      service.deleteLink(mockController, mockLink).subscribe({
        error: (err) => expect(err.message).toBe('Network error'),
      });
    });
  });

  describe('updateLink', () => {
    it.each([
      {
        description: 'should include nodes in payload when defined',
        field: 'nodes',
        value: [
          {
            node_id: 'node-1',
            port_number: 0,
            adapter_number: 0,
            label: { rotation: 0, style: 'style', text: 'text', x: 10, y: 20 },
          },
        ],
      },
      {
        description: 'should include filters in payload when defined',
        field: 'filters',
        value: { ethernet0: { protocol: 'ethernet' } },
      },
      {
        description: 'should include suspend in payload when defined',
        field: 'suspend',
        value: true,
      },
    ])('$description', ({ field, value }) => {
      const mockLink = {
        link_id: 'link-1',
        project_id: 'project-1',
        [field]: value,
      } as unknown as Link;

      mockHttpController.put.mockReturnValue(of(mockLink));

      service.updateLink(mockController, mockLink);

      const putCall = mockHttpController.put.mock.calls[0];
      const payload = putCall[2];

      expect(payload[field]).toEqual(value);
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

    it('should handle HTTP error', () => {
      mockHttpController.put.mockReturnValue(throwError(() => new Error('Network error')));

      const mockLink = { link_id: 'link-1', project_id: 'project-1' } as unknown as Link;

      service.updateLink(mockController, mockLink).subscribe({
        error: (err) => expect(err.message).toBe('Network error'),
      });
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

      expect(mockHttpController.put).toHaveBeenCalledWith(mockController, '/projects/project-style/links/link-style', {
        link_style: 'manhattan',
      });
    });

    it('should handle HTTP error', () => {
      mockHttpController.put.mockReturnValue(throwError(() => new Error('Network error')));

      const mockLink = { link_id: 'link-1', project_id: 'project-1' } as unknown as Link;

      service.updateLinkStyle(mockController, mockLink).subscribe({
        error: (err) => expect(err.message).toBe('Network error'),
      });
    });
  });

  describe('getAvailableFilters', () => {
    it('should call httpController.get with correct endpoint', () => {
      const mockLink: Link = {
        link_id: 'link-1',
        project_id: 'project-1',
      } as unknown as Link;

      const mockFilters: FilterDescription[] = [{ type: 'ethernet', name: 'Ethernet Filter' } as FilterDescription];

      mockHttpController.get.mockReturnValue(of(mockFilters));

      service.getAvailableFilters(mockController, mockLink);

      expect(mockHttpController.get).toHaveBeenCalledWith(
        mockController,
        '/projects/project-1/links/link-1/available_filters'
      );
    });

    it('should handle empty filters list', () => {
      const mockLink: Link = {
        link_id: 'link-3',
        project_id: 'project-3',
      } as unknown as Link;

      mockHttpController.get.mockReturnValue(of([]));

      service.getAvailableFilters(mockController, mockLink);

      expect(mockHttpController.get).toHaveBeenCalled();
    });

    it('should handle HTTP error', () => {
      mockHttpController.get.mockReturnValue(throwError(() => new Error('Network error')));

      const mockLink = { link_id: 'link-1', project_id: 'project-1' } as unknown as Link;

      service.getAvailableFilters(mockController, mockLink).subscribe({
        error: (err) => expect(err.message).toBe('Network error'),
      });
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

    it('should handle HTTP error', () => {
      mockHttpController.put.mockReturnValue(throwError(() => new Error('Network error')));

      const mockLink = { link_id: 'link-1', project_id: 'project-1' } as unknown as Link;

      service.updateNodes(mockController, mockLink, []).subscribe({
        error: (err) => expect(err.message).toBe('Network error'),
      });
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

    it('should handle HTTP error', () => {
      mockHttpController.post.mockReturnValue(throwError(() => new Error('Network error')));

      const mockLink = { link_id: 'link-1', project_id: 'project-1' } as unknown as Link;
      const mockSettings = {} as CapturingSettings;

      service.startCaptureOnLink(mockController, mockLink, mockSettings).subscribe({
        error: (err) => expect(err.message).toBe('Network error'),
      });
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

    it('should handle HTTP error', () => {
      mockHttpController.post.mockReturnValue(throwError(() => new Error('Network error')));

      const mockLink = { link_id: 'link-1', project_id: 'project-1' } as unknown as Link;

      service.stopCaptureOnLink(mockController, mockLink).subscribe({
        error: (err) => expect(err.message).toBe('Network error'),
      });
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

    it('should handle HTTP error', () => {
      mockHttpController.post.mockReturnValue(throwError(() => new Error('Network error')));

      const mockLink = { link_id: 'link-1', project_id: 'project-1' } as unknown as Link;

      service.resetLink(mockController, mockLink).subscribe({
        error: (err) => expect(err.message).toBe('Network error'),
      });
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

    it('should handle HTTP error', () => {
      mockHttpController.get.mockReturnValue(throwError(() => new Error('Network error')));

      const mockLink = { link_id: 'link-1', project_id: 'project-1' } as unknown as Link;

      service.streamPcap(mockController, mockLink).subscribe({
        error: (err) => expect(err.message).toBe('Network error'),
      });
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

      expect(mockHttpController.get).toHaveBeenCalledWith(mockController, '/projects/project-with-dash/links/link-1');
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
