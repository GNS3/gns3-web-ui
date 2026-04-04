import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GlobalUploadIndicatorComponent } from './global-upload-indicator.component';
import { ImageUploadSessionService, ImageUploadEvent } from '@services/image-upload-session.service';
import { Router } from '@angular/router';
import { ChangeDetectorRef } from '@angular/core';

describe('GlobalUploadIndicatorComponent', () => {
  let component: GlobalUploadIndicatorComponent;
  let fixture: ComponentFixture<GlobalUploadIndicatorComponent>;
  let mockImageUploadSessionService: Partial<ImageUploadSessionService>;
  let mockRouter: Partial<Router>;
  let eventsCallback: ((event: ImageUploadEvent) => void) | null;

  const createMockEvent = (overrides: Partial<ImageUploadEvent> = {}): ImageUploadEvent => ({
    tempId: 'temp-123',
    filename: 'test.img',
    image_type: 'qemu',
    image_size: 1024,
    progress: 0,
    status: 'queued',
    ...overrides,
  });

  beforeEach(async () => {
    eventsCallback = null;

    mockImageUploadSessionService = {
      events$: {
        subscribe: (cb: (event: ImageUploadEvent) => void) => {
          eventsCallback = cb;
          return { unsubscribe: vi.fn() };
        },
      } as any,
      requestCancel: vi.fn(),
    };

    mockRouter = {
      navigate: vi.fn().mockReturnValue(Promise.resolve()),
    };

    await TestBed.configureTestingModule({
      imports: [GlobalUploadIndicatorComponent],
      providers: [
        { provide: ImageUploadSessionService, useValue: mockImageUploadSessionService },
        { provide: Router, useValue: mockRouter },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(GlobalUploadIndicatorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('Component Initialization', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should set isExpanded signal to true by default', () => {
      expect(component.isExpanded()).toBe(true);
    });

    it('should subscribe to upload events on ngOnInit', () => {
      expect(eventsCallback).not.toBeNull();
    });
  });

  describe('uploadList getter', () => {
    it('should return empty array when no uploads exist', () => {
      expect(component.uploadList).toEqual([]);
    });

    it('should return array of upload rows', () => {
      eventsCallback!(createMockEvent({ tempId: 'temp-1', filename: 'image1.img' }));
      eventsCallback!(createMockEvent({ tempId: 'temp-2', filename: 'image2.img' }));

      expect(component.uploadList).toHaveLength(2);
    });
  });

  describe('hasUploads getter', () => {
    it('should return false when no uploads exist', () => {
      expect(component.hasUploads).toBe(false);
    });

    it('should return true when uploads exist', () => {
      eventsCallback!(createMockEvent());

      expect(component.hasUploads).toBe(true);
    });
  });

  describe('activeCount getter', () => {
    it('should return 0 when no uploads exist', () => {
      expect(component.activeCount).toBe(0);
    });

    it('should count only uploading and queued uploads', () => {
      eventsCallback!(createMockEvent({ tempId: 'temp-1', status: 'uploading' }));
      eventsCallback!(createMockEvent({ tempId: 'temp-2', status: 'queued' }));
      eventsCallback!(createMockEvent({ tempId: 'temp-3', status: 'uploaded' }));
      eventsCallback!(createMockEvent({ tempId: 'temp-4', status: 'error' }));

      expect(component.activeCount).toBe(2);
    });
  });

  describe('overallProgress getter', () => {
    it('should return 100 when no active uploads', () => {
      expect(component.overallProgress).toBe(100);
    });

    it('should calculate average progress of active uploads', () => {
      eventsCallback!(createMockEvent({ tempId: 'temp-1', status: 'uploading', progress: 50 }));
      eventsCallback!(createMockEvent({ tempId: 'temp-2', status: 'queued', progress: 0 }));

      expect(component.overallProgress).toBe(25);
    });

    it('should return 100 when all uploads are completed', () => {
      eventsCallback!(createMockEvent({ tempId: 'temp-1', status: 'uploaded', progress: 100 }));

      expect(component.overallProgress).toBe(100);
    });
  });

  describe('cancelUpload', () => {
    it('should call requestCancel on the service', () => {
      component.cancelUpload('temp-123');

      expect(mockImageUploadSessionService.requestCancel).toHaveBeenCalledWith('temp-123');
    });
  });

  describe('navigateToFile', () => {
    it('should navigate to image-manager with controller_id and highlight', () => {
      const mockEvent = createMockEvent({ controller_id: 1 }) as ImageUploadEvent;
      const mouseEvent = { stopPropagation: vi.fn() } as unknown as MouseEvent;

      component.navigateToFile(mockEvent, mouseEvent);

      expect(mockRouter.navigate).toHaveBeenCalledWith(
        ['/controller', 1, 'image-manager'],
        { queryParams: { highlight: 'test.img' } },
      );
    });

    it('should stop event propagation', () => {
      const mockEvent = createMockEvent({ controller_id: 1 }) as ImageUploadEvent;
      const mouseEvent = { stopPropagation: vi.fn() } as unknown as MouseEvent;

      component.navigateToFile(mockEvent, mouseEvent);

      expect(mouseEvent.stopPropagation).toHaveBeenCalled();
    });

    it('should not navigate when controller_id is missing', () => {
      const mockEvent = createMockEvent({ controller_id: undefined }) as ImageUploadEvent;
      const mouseEvent = { stopPropagation: vi.fn() } as unknown as MouseEvent;

      component.navigateToFile(mockEvent, mouseEvent);

      expect(mockRouter.navigate).not.toHaveBeenCalled();
    });
  });

  describe('toggleExpanded', () => {
    it('should toggle isExpanded signal', () => {
      expect(component.isExpanded()).toBe(true);

      component.toggleExpanded();
      expect(component.isExpanded()).toBe(false);

      component.toggleExpanded();
      expect(component.isExpanded()).toBe(true);
    });
  });

  describe('trackByTempId', () => {
    it('should return tempId as track key', () => {
      const row = createMockEvent({ tempId: 'test-123' }) as ImageUploadEvent;

      expect(component.trackByTempId(0, row)).toBe('test-123');
    });

    it('should return different keys for different tempIds', () => {
      const row1 = createMockEvent({ tempId: 'temp-1' }) as ImageUploadEvent;
      const row2 = createMockEvent({ tempId: 'temp-2' }) as ImageUploadEvent;

      expect(component.trackByTempId(0, row1)).not.toBe(component.trackByTempId(0, row2));
    });
  });

  describe('upload event handling', () => {
    it('should add new upload to uploads map', () => {
      eventsCallback!(createMockEvent({ tempId: 'new-upload' }));

      expect(component.uploads.has('new-upload')).toBe(true);
    });

    it('should update existing upload in uploads map', () => {
      eventsCallback!(createMockEvent({ tempId: 'temp-1', progress: 0 }));
      eventsCallback!(createMockEvent({ tempId: 'temp-1', progress: 50 }));

      const upload = component.uploads.get('temp-1') as ImageUploadEvent;
      expect(upload.progress).toBe(50);
    });

    it('should expand indicator when first upload is queued', () => {
      component.isExpanded.set(false);
      eventsCallback!(createMockEvent({ status: 'queued' }));

      expect(component.isExpanded()).toBe(true);
    });

    it('should not expand indicator for subsequent uploads', () => {
      component.isExpanded.set(true);
      eventsCallback!(createMockEvent({ tempId: 'temp-1', status: 'queued' }));
      eventsCallback!(createMockEvent({ tempId: 'temp-2', status: 'queued' }));

      expect(component.isExpanded()).toBe(true);
    });
  });

  describe('ngOnDestroy', () => {
    it('should unsubscribe from events on destroy', () => {
      const unsubscribeSpy = vi.fn();
      Object.defineProperty(mockImageUploadSessionService, 'events$', {
        value: {
          subscribe: (cb: (event: ImageUploadEvent) => void) => {
            eventsCallback = cb;
            return { unsubscribe: unsubscribeSpy };
          },
        },
        writable: true,
        configurable: true,
      });

      const newFixture = TestBed.createComponent(GlobalUploadIndicatorComponent);
      const newComponent = newFixture.componentInstance;
      newFixture.detectChanges();
      newFixture.destroy();

      expect(unsubscribeSpy).toHaveBeenCalled();
    });
  });
});
