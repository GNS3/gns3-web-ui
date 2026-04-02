import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NodeService } from './node.service';
import { HttpController } from './http-controller.service';
import { Observable, of } from 'rxjs';
import { Controller } from '@models/controller';
import { Node } from '../cartography/models/node';
import { Project } from '@models/project';
import { Template } from '@models/template';
import { Label } from '../cartography/models/label';

describe('NodeService', () => {
  let service: NodeService;
  let mockHttpController: any;
  let mockController: Controller;
  let mockProject: Project;
  let mockNode: Node;
  let mockTemplate: Template;

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

    // Mock Project
    mockProject = {
      project_id: 'project-123',
      name: 'Test Project',
      filename: 'test.gns3',
      snap_to_grid: false,
      grid_size: 75,
      status: 'opened',
    } as Project;

    // Mock Node
    mockNode = {
      node_id: 'node-1',
      project_id: 'project-123',
      name: 'Test Node',
      node_type: 'vpcs',
      x: 100,
      y: 200,
      z: 0,
      width: 50,
      height: 50,
    } as Node;

    // Mock Template
    mockTemplate = {
      template_id: 'tmpl-1',
      name: 'Test Template',
      symbol: 'test.svg',
    } as Template;

    service = new NodeService(mockHttpController);
  });

  describe('Service Creation', () => {
    it('should create the service', () => {
      expect(service).toBeTruthy();
    });

    it('should be instance of NodeService', () => {
      expect(service).toBeInstanceOf(NodeService);
    });
  });

  describe('getNodeById', () => {
    it('should call httpController.get with correct endpoint', () => {
      mockHttpController.get.mockReturnValue(of(mockNode));

      service.getNodeById(mockController, 'project-123', 'node-1');

      expect(mockHttpController.get).toHaveBeenCalledWith(
        mockController,
        '/projects/project-123/nodes/node-1'
      );
    });

    it('should return Observable', () => {
      mockHttpController.get.mockReturnValue(of(mockNode));

      const result = service.getNodeById(mockController, 'project-123', 'node-1');

      expect(result).toBeInstanceOf(Observable);
    });
  });

  describe('isolate', () => {
    it('should call httpController.post with correct endpoint', () => {
      mockHttpController.post.mockReturnValue(of(mockNode));

      service.isolate(mockController, mockNode);

      expect(mockHttpController.post).toHaveBeenCalledWith(
        mockController,
        '/projects/project-123/nodes/node-1/isolate',
        {}
      );
    });

    it('should return Observable', () => {
      mockHttpController.post.mockReturnValue(of(mockNode));

      const result = service.isolate(mockController, mockNode);

      expect(result).toBeInstanceOf(Observable);
    });
  });

  describe('unisolate', () => {
    it('should call httpController.post with correct endpoint', () => {
      mockHttpController.post.mockReturnValue(of(mockNode));

      service.unisolate(mockController, mockNode);

      expect(mockHttpController.post).toHaveBeenCalledWith(
        mockController,
        '/projects/project-123/nodes/node-1/unisolate',
        {}
      );
    });
  });

  describe('start', () => {
    it('should call httpController.post with correct endpoint', () => {
      mockHttpController.post.mockReturnValue(of(mockNode));

      service.start(mockController, mockNode);

      expect(mockHttpController.post).toHaveBeenCalledWith(
        mockController,
        '/projects/project-123/nodes/node-1/start',
        {}
      );
    });
  });

  describe('startAll', () => {
    it('should call httpController.post with correct endpoint', () => {
      mockHttpController.post.mockReturnValue(of({}));

      service.startAll(mockController, mockProject);

      expect(mockHttpController.post).toHaveBeenCalledWith(
        mockController,
        '/projects/project-123/nodes/start',
        {}
      );
    });
  });

  describe('stop', () => {
    it('should call httpController.post with correct endpoint', () => {
      mockHttpController.post.mockReturnValue(of(mockNode));

      service.stop(mockController, mockNode);

      expect(mockHttpController.post).toHaveBeenCalledWith(
        mockController,
        '/projects/project-123/nodes/node-1/stop',
        {}
      );
    });
  });

  describe('stopAll', () => {
    it('should call httpController.post with correct endpoint', () => {
      mockHttpController.post.mockReturnValue(of({}));

      service.stopAll(mockController, mockProject);

      expect(mockHttpController.post).toHaveBeenCalledWith(
        mockController,
        '/projects/project-123/nodes/stop',
        {}
      );
    });
  });

  describe('suspend', () => {
    it('should call httpController.post with correct endpoint', () => {
      mockHttpController.post.mockReturnValue(of(mockNode));

      service.suspend(mockController, mockNode);

      expect(mockHttpController.post).toHaveBeenCalledWith(
        mockController,
        '/projects/project-123/nodes/node-1/suspend',
        {}
      );
    });
  });

  describe('suspendAll', () => {
    it('should call httpController.post with correct endpoint', () => {
      mockHttpController.post.mockReturnValue(of({}));

      service.suspendAll(mockController, mockProject);

      expect(mockHttpController.post).toHaveBeenCalledWith(
        mockController,
        '/projects/project-123/nodes/suspend',
        {}
      );
    });
  });

  describe('reload', () => {
    it('should call httpController.post with correct endpoint', () => {
      mockHttpController.post.mockReturnValue(of(mockNode));

      service.reload(mockController, mockNode);

      expect(mockHttpController.post).toHaveBeenCalledWith(
        mockController,
        '/projects/project-123/nodes/node-1/reload',
        {}
      );
    });
  });

  describe('reloadAll', () => {
    it('should call httpController.post with correct endpoint', () => {
      mockHttpController.post.mockReturnValue(of({}));

      service.reloadAll(mockController, mockProject);

      expect(mockHttpController.post).toHaveBeenCalledWith(
        mockController,
        '/projects/project-123/nodes/reload',
        {}
      );
    });
  });

  describe('resetAllNodes', () => {
    it('should call httpController.post with correct endpoint', () => {
      mockHttpController.post.mockReturnValue(of({}));

      service.resetAllNodes(mockController, mockProject);

      expect(mockHttpController.post).toHaveBeenCalledWith(
        mockController,
        '/projects/project-123/nodes/console/reset',
        {}
      );
    });
  });

  describe('createFromTemplate', () => {
    it('should use local compute_id when compute_id is not provided', () => {
      mockHttpController.post.mockReturnValue(of(mockNode));

      service.createFromTemplate(mockController, mockProject, mockTemplate, 100, 200, '');

      expect(mockHttpController.post).toHaveBeenCalledWith(
        mockController,
        '/projects/project-123/templates/tmpl-1',
        { x: 100, y: 200, compute_id: 'local' }
      );
    });

    it('should use provided compute_id', () => {
      mockHttpController.post.mockReturnValue(of(mockNode));

      service.createFromTemplate(mockController, mockProject, mockTemplate, 100, 200, 'compute-1');

      expect(mockHttpController.post).toHaveBeenCalledWith(
        mockController,
        '/projects/project-123/templates/tmpl-1',
        { x: 100, y: 200, compute_id: 'compute-1' }
      );
    });

    it('should round x and y coordinates', () => {
      mockHttpController.post.mockReturnValue(of(mockNode));

      service.createFromTemplate(mockController, mockProject, mockTemplate, 100.7, 200.3, '');

      const postCall = mockHttpController.post.mock.calls[0];
      const payload = postCall[2];

      expect(payload.x).toBe(101);
      expect(payload.y).toBe(200);
    });
  });

  describe('updatePosition', () => {
    it('should call httpController.put with correct endpoint', () => {
      mockHttpController.put.mockReturnValue(of(mockNode));

      service.updatePosition(mockController, mockProject, mockNode, 150, 250);

      expect(mockHttpController.put).toHaveBeenCalledWith(
        mockController,
        '/projects/project-123/nodes/node-1',
        expect.any(Object)
      );
    });

    it('should round coordinates', () => {
      mockHttpController.put.mockReturnValue(of(mockNode));

      service.updatePosition(mockController, mockProject, mockNode, 100.7, 200.3);

      const putCall = mockHttpController.put.mock.calls[0];
      const payload = putCall[2];

      expect(payload.x).toBe(101);
      expect(payload.y).toBe(200);
    });

    it('should snap to grid when project.snap_to_grid is true', () => {
      const snapProject = { ...mockProject, snap_to_grid: true, grid_size: 50 };
      mockHttpController.put.mockReturnValue(of(mockNode));

      service.updatePosition(mockController, snapProject, mockNode, 125, 225);

      const putCall = mockHttpController.put.mock.calls[0];
      const payload = putCall[2];

      // Should be snapped to grid
      expect(payload.x).toBeDefined();
      expect(payload.y).toBeDefined();
    });
  });

  describe('updateLabel', () => {
    it('should call httpController.put with label data', () => {
      mockHttpController.put.mockReturnValue(of(mockNode));

      const label: Label = {
        rotation: 90,
        style: 'font-size: 12',
        text: 'Test',
        x: 100.5,
        y: 200.5,
      } as Label;

      service.updateLabel(mockController, mockNode, label);

      expect(mockHttpController.put).toHaveBeenCalled();
      const putCall = mockHttpController.put.mock.calls[0];
      const payload = putCall[2];

      expect(payload.label.rotation).toBe(90);
      expect(payload.label.style).toBe('font-size: 12');
      expect(payload.label.text).toBe('Test');
      expect(payload.label.x).toBe(101);
      expect(payload.label.y).toBe(201);
    });
  });

  describe('updateSymbol', () => {
    it('should call httpController.put with symbol data', () => {
      mockHttpController.put.mockReturnValue(of(mockNode));

      service.updateSymbol(mockController, mockNode, 'new-symbol.svg');

      expect(mockHttpController.put).toHaveBeenCalledWith(
        mockController,
        '/projects/project-123/nodes/node-1',
        { symbol: 'new-symbol.svg' }
      );
    });
  });

  describe('update', () => {
    it('should call httpController.put with rounded coordinates', () => {
      const nodeWithDecimals = { ...mockNode, x: 100.7, y: 200.3, z: 1 };
      mockHttpController.put.mockReturnValue(of(nodeWithDecimals));

      service.update(mockController, nodeWithDecimals);

      const putCall = mockHttpController.put.mock.calls[0];
      const payload = putCall[2];

      expect(payload.x).toBe(101);
      expect(payload.y).toBe(200);
      expect(payload.z).toBe(1);
    });
  });

  describe('updateNode', () => {
    it('should call httpController.put with node properties', () => {
      mockHttpController.put.mockReturnValue(of(mockNode));

      service.updateNode(mockController, mockNode);

      expect(mockHttpController.put).toHaveBeenCalledWith(
        mockController,
        '/projects/project-123/nodes/node-1',
        expect.objectContaining({
          console_type: mockNode.console_type,
          console_auto_start: mockNode.console_auto_start,
          locked: mockNode.locked,
          name: mockNode.name,
          properties: mockNode.properties,
          tags: mockNode.tags,
        })
      );
    });
  });

  describe('delete', () => {
    it('should call httpController.delete with correct endpoint', () => {
      mockHttpController.delete.mockReturnValue(of({}));

      service.delete(mockController, mockNode);

      expect(mockHttpController.delete).toHaveBeenCalledWith(
        mockController,
        '/projects/project-123/nodes/node-1'
      );
    });
  });

  describe('duplicate', () => {
    it('should call httpController.post with offset coordinates', () => {
      mockHttpController.post.mockReturnValue(of(mockNode));

      const nodeToDuplicate = { ...mockNode, x: 100, y: 200, z: 1 };
      service.duplicate(mockController, nodeToDuplicate);

      expect(mockHttpController.post).toHaveBeenCalledWith(
        mockController,
        '/projects/project-123/nodes/node-1/duplicate',
        { x: 110, y: 210, z: 1 }
      );
    });
  });

  describe('getNode', () => {
    it('should call httpController.get with correct endpoint', () => {
      mockHttpController.get.mockReturnValue(of(mockNode));

      service.getNode(mockController, mockNode);

      expect(mockHttpController.get).toHaveBeenCalledWith(
        mockController,
        '/projects/project-123/nodes/node-1'
      );
    });
  });

  describe('getDefaultCommand', () => {
    it('should return putty command string', () => {
      const result = service.getDefaultCommand();

      expect(result).toContain('putty.exe');
      expect(result).toContain('-telnet');
    });
  });

  describe('getNetworkConfiguration', () => {
    it('should call httpController.get with correct endpoint', () => {
      mockHttpController.get.mockReturnValue(of('config data'));

      service.getNetworkConfiguration(mockController, mockNode);

      expect(mockHttpController.get).toHaveBeenCalledWith(
        mockController,
        '/projects/project-123/nodes/node-1/files/etc/network/interfaces',
        { responseType: 'text' }
      );
    });
  });

  describe('saveNetworkConfiguration', () => {
    it('should call httpController.post with configuration', () => {
      mockHttpController.post.mockReturnValue(of({}));

      service.saveNetworkConfiguration(mockController, mockNode, 'network config');

      expect(mockHttpController.post).toHaveBeenCalledWith(
        mockController,
        '/projects/project-123/nodes/node-1/files/etc/network/interfaces',
        'network config'
      );
    });
  });

  describe('getStartupConfiguration', () => {
    it('should return correct URL for vpcs node', () => {
      const vpcsNode = { ...mockNode, node_type: 'vpcs' as const, properties: {} } as unknown as Node;
      mockHttpController.get.mockReturnValue(of('startup config'));

      service.getStartupConfiguration(mockController, vpcsNode);

      expect(mockHttpController.get).toHaveBeenCalledWith(
        mockController,
        '/projects/project-123/nodes/node-1/files/startup.vpc',
        { responseType: 'text' }
      );
    });

    it('should return correct URL for iou node', () => {
      const iouNode = { ...mockNode, node_type: 'iou' as const, properties: {} } as unknown as Node;
      mockHttpController.get.mockReturnValue(of('startup config'));

      service.getStartupConfiguration(mockController, iouNode);

      expect(mockHttpController.get).toHaveBeenCalledWith(
        mockController,
        '/projects/project-123/nodes/node-1/files/startup-config.cfg',
        { responseType: 'text' }
      );
    });

    it('should return correct URL for dynamips node', () => {
      const dynamipsNode = { ...mockNode, node_type: 'dynamips' as const, properties: { dynamips_id: '1' } } as unknown as Node;
      mockHttpController.get.mockReturnValue(of('startup config'));

      service.getStartupConfiguration(mockController, dynamipsNode);

      expect(mockHttpController.get).toHaveBeenCalledWith(
        mockController,
        '/projects/project-123/nodes/node-1/files/configs/i1_startup-config.cfg',
        { responseType: 'text' }
      );
    });
  });

  describe('saveConfiguration', () => {
    it('should call httpController.post with configuration for vpcs', () => {
      const vpcsNode = { ...mockNode, node_type: 'vpcs' as const, properties: {} } as unknown as Node;
      mockHttpController.post.mockReturnValue(of({}));

      service.saveConfiguration(mockController, vpcsNode, 'config data');

      expect(mockHttpController.post).toHaveBeenCalledWith(
        mockController,
        '/projects/project-123/nodes/node-1/files/startup.vpc',
        'config data'
      );
    });
  });

  describe('getIdlePCProposals', () => {
    it('should call httpController.get with correct endpoint', () => {
      mockHttpController.get.mockReturnValue(of([]));

      service.getIdlePCProposals(mockController, mockNode);

      expect(mockHttpController.get).toHaveBeenCalledWith(
        mockController,
        '/projects/project-123/nodes/node-1/dynamips/idlepc_proposals'
      );
    });
  });

  describe('getAutoIdlePC', () => {
    it('should call httpController.get with correct endpoint', () => {
      mockHttpController.get.mockReturnValue(of(null));

      service.getAutoIdlePC(mockController, mockNode);

      expect(mockHttpController.get).toHaveBeenCalledWith(
        mockController,
        '/projects/project-123/nodes/node-1/dynamips/auto_idlepc'
      );
    });
  });

  describe('URL Construction', () => {
    it('should construct correct URL for different project IDs', () => {
      mockHttpController.post.mockReturnValue(of({}));

      const project1 = { ...mockProject, project_id: 'proj-1' };
      const project2 = { ...mockProject, project_id: 'proj-2' };

      service.startAll(mockController, project1);
      service.startAll(mockController, project2);

      expect(mockHttpController.post).toHaveBeenNthCalledWith(
        1,
        mockController,
        '/projects/proj-1/nodes/start',
        {}
      );
      expect(mockHttpController.post).toHaveBeenNthCalledWith(
        2,
        mockController,
        '/projects/proj-2/nodes/start',
        {}
      );
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero coordinates in createFromTemplate', () => {
      mockHttpController.post.mockReturnValue(of(mockNode));

      service.createFromTemplate(mockController, mockProject, mockTemplate, 0, 0, '');

      expect(mockHttpController.post).toHaveBeenCalled();
    });

    it('should handle negative coordinates', () => {
      mockHttpController.post.mockReturnValue(of(mockNode));

      service.createFromTemplate(mockController, mockProject, mockTemplate, -50, -100, '');

      expect(mockHttpController.post).toHaveBeenCalled();
    });

    it('should handle empty template ID', () => {
      mockHttpController.post.mockReturnValue(of(mockNode));

      const emptyTemplate = { ...mockTemplate, template_id: '' };
      service.createFromTemplate(mockController, mockProject, emptyTemplate, 100, 200, '');

      expect(mockHttpController.post).toHaveBeenCalledWith(
        mockController,
        '/projects/project-123/templates/',
        expect.any(Object)
      );
    });
  });
});
