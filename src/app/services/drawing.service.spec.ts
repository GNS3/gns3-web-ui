import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DrawingService } from './drawing.service';
import { HttpController } from './http-controller.service';
import { SvgToDrawingConverter } from '../cartography/helpers/svg-to-drawing-converter';
import { Observable, of } from 'rxjs';
import { Controller } from '@models/controller';
import { Drawing } from '../cartography/models/drawing';
import { Project } from '@models/project';

describe('DrawingService', () => {
  let service: DrawingService;
  let mockHttpController: any;
  let mockSvgToDrawingConverter: any;
  let mockController: Controller;
  let mockProject: Project;
  let mockDrawing: Drawing;

  beforeEach(() => {
    // Mock HttpController
    mockHttpController = {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
    };

    // Mock SvgToDrawingConverter
    mockSvgToDrawingConverter = {
      convert: vi.fn(),
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
      drawing_grid_size: 50,
      status: 'opened',
      auto_close: true,
      auto_open: false,
      auto_start: false,
      scene_width: 2000,
      scene_height: 1000,
      zoom: 100,
      show_grid: false,
      show_interface_labels: true,
      show_layers: false,
      grid_size: 75,
    } as unknown as Project;

    // Mock Drawing
    mockDrawing = {
      drawing_id: 'drawing-1',
      project_id: 'project-123',
      svg: '<svg>test</svg>',
      x: 100,
      y: 200,
      z: 1,
      rotation: 0,
      locked: false,
    } as Drawing;

    service = new DrawingService(mockHttpController, mockSvgToDrawingConverter);
  });

  describe('Service Creation', () => {
    it('should create the service', () => {
      expect(service).toBeTruthy();
    });

    it('should be created with dependencies', () => {
      expect(service).toBeInstanceOf(DrawingService);
    });
  });

  describe('add', () => {
    it('should call httpController.post with correct endpoint', () => {
      mockHttpController.post.mockReturnValue(of({}));

      service.add(mockController, 'project-123', 100.5, 200.7, '<svg>test</svg>');

      expect(mockHttpController.post).toHaveBeenCalledWith(
        mockController,
        '/projects/project-123/drawings',
        expect.any(Object)
      );
    });

    it('should round x and y coordinates', () => {
      mockHttpController.post.mockReturnValue(of({}));

      service.add(mockController, 'project-123', 100.6, 200.8, '<svg>test</svg>');

      const postCall = mockHttpController.post.mock.calls[0];
      const payload = postCall[2];

      expect(payload.x).toBe(101);
      expect(payload.y).toBe(201);
    });

    it('should include svg in payload', () => {
      mockHttpController.post.mockReturnValue(of({}));

      const testSvg = '<svg><rect x="0" y="0" width="100" height="100"/></svg>';
      service.add(mockController, 'project-123', 100, 200, testSvg);

      const postCall = mockHttpController.post.mock.calls[0];
      const payload = postCall[2];

      expect(payload.svg).toBe(testSvg);
    });

    it('should set z to 1', () => {
      mockHttpController.post.mockReturnValue(of({}));

      service.add(mockController, 'project-123', 100, 200, '<svg>test</svg>');

      const postCall = mockHttpController.post.mock.calls[0];
      const payload = postCall[2];

      expect(payload.z).toBe(1);
    });

    it('should return Observable from httpController', () => {
      const mockDrawingResponse: Drawing = {
        drawing_id: 'drawing-new',
        project_id: 'project-123',
        svg: '<svg>test</svg>',
        x: 100,
        y: 200,
        z: 1,
      } as Drawing;

      mockHttpController.post.mockReturnValue(of(mockDrawingResponse));

      const result = service.add(mockController, 'project-123', 100, 200, '<svg>test</svg>');

      expect(result).toBeInstanceOf(Observable);
    });
  });

  describe('duplicate', () => {
    it('should call httpController.post with correct endpoint', () => {
      mockHttpController.post.mockReturnValue(of({}));

      service.duplicate(mockController, 'project-123', mockDrawing);

      expect(mockHttpController.post).toHaveBeenCalledWith(
        mockController,
        '/projects/project-123/drawings',
        expect.any(Object)
      );
    });

    it('should offset x and y by 10 pixels', () => {
      mockHttpController.post.mockReturnValue(of({}));

      mockDrawing.x = 100;
      mockDrawing.y = 200;

      service.duplicate(mockController, 'project-123', mockDrawing);

      const postCall = mockHttpController.post.mock.calls[0];
      const payload = postCall[2];

      expect(payload.x).toBe(110);
      expect(payload.y).toBe(210);
    });

    it('should include svg from original drawing', () => {
      mockHttpController.post.mockReturnValue(of({}));

      mockDrawing.svg = '<svg>original</svg>';

      service.duplicate(mockController, 'project-123', mockDrawing);

      const postCall = mockHttpController.post.mock.calls[0];
      const payload = postCall[2];

      expect(payload.svg).toBe('<svg>original</svg>');
    });

    it('should include rotation from original drawing', () => {
      mockHttpController.post.mockReturnValue(of({}));

      mockDrawing.rotation = 45;

      service.duplicate(mockController, 'project-123', mockDrawing);

      const postCall = mockHttpController.post.mock.calls[0];
      const payload = postCall[2];

      expect(payload.rotation).toBe(45);
    });

    it('should include z from original drawing', () => {
      mockHttpController.post.mockReturnValue(of({}));

      mockDrawing.z = 5;

      service.duplicate(mockController, 'project-123', mockDrawing);

      const postCall = mockHttpController.post.mock.calls[0];
      const payload = postCall[2];

      expect(payload.z).toBe(5);
    });

    it('should return Observable from httpController', () => {
      mockHttpController.post.mockReturnValue(of(mockDrawing));

      const result = service.duplicate(mockController, 'project-123', mockDrawing);

      expect(result).toBeInstanceOf(Observable);
    });
  });

  describe('updatePosition', () => {
    it('should call httpController.put with correct endpoint', () => {
      mockHttpController.put.mockReturnValue(of({}));

      service.updatePosition(mockController, mockProject, mockDrawing, 150, 250);

      expect(mockHttpController.put).toHaveBeenCalledWith(
        mockController,
        '/projects/project-123/drawings/drawing-1',
        expect.any(Object)
      );
    });

    it('should round x and y coordinates', () => {
      mockHttpController.put.mockReturnValue(of({}));

      service.updatePosition(mockController, mockProject, mockDrawing, 100.6, 200.8);

      const putCall = mockHttpController.put.mock.calls[0];
      const payload = putCall[2];

      expect(payload.x).toBe(101);
      expect(payload.y).toBe(201);
    });

    it('should snap to grid when project.snap_to_grid is true', () => {
      mockHttpController.put.mockReturnValue(of({}));

      const snapProject = { ...mockProject, snap_to_grid: true };
      mockDrawing.element = { width: 100, height: 50 };
      mockSvgToDrawingConverter.convert.mockReturnValue(mockDrawing.element);

      service.updatePosition(mockController, snapProject, mockDrawing, 100, 200);

      expect(mockSvgToDrawingConverter.convert).toHaveBeenCalledWith(mockDrawing.svg);
    });

    it('should calculate snapped position correctly', () => {
      mockHttpController.put.mockReturnValue(of({}));

      const snapProject = {
        ...mockProject,
        snap_to_grid: true,
        drawing_grid_size: 50,
      };

      mockDrawing.element = { width: 100, height: 50 };
      mockSvgToDrawingConverter.convert.mockReturnValue(mockDrawing.element);

      service.updatePosition(mockController, snapProject, mockDrawing, 125, 225);

      const putCall = mockHttpController.put.mock.calls[0];
      const payload = putCall[2];

      // Position should be snapped to 50px grid
      expect(payload.x).toBeDefined();
      expect(payload.y).toBeDefined();
    });

    it('should not snap to grid when project.snap_to_grid is false', () => {
      mockHttpController.put.mockReturnValue(of({}));

      const noSnapProject = { ...mockProject, snap_to_grid: false };

      service.updatePosition(mockController, noSnapProject, mockDrawing, 100.6, 200.8);

      expect(mockSvgToDrawingConverter.convert).not.toHaveBeenCalled();

      const putCall = mockHttpController.put.mock.calls[0];
      const payload = putCall[2];

      expect(payload.x).toBe(101);
      expect(payload.y).toBe(201);
    });

    it('should return Observable from httpController', () => {
      mockHttpController.put.mockReturnValue(of(mockDrawing));

      const result = service.updatePosition(mockController, mockProject, mockDrawing, 100, 200);

      expect(result).toBeInstanceOf(Observable);
    });
  });

  describe('updateSizeAndPosition', () => {
    it('should call httpController.put with correct endpoint', () => {
      mockHttpController.put.mockReturnValue(of({}));

      service.updateSizeAndPosition(mockController, mockDrawing, 150, 250, '<svg>updated</svg>');

      expect(mockHttpController.put).toHaveBeenCalledWith(
        mockController,
        '/projects/project-123/drawings/drawing-1',
        expect.any(Object)
      );
    });

    it('should include svg in payload', () => {
      mockHttpController.put.mockReturnValue(of({}));

      const testSvg = '<svg>new svg</svg>';
      service.updateSizeAndPosition(mockController, mockDrawing, 100, 200, testSvg);

      const putCall = mockHttpController.put.mock.calls[0];
      const payload = putCall[2];

      expect(payload.svg).toBe(testSvg);
    });

    it('should round x and y coordinates', () => {
      mockHttpController.put.mockReturnValue(of({}));

      service.updateSizeAndPosition(mockController, mockDrawing, 100.7, 200.3, '<svg>test</svg>');

      const putCall = mockHttpController.put.mock.calls[0];
      const payload = putCall[2];

      expect(payload.x).toBe(101);
      expect(payload.y).toBe(200);
    });

    it('should return Observable from httpController', () => {
      mockHttpController.put.mockReturnValue(of(mockDrawing));

      const result = service.updateSizeAndPosition(mockController, mockDrawing, 100, 200, '<svg>test</svg>');

      expect(result).toBeInstanceOf(Observable);
    });
  });

  describe('updateText', () => {
    it('should call httpController.put with correct endpoint', () => {
      mockHttpController.put.mockReturnValue(of({}));

      service.updateText(mockController, mockDrawing, '<svg>new text</svg>');

      expect(mockHttpController.put).toHaveBeenCalledWith(
        mockController,
        '/projects/project-123/drawings/drawing-1',
        expect.any(Object)
      );
    });

    it('should include svg in payload', () => {
      mockHttpController.put.mockReturnValue(of({}));

      const testSvg = '<svg>text content</svg>';
      service.updateText(mockController, mockDrawing, testSvg);

      const putCall = mockHttpController.put.mock.calls[0];
      const payload = putCall[2];

      expect(payload.svg).toBe(testSvg);
    });

    it('should include rounded x and y coordinates', () => {
      mockHttpController.put.mockReturnValue(of({}));

      mockDrawing.x = 100.6;
      mockDrawing.y = 200.8;

      service.updateText(mockController, mockDrawing, '<svg>test</svg>');

      const putCall = mockHttpController.put.mock.calls[0];
      const payload = putCall[2];

      expect(payload.x).toBe(101);
      expect(payload.y).toBe(201);
    });

    it('should include z in payload', () => {
      mockHttpController.put.mockReturnValue(of({}));

      mockDrawing.z = 5;

      service.updateText(mockController, mockDrawing, '<svg>test</svg>');

      const putCall = mockHttpController.put.mock.calls[0];
      const payload = putCall[2];

      expect(payload.z).toBe(5);
    });

    it('should return Observable from httpController', () => {
      mockHttpController.put.mockReturnValue(of(mockDrawing));

      const result = service.updateText(mockController, mockDrawing, '<svg>test</svg>');

      expect(result).toBeInstanceOf(Observable);
    });
  });

  describe('update', () => {
    it('should call httpController.put with correct endpoint', () => {
      mockHttpController.put.mockReturnValue(of({}));

      service.update(mockController, mockDrawing);

      expect(mockHttpController.put).toHaveBeenCalledWith(
        mockController,
        '/projects/project-123/drawings/drawing-1',
        expect.any(Object)
      );
    });

    it('should include all drawing properties in payload', () => {
      mockHttpController.put.mockReturnValue(of({}));

      mockDrawing.locked = true;
      mockDrawing.svg = '<svg>test</svg>';
      mockDrawing.rotation = 45;
      mockDrawing.x = 100.6;
      mockDrawing.y = 200.8;
      mockDrawing.z = 3;

      service.update(mockController, mockDrawing);

      const putCall = mockHttpController.put.mock.calls[0];
      const payload = putCall[2];

      expect(payload.locked).toBe(true);
      expect(payload.svg).toBe('<svg>test</svg>');
      expect(payload.rotation).toBe(45);
      expect(payload.x).toBe(101);
      expect(payload.y).toBe(201);
      expect(payload.z).toBe(3);
    });

    it('should round x and y coordinates', () => {
      mockHttpController.put.mockReturnValue(of({}));

      mockDrawing.x = 100.7;
      mockDrawing.y = 200.3;

      service.update(mockController, mockDrawing);

      const putCall = mockHttpController.put.mock.calls[0];
      const payload = putCall[2];

      expect(payload.x).toBe(101);
      expect(payload.y).toBe(200);
    });

    it('should return Observable from httpController', () => {
      mockHttpController.put.mockReturnValue(of(mockDrawing));

      const result = service.update(mockController, mockDrawing);

      expect(result).toBeInstanceOf(Observable);
    });
  });

  describe('delete', () => {
    it('should call httpController.delete with correct endpoint', () => {
      mockHttpController.delete.mockReturnValue(of({}));

      service.delete(mockController, mockDrawing);

      expect(mockHttpController.delete).toHaveBeenCalledWith(
        mockController,
        '/projects/project-123/drawings/drawing-1'
      );
    });

    it('should return Observable from httpController', () => {
      mockHttpController.delete.mockReturnValue(of({}));

      const result = service.delete(mockController, mockDrawing);

      expect(result).toBeInstanceOf(Observable);
    });

    it('should include project_id and drawing_id in URL', () => {
      mockHttpController.delete.mockReturnValue(of({}));

      const testDrawing = {
        drawing_id: 'drawing-to-delete',
        project_id: 'project-test',
      } as Drawing;

      service.delete(mockController, testDrawing);

      expect(mockHttpController.delete).toHaveBeenCalledWith(
        mockController,
        '/projects/project-test/drawings/drawing-to-delete'
      );
    });
  });

  describe('lockAllNodes', () => {
    it('should call httpController.post with correct endpoint', () => {
      mockHttpController.post.mockReturnValue(of({}));

      service.lockAllNodes(mockController, mockProject);

      expect(mockHttpController.post).toHaveBeenCalledWith(mockController, '/projects/project-123/lock', {});
    });

    it('should pass empty body', () => {
      mockHttpController.post.mockReturnValue(of({}));

      service.lockAllNodes(mockController, mockProject);

      const postCall = mockHttpController.post.mock.calls[0];
      expect(postCall[2]).toEqual({});
    });

    it('should return Observable from httpController', () => {
      mockHttpController.post.mockReturnValue(of({}));

      const result = service.lockAllNodes(mockController, mockProject);

      expect(result).toBeInstanceOf(Observable);
    });
  });

  describe('unLockAllNodes', () => {
    it('should call httpController.post with correct endpoint', () => {
      mockHttpController.post.mockReturnValue(of({}));

      service.unLockAllNodes(mockController, mockProject);

      expect(mockHttpController.post).toHaveBeenCalledWith(mockController, '/projects/project-123/unlock', {});
    });

    it('should pass empty body', () => {
      mockHttpController.post.mockReturnValue(of({}));

      service.unLockAllNodes(mockController, mockProject);

      const postCall = mockHttpController.post.mock.calls[0];
      expect(postCall[2]).toEqual({});
    });

    it('should return Observable from httpController', () => {
      mockHttpController.post.mockReturnValue(of({}));

      const result = service.unLockAllNodes(mockController, mockProject);

      expect(result).toBeInstanceOf(Observable);
    });
  });

  describe('URL Construction', () => {
    it('should construct correct URL for different project IDs', () => {
      mockHttpController.post.mockReturnValue(of({}));

      service.add(mockController, 'proj-alpha', 100, 200, '<svg>test</svg>');
      service.add(mockController, 'proj-beta', 100, 200, '<svg>test</svg>');
      service.add(mockController, 'proj-gamma', 100, 200, '<svg>test</svg>');

      expect(mockHttpController.post).toHaveBeenCalledTimes(3);
      expect(mockHttpController.post).toHaveBeenNthCalledWith(
        1,
        mockController,
        '/projects/proj-alpha/drawings',
        expect.any(Object)
      );
      expect(mockHttpController.post).toHaveBeenNthCalledWith(
        2,
        mockController,
        '/projects/proj-beta/drawings',
        expect.any(Object)
      );
      expect(mockHttpController.post).toHaveBeenNthCalledWith(
        3,
        mockController,
        '/projects/proj-gamma/drawings',
        expect.any(Object)
      );
    });

    it('should construct correct URL for different drawing IDs', () => {
      mockHttpController.delete.mockReturnValue(of({}));

      const drawing1 = { ...mockDrawing, drawing_id: 'draw-1' };
      const drawing2 = { ...mockDrawing, drawing_id: 'draw-2' };

      service.delete(mockController, drawing1);
      service.delete(mockController, drawing2);

      expect(mockHttpController.delete).toHaveBeenNthCalledWith(
        1,
        mockController,
        '/projects/project-123/drawings/draw-1'
      );
      expect(mockHttpController.delete).toHaveBeenNthCalledWith(
        2,
        mockController,
        '/projects/project-123/drawings/draw-2'
      );
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero coordinates', () => {
      mockHttpController.post.mockReturnValue(of({}));

      service.add(mockController, 'project-123', 0, 0, '<svg>test</svg>');

      const postCall = mockHttpController.post.mock.calls[0];
      const payload = postCall[2];

      expect(payload.x).toBe(0);
      expect(payload.y).toBe(0);
    });

    it('should handle negative coordinates', () => {
      mockHttpController.post.mockReturnValue(of({}));

      service.add(mockController, 'project-123', -50.5, -100.7, '<svg>test</svg>');

      const postCall = mockHttpController.post.mock.calls[0];
      const payload = postCall[2];

      expect(payload.x).toBe(-50);
      expect(payload.y).toBe(-101);
    });

    it('should handle very large coordinates', () => {
      mockHttpController.post.mockReturnValue(of({}));

      service.add(mockController, 'project-123', 9999.9, 8888.8, '<svg>test</svg>');

      const postCall = mockHttpController.post.mock.calls[0];
      const payload = postCall[2];

      expect(payload.x).toBe(10000);
      expect(payload.y).toBe(8889);
    });

    it('should handle empty svg string', () => {
      mockHttpController.post.mockReturnValue(of({}));

      service.add(mockController, 'project-123', 100, 200, '');

      const postCall = mockHttpController.post.mock.calls[0];
      const payload = postCall[2];

      expect(payload.svg).toBe('');
    });

    it('should handle special characters in svg', () => {
      mockHttpController.post.mockReturnValue(of({}));

      const specialSvg = '<svg><text>Hello & goodbye</text></svg>';
      service.add(mockController, 'project-123', 100, 200, specialSvg);

      const postCall = mockHttpController.post.mock.calls[0];
      const payload = postCall[2];

      expect(payload.svg).toBe(specialSvg);
    });

    it('should handle rotation of 0', () => {
      mockHttpController.post.mockReturnValue(of({}));

      mockDrawing.rotation = 0;
      service.duplicate(mockController, 'project-123', mockDrawing);

      const postCall = mockHttpController.post.mock.calls[0];
      const payload = postCall[2];

      expect(payload.rotation).toBe(0);
    });

    it('should handle rotation of 360', () => {
      mockHttpController.post.mockReturnValue(of({}));

      mockDrawing.rotation = 360;
      service.duplicate(mockController, 'project-123', mockDrawing);

      const postCall = mockHttpController.post.mock.calls[0];
      const payload = postCall[2];

      expect(payload.rotation).toBe(360);
    });

    it('should handle negative rotation', () => {
      mockHttpController.post.mockReturnValue(of({}));

      mockDrawing.rotation = -45;
      service.duplicate(mockController, 'project-123', mockDrawing);

      const postCall = mockHttpController.post.mock.calls[0];
      const payload = postCall[2];

      expect(payload.rotation).toBe(-45);
    });
  });
});
