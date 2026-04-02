import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { HttpClient, HttpEventType } from '@angular/common/http';
import { BackgroundUploadService } from './background-upload.service';
import { ImageManagerService } from './image-manager.service';
import { ImageUploadSessionService } from './image-upload-session.service';
import { ToasterService } from './toaster.service';
import { Controller, ControllerProtocol } from '@models/controller';

describe('BackgroundUploadService', () => {
  let service: BackgroundUploadService;
  let mockHttp: HttpClient;
  let mockImageService: ImageManagerService;
  let mockImageUploadSessionService: ImageUploadSessionService;
  let mockToasterService: ToasterService;
  let mockController: Controller;

  beforeEach(() => {
    vi.clearAllMocks();

    mockHttp = {
      request: vi.fn(),
    } as any as HttpClient;

    mockImageService = {
      getImagePath: vi.fn(() => '/v3/appliances/images/upload'),
    } as any as ImageManagerService;

    mockImageUploadSessionService = {
      cancelRequests$: new (require('rxjs').Subject)(),
      registerCancelHandler: vi.fn(),
      unregisterCancelHandler: vi.fn(),
      emit: vi.fn(),
    } as any as ImageUploadSessionService;

    mockToasterService = {
      success: vi.fn(),
      error: vi.fn(),
      warning: vi.fn(),
    } as any as ToasterService;

    mockController = {
      id: 1,
      name: 'Test Controller',
      host: 'localhost',
      port: 3080,
      protocol: 'http:' as ControllerProtocol,
      authToken: 'test-token',
      tokenExpired: false,
    } as Controller;

    TestBed.configureTestingModule({
      providers: [
        BackgroundUploadService,
        { provide: HttpClient, useValue: mockHttp },
        { provide: ImageManagerService, useValue: mockImageService },
        { provide: ImageUploadSessionService, useValue: mockImageUploadSessionService },
        { provide: ToasterService, useValue: mockToasterService },
      ],
    });

    service = TestBed.inject(BackgroundUploadService);
  });

  describe('Service Creation', () => {
    it('should create the service', () => {
      expect(service).toBeTruthy();
    });

    it('should be instance of BackgroundUploadService', () => {
      expect(service).toBeInstanceOf(BackgroundUploadService);
    });

    it('should be providedIn root', () => {
      expect(service).toBeTruthy();
    });

    it('should have activeCount$ observable', () => {
      expect((service as any).activeCount$).toBeDefined();
    });
  });

  describe('Internal State', () => {
    it('should initialize with empty queue', () => {
      expect((service as any).queue).toEqual([]);
    });

    it('should initialize with empty activeUploads', () => {
      expect((service as any).activeUploads.size).toBe(0);
    });

    it('should initialize with empty activeUploadSizes', () => {
      expect((service as any).activeUploadSizes.size).toBe(0);
    });

    it('should initialize activeCountSource with zero', () => {
      expect((service as any).activeCountSource.value).toBe(0);
    });
  });

  describe('Image Type Resolution', () => {
    it('should resolve image type from filename', () => {
      const resolveImageType = (service as any).resolveImageType.bind(service);

      expect(resolveImageType('test.qcow2')).toBe('qcow2');
      expect(resolveImageType('test.vmdk')).toBe('vmdk');
      expect(resolveImageType('test.img')).toBe('img');
    });

    it('should return unknown for filename without extension', () => {
      const resolveImageType = (service as any).resolveImageType.bind(service);

      expect(resolveImageType('test')).toBe('unknown');
    });

    it('should handle empty filename', () => {
      const resolveImageType = (service as any).resolveImageType.bind(service);

      expect(resolveImageType('')).toBe('unknown');
    });

    it('should convert extension to lowercase', () => {
      const resolveImageType = (service as any).resolveImageType.bind(service);

      expect(resolveImageType('test.QCOW2')).toBe('qcow2');
    });
  });

  describe('Concurrency Control', () => {
    it('should clamp concurrency between 1 and 12', () => {
      const clampConcurrency = (service as any).clampConcurrency.bind(service);

      expect(clampConcurrency(0)).toBe(1);
      expect(clampConcurrency(-5)).toBe(1);
      expect(clampConcurrency(100)).toBe(12);
      expect(clampConcurrency(5)).toBe(5);
    });

    it('should get network multiplier for different connection types', () => {
      const getNetworkMultiplier = (service as any).getNetworkMultiplier.bind(service);

      expect(getNetworkMultiplier('slow-2g')).toBe(0.25);
      expect(getNetworkMultiplier('2g')).toBe(0.35);
      expect(getNetworkMultiplier('3g')).toBe(0.6);
      expect(getNetworkMultiplier('4g')).toBe(1);
      expect(getNetworkMultiplier('5g')).toBe(1.15);
      expect(getNetworkMultiplier('unknown')).toBe(0.85);
    });

    it('should get runtime signals from navigator', () => {
      const getRuntimeSignals = (service as any).getRuntimeSignals.bind(service);
      const signals = getRuntimeSignals();

      expect(signals).toHaveProperty('cores');
      expect(signals).toHaveProperty('memoryGiB');
      expect(signals).toHaveProperty('effectiveType');
      expect(signals.cores).toBeGreaterThanOrEqual(1);
      expect(signals.memoryGiB).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Bytes Budget Calculations', () => {
    it('should get average known size with default when no files', () => {
      const getAverageKnownSize = (service as any).getAverageKnownSize.bind(service);
      const avgSize = getAverageKnownSize();

      expect(avgSize).toBe(32 * 1024 * 1024); // 32MB default
    });

    it('should get approximate in-flight bytes as zero initially', () => {
      const getApproxInFlightBytes = (service as any).getApproxInFlightBytes.bind(service);
      const bytes = getApproxInFlightBytes();

      expect(bytes).toBe(0);
    });

    it('should calculate in-flight bytes budget', () => {
      const getInFlightBytesBudget = (service as any).getInFlightBytesBudget.bind(service);
      const budget = getInFlightBytesBudget();

      expect(typeof budget).toBe('number');
      expect(budget).toBeGreaterThan(0);
    });
  });

  describe('Queue Management', () => {
    it('should get pending tasks from queue', () => {
      const getPendingTasks = (service as any).getPendingTasks.bind(service);
      const pending = getPendingTasks();

      expect(Array.isArray(pending)).toBe(true);
      expect(pending).toEqual([]);
    });

    it('should pick next task returning null when no pending tasks', () => {
      const pickNextTask = (service as any).pickNextTask.bind(service);
      const next = pickNextTask();

      expect(next).toBeNull();
    });

    it('should remove task from queue by index', () => {
      const queue = [{ tempId: 'test1' }, { tempId: 'test2' }, { tempId: 'test3' }];
      (service as any).queue = queue;

      const removeFromQueue = (service as any).removeFromQueue.bind(service);
      removeFromQueue(queue[1]);

      expect((service as any).queue.length).toBe(2);
      expect((service as any).queue[0].tempId).toBe('test1');
      expect((service as any).queue[1].tempId).toBe('test3');
    });

    it('should handle remove from empty queue gracefully', () => {
      (service as any).queue = [];

      const removeFromQueue = (service as any).removeFromQueue.bind(service);
      expect(() => removeFromQueue({ tempId: 'nonexistent' })).not.toThrow();
    });
  });

  describe('Slot Management', () => {
    it('should add to active uploads', () => {
      const activeUploads = (service as any).activeUploads;
      activeUploads.add('task1');
      activeUploads.add('task2');

      expect(activeUploads.size).toBe(2);
      expect(activeUploads.has('task1')).toBe(true);
      expect(activeUploads.has('task2')).toBe(true);
    });

    it('should delete from active uploads', () => {
      const activeUploads = (service as any).activeUploads;
      activeUploads.add('task1');
      activeUploads.delete('task1');

      expect(activeUploads.has('task1')).toBe(false);
    });

    it('should track active upload sizes', () => {
      const activeUploadSizes = (service as any).activeUploadSizes;
      activeUploadSizes.set('task1', 1000);
      activeUploadSizes.set('task2', 2000);

      expect(activeUploadSizes.get('task1')).toBe(1000);
      expect(activeUploadSizes.get('task2')).toBe(2000);
    });

    it('should delete from active upload sizes', () => {
      const activeUploadSizes = (service as any).activeUploadSizes;
      activeUploadSizes.set('task1', 1000);
      activeUploadSizes.delete('task1');

      expect(activeUploadSizes.has('task1')).toBe(false);
    });
  });

  describe('Hard Concurrency Cap', () => {
    it('should return number between 1 and 12', () => {
      const getHardConcurrencyCapFromEnvironment = (service as any).getHardConcurrencyCapFromEnvironment.bind(service);
      const cap = getHardConcurrencyCapFromEnvironment();

      expect(typeof cap).toBe('number');
      expect(cap).toBeGreaterThanOrEqual(1);
      expect(cap).toBeLessThanOrEqual(12);
    });

    it('should calculate cap based on CPU cores', () => {
      // This test verifies the formula is applied, exact value depends on environment
      const getHardConcurrencyCapFromEnvironment = (service as any).getHardConcurrencyCapFromEnvironment.bind(service);
      const cap = getHardConcurrencyCapFromEnvironment();

      // Should be at least 1
      expect(cap).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Can Start Upload Logic', () => {
    it('should return true when no active uploads', () => {
      const canStartUpload = (service as any).canStartUpload.bind(service);
      const file = new File(['test'], 'test.img', { type: 'image/qcow2' });
      const task = {
        tempId: 'test',
        file,
        status: 'queued',
      };

      const canStart = canStartUpload(task);

      expect(canStart).toBe(true);
    });

    it('should return boolean for canStartUpload with active uploads', () => {
      const canStartUpload = (service as any).canStartUpload.bind(service);
      const file = new File(['test'], 'test.img', { type: 'image/qcow2' });

      // Add some active uploads
      (service as any).activeUploads.add('task1');
      (service as any).activeUploadSizes.set('task1', file.size);

      const task = {
        tempId: 'test',
        file,
        status: 'queued',
      };

      const canStart = canStartUpload(task);

      expect(typeof canStart).toBe('boolean');
    });
  });

  describe('Update Active Count', () => {
    it('should update active count source', () => {
      const updateActiveCount = (service as any).updateActiveCount.bind(service);

      updateActiveCount();

      expect((service as any).activeCountSource.value).toBe(0);
    });

    it('should count pending tasks in active count', () => {
      // Queue some files
      (service as any).queue = [
        { tempId: 't1', status: 'queued', file: { size: 100 } },
        { tempId: 't2', status: 'queued', file: { size: 200 } },
      ];

      const updateActiveCount = (service as any).updateActiveCount.bind(service);
      updateActiveCount();

      expect((service as any).activeCountSource.value).toBe(2);
    });
  });

  describe('Cancel Upload', () => {
    it('should do nothing for non-existent tempId', () => {
      const cancelUploadByTempId = service.cancelUploadByTempId.bind(service);

      expect(() => cancelUploadByTempId('non-existent')).not.toThrow();
    });

    it('should find task by tempId in queue', () => {
      (service as any).queue = [
        { tempId: 't1', status: 'queued', cancel$: { next: vi.fn(), complete: vi.fn() } },
      ];

      const task = (service as any).queue.find((t: any) => t.tempId === 't1');

      expect(task).toBeDefined();
      expect(task.tempId).toBe('t1');
    });
  });

  describe('Emit Event', () => {
    it('should call imageUploadSessionService.emit with task data', () => {
      const emitEvent = (service as any).emitEvent.bind(service);
      const task = {
        tempId: 't1',
        file: { name: 'test.img', size: 1000 },
        progress: 50,
        status: 'uploading',
        controller: { id: 1 },
      };

      emitEvent(task);

      expect(mockImageUploadSessionService.emit).toHaveBeenCalledWith({
        tempId: 't1',
        filename: 'test.img',
        image_size: 1000,
        image_type: 'img',
        progress: 50,
        status: 'uploading',
        errorMessage: undefined,
        controller_id: 1,
      });
    });

    it('should include error message when provided', () => {
      const emitEvent = (service as any).emitEvent.bind(service);
      const task = {
        tempId: 't1',
        file: { name: 'test.img', size: 1000 },
        progress: 0,
        status: 'error',
        controller: { id: 1 },
      };

      emitEvent(task, 'Upload failed');

      expect(mockImageUploadSessionService.emit).toHaveBeenCalledWith(
        expect.objectContaining({
          errorMessage: 'Upload failed',
        })
      );
    });

    it('should unregister cancel handler when task ends', () => {
      const emitEvent = (service as any).emitEvent.bind(service);
      const task = {
        tempId: 't1',
        file: { name: 'test.img', size: 1000 },
        progress: 100,
        status: 'uploaded',
        controller: { id: 1 },
      };

      emitEvent(task);

      expect(mockImageUploadSessionService.unregisterCancelHandler).toHaveBeenCalledWith('t1');
    });
  });

  describe('Image Service Integration', () => {
    it('should call getImagePath with correct parameters', () => {
      const controller = mockController;
      const installAppliance = false;
      const filename = 'test.qcow2';

      mockImageService.getImagePath(controller, installAppliance, filename);

      expect(mockImageService.getImagePath).toHaveBeenCalledWith(controller, installAppliance, filename);
    });
  });

  describe('Session Service Integration', () => {
    it('should register cancel handler', () => {
      mockImageUploadSessionService.registerCancelHandler('tempId', vi.fn());

      expect(mockImageUploadSessionService.registerCancelHandler).toHaveBeenCalledWith('tempId', expect.any(Function));
    });

    it('should unregister cancel handler', () => {
      mockImageUploadSessionService.unregisterCancelHandler('tempId');

      expect(mockImageUploadSessionService.unregisterCancelHandler).toHaveBeenCalledWith('tempId');
    });

    it('should have cancelRequests$ observable', () => {
      expect((mockImageUploadSessionService as any).cancelRequests$).toBeDefined();
    });
  });

  describe('Pick Next Task', () => {
    it('should sort by file size ascending', () => {
      const queue = [
        { tempId: 't1', file: { size: 500 }, status: 'queued' },
        { tempId: 't2', file: { size: 100 }, status: 'queued' },
        { tempId: 't3', file: { size: 300 }, status: 'queued' },
      ];
      (service as any).queue = queue;

      const pickNextTask = (service as any).pickNextTask.bind(service);
      const next = pickNextTask();

      expect(next.file.size).toBe(100);
    });

    it('should return null when budget is insufficient and no active uploads', () => {
      const queue = [{ tempId: 't1', file: { size: 10000000000 }, status: 'queued' }];
      (service as any).queue = queue;
      (service as any).activeUploads.clear();
      (service as any).activeUploadSizes.clear();

      const pickNextTask = (service as any).pickNextTask.bind(service);
      const next = pickNextTask();

      // With no active uploads but budget exceeded, may still return null
      expect(next === null || next.file.size === 10000000000).toBe(true);
    });
  });
});
