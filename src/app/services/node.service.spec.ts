import { describe, it, expect, beforeEach, vi } from 'vitest';
import { firstValueFrom, of, throwError } from 'rxjs';
import { NodeService } from './node.service';
import { HttpController } from './http-controller.service';
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
    it('should call httpController.get with correct endpoint', async () => {
      mockHttpController.get.mockReturnValue(of(mockNode));

      await firstValueFrom(service.getNodeById(mockController, 'project-123', 'node-1'));

      expect(mockHttpController.get).toHaveBeenCalledWith(
        mockController,
        '/projects/project-123/nodes/node-1'
      );
    });

    it('should return Observable with node data', async () => {
      mockHttpController.get.mockReturnValue(of(mockNode));

      const result = await firstValueFrom(service.getNodeById(mockController, 'project-123', 'node-1'));

      expect(result).toEqual(mockNode);
    });

    it('should emit error when httpController.get fails', async () => {
      const error = new Error('Network error');
      mockHttpController.get.mockReturnValue(throwError(() => error));

      await expect(firstValueFrom(service.getNodeById(mockController, 'project-123', 'node-1'))).rejects.toThrow(
        'Network error'
      );
    });
  });

  describe('isolate', () => {
    it('should call httpController.post with correct endpoint', async () => {
      mockHttpController.post.mockReturnValue(of(mockNode));

      await firstValueFrom(service.isolate(mockController, mockNode));

      expect(mockHttpController.post).toHaveBeenCalledWith(
        mockController,
        '/projects/project-123/nodes/node-1/isolate',
        {}
      );
    });

    it('should return Observable with isolated node', async () => {
      mockHttpController.post.mockReturnValue(of(mockNode));

      const result = await firstValueFrom(service.isolate(mockController, mockNode));

      expect(result).toEqual(mockNode);
    });

    it('should emit error when httpController.post fails', async () => {
      const error = new Error('Isolate failed');
      mockHttpController.post.mockReturnValue(throwError(() => error));

      await expect(firstValueFrom(service.isolate(mockController, mockNode))).rejects.toThrow('Isolate failed');
    });
  });

  describe('unisolate', () => {
    it('should call httpController.post with correct endpoint', async () => {
      mockHttpController.post.mockReturnValue(of(mockNode));

      await firstValueFrom(service.unisolate(mockController, mockNode));

      expect(mockHttpController.post).toHaveBeenCalledWith(
        mockController,
        '/projects/project-123/nodes/node-1/unisolate',
        {}
      );
    });

    it('should return Observable', async () => {
      mockHttpController.post.mockReturnValue(of(mockNode));

      const result = await firstValueFrom(service.unisolate(mockController, mockNode));

      expect(result).toEqual(mockNode);
    });

    it('should emit error when httpController.post fails', async () => {
      const error = new Error('Unisolate failed');
      mockHttpController.post.mockReturnValue(throwError(() => error));

      await expect(firstValueFrom(service.unisolate(mockController, mockNode))).rejects.toThrow('Unisolate failed');
    });
  });

  describe('start', () => {
    it('should call httpController.post with correct endpoint', async () => {
      mockHttpController.post.mockReturnValue(of(mockNode));

      await firstValueFrom(service.start(mockController, mockNode));

      expect(mockHttpController.post).toHaveBeenCalledWith(
        mockController,
        '/projects/project-123/nodes/node-1/start',
        {}
      );
    });

    it('should emit error when start fails', async () => {
      const error = new Error('Start failed');
      mockHttpController.post.mockReturnValue(throwError(() => error));

      await expect(firstValueFrom(service.start(mockController, mockNode))).rejects.toThrow('Start failed');
    });
  });

  describe('startAll', () => {
    it('should call httpController.post with correct endpoint', async () => {
      mockHttpController.post.mockReturnValue(of({}));

      await firstValueFrom(service.startAll(mockController, mockProject));

      expect(mockHttpController.post).toHaveBeenCalledWith(
        mockController,
        '/projects/project-123/nodes/start',
        {}
      );
    });

    it('should emit error when startAll fails', async () => {
      const error = new Error('StartAll failed');
      mockHttpController.post.mockReturnValue(throwError(() => error));

      await expect(firstValueFrom(service.startAll(mockController, mockProject))).rejects.toThrow('StartAll failed');
    });
  });

  describe('stop', () => {
    it('should call httpController.post with correct endpoint', async () => {
      mockHttpController.post.mockReturnValue(of(mockNode));

      await firstValueFrom(service.stop(mockController, mockNode));

      expect(mockHttpController.post).toHaveBeenCalledWith(
        mockController,
        '/projects/project-123/nodes/node-1/stop',
        {}
      );
    });

    it('should emit error when stop fails', async () => {
      const error = new Error('Stop failed');
      mockHttpController.post.mockReturnValue(throwError(() => error));

      await expect(firstValueFrom(service.stop(mockController, mockNode))).rejects.toThrow('Stop failed');
    });
  });

  describe('stopAll', () => {
    it('should call httpController.post with correct endpoint', async () => {
      mockHttpController.post.mockReturnValue(of({}));

      await firstValueFrom(service.stopAll(mockController, mockProject));

      expect(mockHttpController.post).toHaveBeenCalledWith(
        mockController,
        '/projects/project-123/nodes/stop',
        {}
      );
    });

    it('should emit error when stopAll fails', async () => {
      const error = new Error('StopAll failed');
      mockHttpController.post.mockReturnValue(throwError(() => error));

      await expect(firstValueFrom(service.stopAll(mockController, mockProject))).rejects.toThrow('StopAll failed');
    });
  });

  describe('suspend', () => {
    it('should call httpController.post with correct endpoint', async () => {
      mockHttpController.post.mockReturnValue(of(mockNode));

      await firstValueFrom(service.suspend(mockController, mockNode));

      expect(mockHttpController.post).toHaveBeenCalledWith(
        mockController,
        '/projects/project-123/nodes/node-1/suspend',
        {}
      );
    });

    it('should emit error when suspend fails', async () => {
      const error = new Error('Suspend failed');
      mockHttpController.post.mockReturnValue(throwError(() => error));

      await expect(firstValueFrom(service.suspend(mockController, mockNode))).rejects.toThrow('Suspend failed');
    });
  });

  describe('suspendAll', () => {
    it('should call httpController.post with correct endpoint', async () => {
      mockHttpController.post.mockReturnValue(of({}));

      await firstValueFrom(service.suspendAll(mockController, mockProject));

      expect(mockHttpController.post).toHaveBeenCalledWith(
        mockController,
        '/projects/project-123/nodes/suspend',
        {}
      );
    });

    it('should emit error when suspendAll fails', async () => {
      const error = new Error('SuspendAll failed');
      mockHttpController.post.mockReturnValue(throwError(() => error));

      await expect(firstValueFrom(service.suspendAll(mockController, mockProject))).rejects.toThrow(
        'SuspendAll failed'
      );
    });
  });

  describe('reload', () => {
    it('should call httpController.post with correct endpoint', async () => {
      mockHttpController.post.mockReturnValue(of(mockNode));

      await firstValueFrom(service.reload(mockController, mockNode));

      expect(mockHttpController.post).toHaveBeenCalledWith(
        mockController,
        '/projects/project-123/nodes/node-1/reload',
        {}
      );
    });

    it('should emit error when reload fails', async () => {
      const error = new Error('Reload failed');
      mockHttpController.post.mockReturnValue(throwError(() => error));

      await expect(firstValueFrom(service.reload(mockController, mockNode))).rejects.toThrow('Reload failed');
    });
  });

  describe('reloadAll', () => {
    it('should call httpController.post with correct endpoint', async () => {
      mockHttpController.post.mockReturnValue(of({}));

      await firstValueFrom(service.reloadAll(mockController, mockProject));

      expect(mockHttpController.post).toHaveBeenCalledWith(
        mockController,
        '/projects/project-123/nodes/reload',
        {}
      );
    });

    it('should emit error when reloadAll fails', async () => {
      const error = new Error('ReloadAll failed');
      mockHttpController.post.mockReturnValue(throwError(() => error));

      await expect(firstValueFrom(service.reloadAll(mockController, mockProject))).rejects.toThrow('ReloadAll failed');
    });
  });

  describe('resetAllNodes', () => {
    it('should call httpController.post with correct endpoint', async () => {
      mockHttpController.post.mockReturnValue(of({}));

      await firstValueFrom(service.resetAllNodes(mockController, mockProject));

      expect(mockHttpController.post).toHaveBeenCalledWith(
        mockController,
        '/projects/project-123/nodes/console/reset',
        {}
      );
    });

    it('should emit error when resetAllNodes fails', async () => {
      const error = new Error('Reset failed');
      mockHttpController.post.mockReturnValue(throwError(() => error));

      await expect(firstValueFrom(service.resetAllNodes(mockController, mockProject))).rejects.toThrow('Reset failed');
    });
  });

  describe('createFromTemplate', () => {
    it('should use local compute_id when compute_id is not provided', async () => {
      mockHttpController.post.mockReturnValue(of(mockNode));

      await firstValueFrom(
        service.createFromTemplate(mockController, mockProject, mockTemplate, 100, 200, '')
      );

      expect(mockHttpController.post).toHaveBeenCalledWith(
        mockController,
        '/projects/project-123/templates/tmpl-1',
        { x: 100, y: 200, compute_id: 'local' }
      );
    });

    it('should use provided compute_id', async () => {
      mockHttpController.post.mockReturnValue(of(mockNode));

      await firstValueFrom(
        service.createFromTemplate(mockController, mockProject, mockTemplate, 100, 200, 'compute-1')
      );

      expect(mockHttpController.post).toHaveBeenCalledWith(
        mockController,
        '/projects/project-123/templates/tmpl-1',
        { x: 100, y: 200, compute_id: 'compute-1' }
      );
    });

    it.each([
      [100.7, 200.3, 101, 200],
      [100.3, 200.7, 100, 201],
      [100.5, 200.5, 101, 201],
    ])('should round coordinates (%f, %f) to (%i, %i)', async (x, y, expectedX, expectedY) => {
      mockHttpController.post.mockReturnValue(of(mockNode));

      await firstValueFrom(
        service.createFromTemplate(mockController, mockProject, mockTemplate, x, y, '')
      );

      const postCall = mockHttpController.post.mock.calls[0];
      const payload = postCall[2];
      expect(payload.x).toBe(expectedX);
      expect(payload.y).toBe(expectedY);
    });

    it('should return Observable with created node', async () => {
      mockHttpController.post.mockReturnValue(of(mockNode));

      const result = await firstValueFrom(
        service.createFromTemplate(mockController, mockProject, mockTemplate, 100, 200, '')
      );

      expect(result).toEqual(mockNode);
    });

    it('should emit error when createFromTemplate fails', async () => {
      const error = new Error('Create failed');
      mockHttpController.post.mockReturnValue(throwError(() => error));

      await expect(
        firstValueFrom(service.createFromTemplate(mockController, mockProject, mockTemplate, 100, 200, ''))
      ).rejects.toThrow('Create failed');
    });
  });

  describe('updatePosition', () => {
    it('should call httpController.put with correct endpoint', async () => {
      mockHttpController.put.mockReturnValue(of(mockNode));

      await firstValueFrom(service.updatePosition(mockController, mockProject, mockNode, 150, 250));

      expect(mockHttpController.put).toHaveBeenCalledWith(
        mockController,
        '/projects/project-123/nodes/node-1',
        expect.objectContaining({ x: 150, y: 250 })
      );
    });

    it.each([
      [100.7, 200.3, 101, 200],
      [100.3, 200.7, 100, 201],
    ])('should round coordinates (%f, %f) to (%i, %i) when snap_to_grid is false', async (x, y, expectedX, expectedY) => {
      mockHttpController.put.mockReturnValue(of(mockNode));

      await firstValueFrom(service.updatePosition(mockController, mockProject, mockNode, x, y));

      const putCall = mockHttpController.put.mock.calls[0];
      const payload = putCall[2];
      expect(payload.x).toBe(expectedX);
      expect(payload.y).toBe(expectedY);
    });

    it.each([
      // node width=50, height=50, grid_size=50
      // x=125: (125+25)/50=3 -> 150, 150-25=125
      // y=225: (225+25)/50=5 -> 250, 250-25=225
      [125, 225, 125, 225],
      // x=100: (100+25)/50=2.5 -> round=3 -> 150, 150-25=125
      // y=200: (200+25)/50=4.5 -> round=5 -> 250, 250-25=225
      [100, 200, 125, 225],
    ])('should snap to grid correctly for (%i, %i) -> (%i, %i)', async (x, y, expectedX, expectedY) => {
      const snapProject = { ...mockProject, snap_to_grid: true, grid_size: 50 };
      mockHttpController.put.mockReturnValue(of(mockNode));

      await firstValueFrom(service.updatePosition(mockController, snapProject, mockNode, x, y));

      const putCall = mockHttpController.put.mock.calls[0];
      const payload = putCall[2];
      expect(payload.x).toBe(expectedX);
      expect(payload.y).toBe(expectedY);
    });

    it('should emit error when updatePosition fails', async () => {
      const error = new Error('Update position failed');
      mockHttpController.put.mockReturnValue(throwError(() => error));

      await expect(
        firstValueFrom(service.updatePosition(mockController, mockProject, mockNode, 150, 250))
      ).rejects.toThrow('Update position failed');
    });
  });

  describe('updateLabel', () => {
    it('should call httpController.put with label data', async () => {
      mockHttpController.put.mockReturnValue(of(mockNode));

      const label: Label = {
        rotation: 90,
        style: 'font-size: 12',
        text: 'Test',
        x: 100.5,
        y: 200.5,
      } as Label;

      await firstValueFrom(service.updateLabel(mockController, mockNode, label));

      expect(mockHttpController.put).toHaveBeenCalled();
      const putCall = mockHttpController.put.mock.calls[0];
      const payload = putCall[2];

      expect(payload.label.rotation).toBe(90);
      expect(payload.label.style).toBe('font-size: 12');
      expect(payload.label.text).toBe('Test');
      expect(payload.label.x).toBe(101);
      expect(payload.label.y).toBe(201);
    });

    it('should return Observable with updated node', async () => {
      mockHttpController.put.mockReturnValue(of(mockNode));

      const label: Label = { rotation: 0, style: '', text: '', x: 0, y: 0 } as Label;
      const result = await firstValueFrom(service.updateLabel(mockController, mockNode, label));

      expect(result).toEqual(mockNode);
    });

    it('should emit error when updateLabel fails', async () => {
      const error = new Error('Update label failed');
      mockHttpController.put.mockReturnValue(throwError(() => error));

      const label: Label = { rotation: 0, style: '', text: '', x: 0, y: 0 } as Label;
      await expect(firstValueFrom(service.updateLabel(mockController, mockNode, label))).rejects.toThrow(
        'Update label failed'
      );
    });
  });

  describe('updateSymbol', () => {
    it('should call httpController.put with symbol data', async () => {
      mockHttpController.put.mockReturnValue(of(mockNode));

      await firstValueFrom(service.updateSymbol(mockController, mockNode, 'new-symbol.svg'));

      expect(mockHttpController.put).toHaveBeenCalledWith(
        mockController,
        '/projects/project-123/nodes/node-1',
        { symbol: 'new-symbol.svg' }
      );
    });

    it('should return Observable with updated node', async () => {
      mockHttpController.put.mockReturnValue(of(mockNode));

      const result = await firstValueFrom(service.updateSymbol(mockController, mockNode, 'new-symbol.svg'));

      expect(result).toEqual(mockNode);
    });

    it('should emit error when updateSymbol fails', async () => {
      const error = new Error('Update symbol failed');
      mockHttpController.put.mockReturnValue(throwError(() => error));

      await expect(
        firstValueFrom(service.updateSymbol(mockController, mockNode, 'new-symbol.svg'))
      ).rejects.toThrow('Update symbol failed');
    });
  });

  describe('update', () => {
    it('should call httpController.put with rounded coordinates', async () => {
      const nodeWithDecimals = { ...mockNode, x: 100.7, y: 200.3, z: 1 };
      mockHttpController.put.mockReturnValue(of(nodeWithDecimals));

      await firstValueFrom(service.update(mockController, nodeWithDecimals));

      const putCall = mockHttpController.put.mock.calls[0];
      const payload = putCall[2];

      expect(payload.x).toBe(101);
      expect(payload.y).toBe(200);
      expect(payload.z).toBe(1);
    });

    it('should emit error when update fails', async () => {
      const error = new Error('Update failed');
      mockHttpController.put.mockReturnValue(throwError(() => error));

      await expect(firstValueFrom(service.update(mockController, mockNode))).rejects.toThrow('Update failed');
    });
  });

  describe('updateNode', () => {
    it('should call httpController.put with node properties', async () => {
      mockHttpController.put.mockReturnValue(of(mockNode));

      await firstValueFrom(service.updateNode(mockController, mockNode));

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

    it('should emit error when updateNode fails', async () => {
      const error = new Error('Update node failed');
      mockHttpController.put.mockReturnValue(throwError(() => error));

      await expect(firstValueFrom(service.updateNode(mockController, mockNode))).rejects.toThrow('Update node failed');
    });
  });

  describe('updateNodeWithCustomAdapters', () => {
    it('should filter out null values from custom_adapters', async () => {
      const nodeWithAdapters = {
        ...mockNode,
        custom_adapters: [
          { adapter_number: 0, adapter_type: 'type1', port_name: 'eth0', mac_address: '00:00:00:00:00:01' },
          { adapter_number: 1, adapter_type: 'type2', port_name: null, mac_address: null },
        ],
      } as unknown as Node;
      mockHttpController.put.mockReturnValue(of(nodeWithAdapters));

      await firstValueFrom(service.updateNodeWithCustomAdapters(mockController, nodeWithAdapters));

      const putCall = mockHttpController.put.mock.calls[0];
      const payload = putCall[2];

      expect(payload.custom_adapters).toHaveLength(2);
      expect(payload.custom_adapters[0]).toEqual({
        adapter_number: 0,
        adapter_type: 'type1',
        port_name: 'eth0',
        mac_address: '00:00:00:00:00:01',
      });
      expect(payload.custom_adapters[1]).toEqual({
        adapter_number: 1,
        adapter_type: 'type2',
      });
    });

    it('should return empty array when custom_adapters is undefined', async () => {
      const nodeWithoutAdapters = { ...mockNode, custom_adapters: undefined } as unknown as Node;
      mockHttpController.put.mockReturnValue(of(nodeWithoutAdapters));

      await firstValueFrom(service.updateNodeWithCustomAdapters(mockController, nodeWithoutAdapters));

      const putCall = mockHttpController.put.mock.calls[0];
      const payload = putCall[2];

      expect(payload.custom_adapters).toEqual([]);
    });

    it('should emit error when updateNodeWithCustomAdapters fails', async () => {
      const error = new Error('Update adapters failed');
      mockHttpController.put.mockReturnValue(throwError(() => error));

      await expect(
        firstValueFrom(service.updateNodeWithCustomAdapters(mockController, mockNode))
      ).rejects.toThrow('Update adapters failed');
    });
  });

  describe('delete', () => {
    it('should call httpController.delete with correct endpoint', async () => {
      mockHttpController.delete.mockReturnValue(of({}));

      await firstValueFrom(service.delete(mockController, mockNode));

      expect(mockHttpController.delete).toHaveBeenCalledWith(
        mockController,
        '/projects/project-123/nodes/node-1'
      );
    });

    it('should emit error when delete fails', async () => {
      const error = new Error('Delete failed');
      mockHttpController.delete.mockReturnValue(throwError(() => error));

      await expect(firstValueFrom(service.delete(mockController, mockNode))).rejects.toThrow('Delete failed');
    });
  });

  describe('duplicate', () => {
    it('should call httpController.post with offset coordinates', async () => {
      mockHttpController.post.mockReturnValue(of(mockNode));

      const nodeToDuplicate = { ...mockNode, x: 100, y: 200, z: 1 };
      await firstValueFrom(service.duplicate(mockController, nodeToDuplicate));

      expect(mockHttpController.post).toHaveBeenCalledWith(
        mockController,
        '/projects/project-123/nodes/node-1/duplicate',
        { x: 110, y: 210, z: 1 }
      );
    });

    it('should emit error when duplicate fails', async () => {
      const error = new Error('Duplicate failed');
      mockHttpController.post.mockReturnValue(throwError(() => error));

      await expect(firstValueFrom(service.duplicate(mockController, mockNode))).rejects.toThrow('Duplicate failed');
    });
  });

  describe('getNode', () => {
    it('should call httpController.get with correct endpoint', async () => {
      mockHttpController.get.mockReturnValue(of(mockNode));

      await firstValueFrom(service.getNode(mockController, mockNode));

      expect(mockHttpController.get).toHaveBeenCalledWith(
        mockController,
        '/projects/project-123/nodes/node-1'
      );
    });

    it('should return Observable with node data', async () => {
      mockHttpController.get.mockReturnValue(of(mockNode));

      const result = await firstValueFrom(service.getNode(mockController, mockNode));

      expect(result).toEqual(mockNode);
    });

    it('should emit error when getNode fails', async () => {
      const error = new Error('Get node failed');
      mockHttpController.get.mockReturnValue(throwError(() => error));

      await expect(firstValueFrom(service.getNode(mockController, mockNode))).rejects.toThrow('Get node failed');
    });
  });

  describe('getDefaultCommand', () => {
    it('should return correct putty command string', () => {
      const result = service.getDefaultCommand();

      expect(result).toBe('putty.exe -telnet %h %p -wt "%d" -gns3 5 -skin 4');
    });
  });

  describe('getNetworkConfiguration', () => {
    it('should call httpController.get with correct endpoint', async () => {
      mockHttpController.get.mockReturnValue(of('config data'));

      await firstValueFrom(service.getNetworkConfiguration(mockController, mockNode));

      expect(mockHttpController.get).toHaveBeenCalledWith(
        mockController,
        '/projects/project-123/nodes/node-1/files/etc/network/interfaces',
        { responseType: 'text' }
      );
    });

    it('should return Observable with config data', async () => {
      mockHttpController.get.mockReturnValue(of('config data'));

      const result = await firstValueFrom(service.getNetworkConfiguration(mockController, mockNode));

      expect(result).toBe('config data');
    });

    it('should emit error when getNetworkConfiguration fails', async () => {
      const error = new Error('Get config failed');
      mockHttpController.get.mockReturnValue(throwError(() => error));

      await expect(
        firstValueFrom(service.getNetworkConfiguration(mockController, mockNode))
      ).rejects.toThrow('Get config failed');
    });
  });

  describe('saveNetworkConfiguration', () => {
    it('should call httpController.post with configuration', async () => {
      mockHttpController.post.mockReturnValue(of({}));

      await firstValueFrom(service.saveNetworkConfiguration(mockController, mockNode, 'network config'));

      expect(mockHttpController.post).toHaveBeenCalledWith(
        mockController,
        '/projects/project-123/nodes/node-1/files/etc/network/interfaces',
        'network config'
      );
    });

    it('should emit error when saveNetworkConfiguration fails', async () => {
      const error = new Error('Save config failed');
      mockHttpController.post.mockReturnValue(throwError(() => error));

      await expect(
        firstValueFrom(service.saveNetworkConfiguration(mockController, mockNode, 'network config'))
      ).rejects.toThrow('Save config failed');
    });
  });

  describe('getStartupConfiguration', () => {
    it.each([
      ['vpcs', 'startup.vpc', {}],
      ['iou', 'startup-config.cfg', {}],
      ['dynamips', 'configs/i1_startup-config.cfg', { dynamips_id: '1' }],
    ])('should return correct URL for %s node', async (nodeType, expectedFile, properties) => {
      const node = { ...mockNode, node_type: nodeType as 'vpcs' | 'iou' | 'dynamips', properties } as unknown as Node;
      mockHttpController.get.mockReturnValue(of('startup config'));

      await firstValueFrom(service.getStartupConfiguration(mockController, node));

      expect(mockHttpController.get).toHaveBeenCalledWith(
        mockController,
        `/projects/project-123/nodes/node-1/files/${expectedFile}`,
        { responseType: 'text' }
      );
    });

    it('should emit error when getStartupConfiguration fails', async () => {
      const error = new Error('Get startup config failed');
      mockHttpController.get.mockReturnValue(throwError(() => error));

      await expect(firstValueFrom(service.getStartupConfiguration(mockController, mockNode))).rejects.toThrow(
        'Get startup config failed'
      );
    });
  });

  describe('getPrivateConfiguration', () => {
    it.each([
      ['iou', 'private-config.cfg', {}],
      ['dynamips', 'configs/i1_private-config.cfg', { dynamips_id: '1' }],
    ])('should return correct URL for %s node', async (nodeType, expectedFile, properties) => {
      const node = { ...mockNode, node_type: nodeType as 'iou' | 'dynamips', properties } as unknown as Node;
      mockHttpController.get.mockReturnValue(of('private config'));

      await firstValueFrom(service.getPrivateConfiguration(mockController, node));

      expect(mockHttpController.get).toHaveBeenCalledWith(
        mockController,
        `/projects/project-123/nodes/node-1/files/${expectedFile}`,
        { responseType: 'text' }
      );
    });

    it('should emit error when getPrivateConfiguration fails', async () => {
      const error = new Error('Get private config failed');
      mockHttpController.get.mockReturnValue(throwError(() => error));

      await expect(firstValueFrom(service.getPrivateConfiguration(mockController, mockNode))).rejects.toThrow(
        'Get private config failed'
      );
    });
  });

  describe('saveConfiguration', () => {
    it.each([
      ['vpcs', 'startup.vpc', {}],
      ['iou', 'startup-config.cfg', {}],
      ['dynamips', 'configs/i1_startup-config.cfg', { dynamips_id: '1' }],
    ])('should call httpController.post with configuration for %s', async (nodeType, expectedFile, properties) => {
      const node = { ...mockNode, node_type: nodeType as 'vpcs' | 'iou' | 'dynamips', properties } as unknown as Node;
      mockHttpController.post.mockReturnValue(of({}));

      await firstValueFrom(service.saveConfiguration(mockController, node, 'config data'));

      expect(mockHttpController.post).toHaveBeenCalledWith(
        mockController,
        `/projects/project-123/nodes/node-1/files/${expectedFile}`,
        'config data'
      );
    });

    it('should emit error when saveConfiguration fails', async () => {
      const error = new Error('Save config failed');
      mockHttpController.post.mockReturnValue(throwError(() => error));

      await expect(firstValueFrom(service.saveConfiguration(mockController, mockNode, 'config data'))).rejects.toThrow(
        'Save config failed'
      );
    });
  });

  describe('savePrivateConfiguration', () => {
    it.each([
      ['iou', 'private-config.cfg', {}],
      ['dynamips', 'configs/i1_private-config.cfg', { dynamips_id: '1' }],
    ])('should call httpController.post with private configuration for %s', async (nodeType, expectedFile, properties) => {
      const node = { ...mockNode, node_type: nodeType as 'iou' | 'dynamips', properties } as unknown as Node;
      mockHttpController.post.mockReturnValue(of({}));

      await firstValueFrom(service.savePrivateConfiguration(mockController, node, 'private config'));

      expect(mockHttpController.post).toHaveBeenCalledWith(
        mockController,
        `/projects/project-123/nodes/node-1/files/${expectedFile}`,
        'private config'
      );
    });

    it('should emit error when savePrivateConfiguration fails', async () => {
      const error = new Error('Save private config failed');
      mockHttpController.post.mockReturnValue(throwError(() => error));

      await expect(
        firstValueFrom(service.savePrivateConfiguration(mockController, mockNode, 'private config'))
      ).rejects.toThrow('Save private config failed');
    });
  });

  describe('getIdlePCProposals', () => {
    it('should call httpController.get with correct endpoint', async () => {
      mockHttpController.get.mockReturnValue(of([]));

      await firstValueFrom(service.getIdlePCProposals(mockController, mockNode));

      expect(mockHttpController.get).toHaveBeenCalledWith(
        mockController,
        '/projects/project-123/nodes/node-1/dynamips/idlepc_proposals'
      );
    });

    it('should return Observable with proposals', async () => {
      const proposals = ['proposal1', 'proposal2'];
      mockHttpController.get.mockReturnValue(of(proposals));

      const result = await firstValueFrom(service.getIdlePCProposals(mockController, mockNode));

      expect(result).toEqual(proposals);
    });

    it('should emit error when getIdlePCProposals fails', async () => {
      const error = new Error('Get idlepc proposals failed');
      mockHttpController.get.mockReturnValue(throwError(() => error));

      await expect(firstValueFrom(service.getIdlePCProposals(mockController, mockNode))).rejects.toThrow(
        'Get idlepc proposals failed'
      );
    });
  });

  describe('getAutoIdlePC', () => {
    it('should call httpController.get with correct endpoint', async () => {
      mockHttpController.get.mockReturnValue(of(null));

      await firstValueFrom(service.getAutoIdlePC(mockController, mockNode));

      expect(mockHttpController.get).toHaveBeenCalledWith(
        mockController,
        '/projects/project-123/nodes/node-1/dynamips/auto_idlepc'
      );
    });

    it('should return Observable with auto idlepc value', async () => {
      mockHttpController.get.mockReturnValue(of('auto_idlepc_value'));

      const result = await firstValueFrom(service.getAutoIdlePC(mockController, mockNode));

      expect(result).toBe('auto_idlepc_value');
    });

    it('should emit error when getAutoIdlePC fails', async () => {
      const error = new Error('Get auto idlepc failed');
      mockHttpController.get.mockReturnValue(throwError(() => error));

      await expect(firstValueFrom(service.getAutoIdlePC(mockController, mockNode))).rejects.toThrow(
        'Get auto idlepc failed'
      );
    });
  });

  describe('URL Construction', () => {
    it('should construct correct URL for different project IDs', async () => {
      mockHttpController.post.mockReturnValue(of({}));

      const project1 = { ...mockProject, project_id: 'proj-1' };
      const project2 = { ...mockProject, project_id: 'proj-2' };

      await firstValueFrom(service.startAll(mockController, project1));
      await firstValueFrom(service.startAll(mockController, project2));

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
    it('should handle zero coordinates in createFromTemplate', async () => {
      mockHttpController.post.mockReturnValue(of(mockNode));

      await firstValueFrom(
        service.createFromTemplate(mockController, mockProject, mockTemplate, 0, 0, '')
      );

      expect(mockHttpController.post).toHaveBeenCalled();
    });

    it('should handle negative coordinates', async () => {
      mockHttpController.post.mockReturnValue(of(mockNode));

      await firstValueFrom(
        service.createFromTemplate(mockController, mockProject, mockTemplate, -50, -100, '')
      );

      expect(mockHttpController.post).toHaveBeenCalled();
    });

    it('should handle empty template ID', async () => {
      mockHttpController.post.mockReturnValue(of(mockNode));

      const emptyTemplate = { ...mockTemplate, template_id: '' };
      await firstValueFrom(
        service.createFromTemplate(mockController, mockProject, emptyTemplate, 100, 200, '')
      );

      expect(mockHttpController.post).toHaveBeenCalledWith(
        mockController,
        '/projects/project-123/templates/',
        expect.any(Object)
      );
    });

    it('should handle node without custom_adapters', async () => {
      const nodeWithoutAdapters = { ...mockNode, custom_adapters: undefined } as unknown as Node;
      mockHttpController.put.mockReturnValue(of(nodeWithoutAdapters));

      await firstValueFrom(service.updateNodeWithCustomAdapters(mockController, nodeWithoutAdapters));

      const putCall = mockHttpController.put.mock.calls[0];
      const payload = putCall[2];
      expect(payload.custom_adapters).toEqual([]);
    });

    it('should handle empty custom_adapters array', async () => {
      const nodeWithEmptyAdapters = { ...mockNode, custom_adapters: [] } as unknown as Node;
      mockHttpController.put.mockReturnValue(of(nodeWithEmptyAdapters));

      await firstValueFrom(service.updateNodeWithCustomAdapters(mockController, nodeWithEmptyAdapters));

      const putCall = mockHttpController.put.mock.calls[0];
      const payload = putCall[2];
      expect(payload.custom_adapters).toEqual([]);
    });
  });
});
