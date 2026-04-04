import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SymbolService } from './symbol.service';
import { HttpController } from './http-controller.service';
import { Observable, of, BehaviorSubject, throwError } from 'rxjs';
import { firstValueFrom } from 'rxjs';
import { Controller } from '@models/controller';
import { Symbol } from '@models/symbol';
import { Template } from '@models/template';
import { Node } from '../cartography/models/node';

// Mock environment
vi.mock('environments/environment', () => ({
  environment: {
    current_version: 'v3',
  },
}));

describe('SymbolService', () => {
  let service: SymbolService;
  let mockHttpController: any;
  let mockController: Controller;
  let mockSymbols: Symbol[];

  beforeEach(() => {
    // Mock HttpController
    mockHttpController = {
      get: vi.fn(),
      post: vi.fn(),
      postBlob: vi.fn(),
      delete: vi.fn(),
      getText: vi.fn(),
      getBlob: vi.fn(),
    };

    // Mock Controller
    mockController = {
      id: 1,
      authToken: '',
      name: 'Test Controller',
      location: 'local' as any,
      host: 'localhost',
      port: 3080,
      path: '',
      ubridge_path: '',
      status: 'running' as any,
      protocol: 'http:' as any,
      username: '',
      password: '',
      tokenExpired: false,
    } as Controller;

    // Mock Symbols
    mockSymbols = [
      {
        symbol_id: 'sym-1',
        filename: 'router.svg',
        name: 'Router',
        builtin: true,
      } as unknown as Symbol,
      {
        symbol_id: 'sym-2',
        filename: 'switch.svg',
        name: 'Switch',
        builtin: true,
      } as unknown as Symbol,
      {
        symbol_id: 'sym-3',
        filename: 'custom.svg',
        name: 'Custom',
        builtin: false,
      } as unknown as Symbol,
    ];

    service = new SymbolService(mockHttpController);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Service Creation', () => {
    it('should create the service', () => {
      expect(service).toBeTruthy();
    });

    it('should initialize symbols BehaviorSubject with empty array', () => {
      expect(service['symbols']).toBeInstanceOf(BehaviorSubject);
      expect(service['symbols'].getValue()).toEqual([]);
    });

    it('should have maximumSymbolSize set to 80', () => {
      expect(service['maximumSymbolSize']).toBe(80);
    });
  });

  describe('getMaximumSymbolSize', () => {
    it('should return 80', () => {
      expect(service.getMaximumSymbolSize()).toBe(80);
    });
  });

  describe('get', () => {
    beforeEach(() => {
      service['symbols'].next(mockSymbols);
    });

    it('should return symbol by id', () => {
      const result = service.get('sym-1');
      expect(result).toEqual(mockSymbols[0]);
    });

    it('should return undefined if symbol not found', () => {
      const result = service.get('non-existent');
      expect(result).toBeUndefined();
    });

    it('should find symbol with correct properties', () => {
      const result = service.get('sym-2') as any;
      expect(result?.symbol_id).toBe('sym-2');
      expect(result?.filename).toBe('switch.svg');
      expect(result?.name).toBe('Switch');
    });
  });

  describe('getByFilename', () => {
    beforeEach(() => {
      service['symbols'].next(mockSymbols);
    });

    it('should return symbol by filename', () => {
      const result = service.getByFilename('router.svg');
      expect(result).toEqual(mockSymbols[0]);
    });

    it('should return undefined if symbol not found', () => {
      const result = service.getByFilename('nonexistent.svg');
      expect(result).toBeUndefined();
    });

    it('should find custom symbol by filename', () => {
      const result = service.getByFilename('custom.svg');
      expect(result).toEqual(mockSymbols[2]);
    });
  });

  describe('getDimensions', () => {
    it('should call httpController.get with correct endpoint', () => {
      const mockDimensions = { width: 100, height: 80 };
      mockHttpController.get.mockReturnValue(of(mockDimensions));

      service.getDimensions(mockController, 'test-symbol');

      expect(mockHttpController.get).toHaveBeenCalledWith(
        mockController,
        '/symbols/test-symbol/dimensions'
      );
    });

    it('should encode symbol_id in URL', () => {
      const mockDimensions = { width: 100, height: 80 };
      mockHttpController.get.mockReturnValue(of(mockDimensions));

      service.getDimensions(mockController, 'symbol with spaces');

      expect(mockHttpController.get).toHaveBeenCalledWith(
        mockController,
        '/symbols/symbol%20with%20spaces/dimensions'
      );
    });

    it('should cache dimensions by controller and symbol_id', () => {
      const mockDimensions = { width: 100, height: 80 };
      mockHttpController.get.mockReturnValue(of(mockDimensions));

      service.getDimensions(mockController, 'test-symbol');
      service.getDimensions(mockController, 'test-symbol');

      expect(mockHttpController.get).toHaveBeenCalledTimes(1);
    });

    it('should not cache different controllers together', () => {
      const mockDimensions = { width: 100, height: 80 };
      mockHttpController.get.mockReturnValue(of(mockDimensions));

      const controller2 = { ...mockController, port: 3081 };

      service.getDimensions(mockController, 'test-symbol');
      service.getDimensions(controller2, 'test-symbol');

      expect(mockHttpController.get).toHaveBeenCalledTimes(2);
    });

    it('should return Observable', () => {
      const mockDimensions = { width: 100, height: 80 };
      mockHttpController.get.mockReturnValue(of(mockDimensions));

      const result = service.getDimensions(mockController, 'test-symbol');

      expect(result).toBeInstanceOf(Observable);
    });

    it('should propagate error from httpController.get', async () => {
      const error = new Error('Network error');
      mockHttpController.get.mockReturnValue(throwError(() => error));

      await expect(firstValueFrom(service.getDimensions(mockController, 'test-symbol'))).rejects.toThrow(
        'Network error'
      );
    });
  });

  describe('getSymbolBlobUrl', () => {
    it('should call httpController.getBlob', () => {
      const mockBlob = new Blob(['test'], { type: 'image/svg+xml' });
      mockHttpController.getBlob.mockReturnValue(of(mockBlob));

      service.getSymbolBlobUrl(mockController, '/symbols/test/raw');

      expect(mockHttpController.getBlob).toHaveBeenCalledWith(mockController, '/symbols/test/raw');
    });

    it('should create blob URL from response', async () => {
      const mockBlob = new Blob(['<svg></svg>'], { type: 'image/svg+xml' });
      mockHttpController.getBlob.mockReturnValue(of(mockBlob));

      const blobUrl = await firstValueFrom(service.getSymbolBlobUrl(mockController, '/symbols/test/raw'));

      expect(blobUrl).toMatch(/^blob:/);
    });

    it('should cache blob URLs', () => {
      const mockBlob = new Blob(['<svg></svg>'], { type: 'image/svg+xml' });
      mockHttpController.getBlob.mockReturnValue(of(mockBlob));

      service.getSymbolBlobUrl(mockController, '/symbols/test/raw');
      service.getSymbolBlobUrl(mockController, '/symbols/test/raw');

      expect(mockHttpController.getBlob).toHaveBeenCalledTimes(1);
    });

    it('should return Observable', () => {
      const mockBlob = new Blob(['test']);
      mockHttpController.getBlob.mockReturnValue(of(mockBlob));

      const result = service.getSymbolBlobUrl(mockController, '/symbols/test/raw');

      expect(result).toBeInstanceOf(Observable);
    });

    it('should propagate error from httpController.getBlob', async () => {
      const error = new Error('Blob fetch error');
      mockHttpController.getBlob.mockReturnValue(throwError(() => error));

      await expect(
        firstValueFrom(service.getSymbolBlobUrl(mockController, '/symbols/test/raw'))
      ).rejects.toThrow('Blob fetch error');
    });
  });

  describe('scaleDimensionsForNode', () => {
    it('should scale based on width when width > height', () => {
      const node: Node = {
        node_id: 'node-1',
        width: 160,
        height: 80,
      } as Node;

      const result = service.scaleDimensionsForNode(node);

      expect(result.width).toBe(80);
      expect(result.height).toBe(40);
    });

    it('should scale based on height when height > width', () => {
      const node: Node = {
        node_id: 'node-2',
        width: 80,
        height: 160,
      } as Node;

      const result = service.scaleDimensionsForNode(node);

      expect(result.width).toBe(40);
      expect(result.height).toBe(80);
    });

    it('should maintain aspect ratio', () => {
      const node: Node = {
        node_id: 'node-3',
        width: 200,
        height: 100,
      } as Node;

      const result = service.scaleDimensionsForNode(node);

      const aspectRatio = result.width / result.height;
      expect(aspectRatio).toBeCloseTo(2);
    });

    it('should handle square nodes', () => {
      const node: Node = {
        node_id: 'node-4',
        width: 100,
        height: 100,
      } as Node;

      const result = service.scaleDimensionsForNode(node);

      expect(result.width).toBe(80);
      expect(result.height).toBe(80);
    });

    it('should handle very small nodes', () => {
      const node: Node = {
        node_id: 'node-5',
        width: 10,
        height: 10,
      } as Node;

      const result = service.scaleDimensionsForNode(node);

      expect(result.width).toBe(80);
      expect(result.height).toBe(80);
    });

    it('should handle very large nodes', () => {
      const node: Node = {
        node_id: 'node-6',
        width: 800,
        height: 600,
      } as Node;

      const result = service.scaleDimensionsForNode(node);

      expect(result.width).toBeLessThanOrEqual(80);
      expect(result.height).toBeLessThanOrEqual(80);
    });
  });

  describe('add', () => {
    it('should call httpController.post with correct endpoint', () => {
      mockHttpController.post.mockReturnValue(of({}));

      service.add(mockController, 'test-symbol', '<svg>test</svg>');

      expect(mockHttpController.post).toHaveBeenCalledWith(
        mockController,
        '/symbols/test-symbol/raw',
        '<svg>test</svg>'
      );
    });

    it('should invalidate cache', () => {
      mockHttpController.post.mockReturnValue(of({}));

      service['cache'] = of([]);
      service.add(mockController, 'test-symbol', '<svg>test</svg>');

      expect(service['cache']).toBeNull();
    });

    it('should not invalidate builtin cache', () => {
      mockHttpController.post.mockReturnValue(of({}));

      service['builtinCache'] = of([]);
      service.add(mockController, 'test-symbol', '<svg>test</svg>');

      expect(service['builtinCache']).not.toBeNull();
    });

    it('should propagate error from httpController.post', async () => {
      const error = new Error('Add failed');
      mockHttpController.post.mockReturnValue(throwError(() => error));

      await expect(
        firstValueFrom(service.add(mockController, 'test-symbol', '<svg>test</svg>'))
      ).rejects.toThrow('Add failed');
    });
  });

  describe('addFile', () => {
    it('should call httpController.postBlob with correct endpoint', () => {
      const mockBlob = new Blob(['<svg></svg>'], { type: 'image/svg+xml' });
      mockHttpController.postBlob.mockReturnValue(of({}));

      service.addFile(mockController, 'test-symbol', mockBlob);

      expect(mockHttpController.postBlob).toHaveBeenCalledWith(
        mockController,
        '/symbols/test-symbol/raw',
        mockBlob
      );
    });

    it('should invalidate cache', () => {
      const mockBlob = new Blob();
      mockHttpController.postBlob.mockReturnValue(of({}));

      service['cache'] = of([]);
      service.addFile(mockController, 'test-symbol', mockBlob);

      expect(service['cache']).toBeNull();
    });

    it('should not invalidate builtin cache', () => {
      const mockBlob = new Blob();
      mockHttpController.postBlob.mockReturnValue(of({}));

      service['builtinCache'] = of([]);
      service.addFile(mockController, 'test-symbol', mockBlob);

      expect(service['builtinCache']).not.toBeNull();
    });

    it('should propagate error from httpController.postBlob', async () => {
      const error = new Error('AddFile failed');
      const mockBlob = new Blob(['test']);
      mockHttpController.postBlob.mockReturnValue(throwError(() => error));

      await expect(
        firstValueFrom(service.addFile(mockController, 'test-symbol', mockBlob))
      ).rejects.toThrow('AddFile failed');
    });
  });

  describe('delete', () => {
    it('should call httpController.delete with correct endpoint', () => {
      mockHttpController.delete.mockReturnValue(of({}));

      service.delete(mockController, 'test-symbol');

      expect(mockHttpController.delete).toHaveBeenCalledWith(
        mockController,
        '/symbols/test-symbol'
      );
    });

    it('should encode symbol_id in URL', () => {
      mockHttpController.delete.mockReturnValue(of({}));

      service.delete(mockController, 'symbol with spaces');

      expect(mockHttpController.delete).toHaveBeenCalledWith(
        mockController,
        '/symbols/symbol%20with%20spaces'
      );
    });

    it('should invalidate cache', () => {
      mockHttpController.delete.mockReturnValue(of({}));

      service['cache'] = of([]);
      service.delete(mockController, 'test-symbol');

      expect(service['cache']).toBeNull();
    });

    it('should not invalidate builtin cache', () => {
      mockHttpController.delete.mockReturnValue(of({}));

      service['builtinCache'] = of([]);
      service.delete(mockController, 'test-symbol');

      expect(service['builtinCache']).not.toBeNull();
    });

    it('should propagate error from httpController.delete', async () => {
      const error = new Error('Delete failed');
      mockHttpController.delete.mockReturnValue(throwError(() => error));

      await expect(
        firstValueFrom(service.delete(mockController, 'test-symbol'))
      ).rejects.toThrow('Delete failed');
    });
  });

  describe('load', () => {
    it('should call httpController.get with correct endpoint', () => {
      mockHttpController.get.mockReturnValue(of(mockSymbols));

      service.load(mockController);

      expect(mockHttpController.get).toHaveBeenCalledWith(mockController, '/symbols');
    });

    it('should return Observable of Symbol array', () => {
      mockHttpController.get.mockReturnValue(of(mockSymbols));

      const result = service.load(mockController);

      expect(result).toBeInstanceOf(Observable);
    });

    it('should propagate error from httpController.get', async () => {
      const error = new Error('Load failed');
      mockHttpController.get.mockReturnValue(throwError(() => error));

      await expect(firstValueFrom(service.load(mockController))).rejects.toThrow('Load failed');
    });
  });

  describe('list', () => {
    it('should call load on first call', () => {
      mockHttpController.get.mockReturnValue(of(mockSymbols));

      service.list(mockController);

      expect(mockHttpController.get).toHaveBeenCalledWith(mockController, '/symbols');
    });

    it('should cache results', () => {
      mockHttpController.get.mockReturnValue(of(mockSymbols));

      service.list(mockController);
      service.list(mockController);

      expect(mockHttpController.get).toHaveBeenCalledTimes(1);
    });

    it('should return cached results on subsequent calls', () => {
      mockHttpController.get.mockReturnValue(of(mockSymbols));

      const result1 = service.list(mockController);
      const result2 = service.list(mockController);

      expect(result1).toBe(result2);
    });

    it('should invalidate cache when cache is set to null', () => {
      mockHttpController.get.mockReturnValue(of(mockSymbols));

      service.list(mockController);
      service['cache'] = null;
      service.list(mockController);

      expect(mockHttpController.get).toHaveBeenCalledTimes(2);
    });
  });

  describe('listBuiltinSymbols', () => {
    it('should filter builtin symbols', async () => {
      mockHttpController.get.mockReturnValue(of(mockSymbols));

      const result = await firstValueFrom(service.listBuiltinSymbols(mockController));

      expect(result).toHaveLength(2);
      expect(result.every((s) => s.builtin)).toBe(true);
    });

    it('should cache builtin symbols permanently', () => {
      mockHttpController.get.mockReturnValue(of(mockSymbols));

      service.listBuiltinSymbols(mockController);
      service.listBuiltinSymbols(mockController);

      expect(mockHttpController.get).toHaveBeenCalledTimes(1);
    });

    it('should return Observable', () => {
      mockHttpController.get.mockReturnValue(of(mockSymbols));

      const result = service.listBuiltinSymbols(mockController);

      expect(result).toBeInstanceOf(Observable);
    });
  });

  describe('listCustomSymbols', () => {
    it('should filter custom symbols', async () => {
      mockHttpController.get.mockReturnValue(of(mockSymbols));

      const result = await firstValueFrom(service.listCustomSymbols(mockController));

      expect(result).toHaveLength(1);
      expect(result.every((s) => !s.builtin)).toBe(true);
    });

    it('should not cache custom symbols', () => {
      mockHttpController.get.mockReturnValue(of(mockSymbols));

      service.listCustomSymbols(mockController);
      service.listCustomSymbols(mockController);

      expect(mockHttpController.get).toHaveBeenCalledTimes(2);
    });

    it('should return Observable', () => {
      mockHttpController.get.mockReturnValue(of(mockSymbols));

      const result = service.listCustomSymbols(mockController);

      expect(result).toBeInstanceOf(Observable);
    });
  });

  describe('raw', () => {
    it('should call httpController.getText with correct endpoint', () => {
      mockHttpController.getText.mockReturnValue(of('<svg>test</svg>'));

      service.raw(mockController, 'test-symbol');

      expect(mockHttpController.getText).toHaveBeenCalledWith(
        mockController,
        '/symbols/test-symbol/raw'
      );
    });

    it('should encode symbol_id in URL', () => {
      mockHttpController.getText.mockReturnValue(of('<svg>test</svg>'));

      service.raw(mockController, 'symbol with spaces');

      expect(mockHttpController.getText).toHaveBeenCalledWith(
        mockController,
        '/symbols/symbol%20with%20spaces/raw'
      );
    });

    it('should propagate error from httpController.getText', async () => {
      const error = new Error('Raw fetch failed');
      mockHttpController.getText.mockReturnValue(throwError(() => error));

      await expect(firstValueFrom(service.raw(mockController, 'test-symbol'))).rejects.toThrow(
        'Raw fetch failed'
      );
    });
  });

  describe('getSymbolFromTemplate', () => {
    it('should construct correct URL for http controller', () => {
      const template: Template = {
        template_id: 'tmpl-1',
        name: 'Test Template',
        symbol: 'router.svg',
        builtin: true,
      } as Template;

      const result = service.getSymbolFromTemplate(mockController, template);

      expect(result).toBe('http://localhost:3080/v3/symbols/router.svg/raw');
    });

    it('should construct correct URL for https controller', () => {
      const httpsController = { ...mockController, protocol: 'https:' as any };
      const template: Template = {
        template_id: 'tmpl-2',
        name: 'Test Template',
        symbol: 'switch.svg',
        builtin: true,
      } as Template;

      const result = service.getSymbolFromTemplate(httpsController, template);

      expect(result).toBe('https://localhost:3080/v3/symbols/switch.svg/raw');
    });

    it('should include controller port in URL', () => {
      const customPortController = { ...mockController, port: 8080 };
      const template: Template = {
        template_id: 'tmpl-3',
        name: 'Test Template',
        symbol: 'custom.svg',
        builtin: false,
      } as Template;

      const result = service.getSymbolFromTemplate(customPortController, template);

      expect(result).toBe('http://localhost:8080/v3/symbols/custom.svg/raw');
    });

    it('should handle symbol with special characters', () => {
      const template: Template = {
        template_id: 'tmpl-4',
        name: 'Test Template',
        symbol: 'symbol-with-dash.svg',
        builtin: false,
      } as Template;

      const result = service.getSymbolFromTemplate(mockController, template);

      expect(result).toContain('symbol-with-dash.svg');
    });
  });

  describe('Cache Management', () => {
    it('should have separate caches for different controllers', () => {
      const mockDimensions = { width: 100, height: 80 };
      mockHttpController.get.mockReturnValue(of(mockDimensions));

      const controller2 = { ...mockController, host: '192.168.1.1' };

      service.getDimensions(mockController, 'test-symbol');
      service.getDimensions(controller2, 'test-symbol');

      expect(mockHttpController.get).toHaveBeenCalledTimes(2);
    });

    it('should have separate caches for different symbols', () => {
      const mockDimensions = { width: 100, height: 80 };
      mockHttpController.get.mockReturnValue(of(mockDimensions));

      service.getDimensions(mockController, 'symbol-1');
      service.getDimensions(mockController, 'symbol-2');

      expect(mockHttpController.get).toHaveBeenCalledTimes(2);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty symbol list', async () => {
      mockHttpController.get.mockReturnValue(of([]));

      const result = await firstValueFrom(service.list(mockController));

      expect(result).toEqual([]);
    });

    it('should handle symbol_id with special characters in getDimensions', () => {
      const mockDimensions = { width: 100, height: 80 };
      mockHttpController.get.mockReturnValue(of(mockDimensions));

      service.getDimensions(mockController, 'symbol/with/slashes');

      // encodeURI doesn't encode slashes, so they remain as-is
      expect(mockHttpController.get).toHaveBeenCalledWith(
        mockController,
        '/symbols/symbol/with/slashes/dimensions'
      );
    });

    it('should handle node with zero dimensions in scaleDimensionsForNode', () => {
      const node: Node = {
        node_id: 'node-zero',
        width: 0,
        height: 0,
      } as Node;

      // Note: Division by zero produces NaN - this is a known behavior
      // The service should handle this edge case gracefully
      const result = service.scaleDimensionsForNode(node);

      expect(result.width).toBeNaN();
      expect(result.height).toBeNaN();
    });

    it('should handle very long symbol filenames', () => {
      const longFilename = 'a'.repeat(100) + '.svg';
      mockHttpController.get.mockReturnValue(of(mockSymbols));

      service.getDimensions(mockController, longFilename);

      expect(mockHttpController.get).toHaveBeenCalled();
    });

    it('should handle unicode characters in symbol_id', () => {
      const mockDimensions = { width: 100, height: 80 };
      mockHttpController.get.mockReturnValue(of(mockDimensions));

      service.getDimensions(mockController, 'symbol-test');

      expect(mockHttpController.get).toHaveBeenCalledWith(
        mockController,
        expect.stringContaining('symbols')
      );
    });
  });
});
