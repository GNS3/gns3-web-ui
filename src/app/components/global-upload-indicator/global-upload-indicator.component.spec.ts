import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { GlobalUploadIndicatorComponent } from './global-upload-indicator.component';
import { ImageUploadEvent, ImageUploadSessionService } from '@services/image-upload-session.service';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('GlobalUploadIndicatorComponent', () => {
  let fixture: ComponentFixture<GlobalUploadIndicatorComponent>;
  let eventsSubject: Subject<ImageUploadEvent>;
  let mockImageUploadService: any;
  let mockRouter: any;

  const createUploadEvent = (overrides: Partial<ImageUploadEvent> = {}): ImageUploadEvent => ({
    tempId: 'temp-1',
    filename: 'test-image.img',
    image_type: 'qemu',
    image_size: 1024,
    progress: 0,
    status: 'queued',
    ...overrides,
  });

  beforeEach(async () => {
    eventsSubject = new Subject<ImageUploadEvent>();
    mockImageUploadService = {
      events$: eventsSubject.asObservable(),
      requestCancel: vi.fn(),
    };
    mockRouter = { navigate: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [GlobalUploadIndicatorComponent],
      providers: [
        { provide: ImageUploadSessionService, useValue: mockImageUploadService },
        { provide: Router, useValue: mockRouter },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(GlobalUploadIndicatorComponent);
  });

  afterEach(() => {
    fixture.destroy();
    eventsSubject.complete();
  });

  describe('ngOnInit', () => {
    it('should subscribe to upload events', () => {
      fixture.detectChanges();
      eventsSubject.next(createUploadEvent());
      expect(fixture.componentInstance.hasUploads).toBe(true);
    });
  });

  describe('hasUploads', () => {
    it('should be false when no uploads', () => {
      fixture.detectChanges();
      expect(fixture.componentInstance.hasUploads).toBe(false);
    });

    it('should be true after receiving a queued upload event', () => {
      fixture.detectChanges();
      eventsSubject.next(createUploadEvent());
      expect(fixture.componentInstance.hasUploads).toBe(true);
    });
  });

  describe('uploadList', () => {
    it('should return empty array when no uploads', () => {
      fixture.detectChanges();
      expect(fixture.componentInstance.uploadList).toEqual([]);
    });

    it('should return uploads as array', () => {
      fixture.detectChanges();
      eventsSubject.next(createUploadEvent({ tempId: 'temp-1', filename: 'file1.img' }));
      eventsSubject.next(createUploadEvent({ tempId: 'temp-2', filename: 'file2.img' }));
      const list = fixture.componentInstance.uploadList;
      expect(list.length).toBe(2);
    });
  });

  describe('activeCount', () => {
    it('should count uploading and queued uploads', () => {
      fixture.detectChanges();
      eventsSubject.next(createUploadEvent({ tempId: 'temp-1', status: 'uploading' }));
      eventsSubject.next(createUploadEvent({ tempId: 'temp-2', status: 'queued' }));
      eventsSubject.next(createUploadEvent({ tempId: 'temp-3', status: 'uploaded' }));
      expect(fixture.componentInstance.activeCount).toBe(2);
    });

    it('should be 0 when no active uploads', () => {
      fixture.detectChanges();
      eventsSubject.next(createUploadEvent({ status: 'uploaded' }));
      eventsSubject.next(createUploadEvent({ status: 'canceled' }));
      expect(fixture.componentInstance.activeCount).toBe(0);
    });
  });

  describe('overallProgress', () => {
    it('should return 100 when no active uploads', () => {
      fixture.detectChanges();
      expect(fixture.componentInstance.overallProgress).toBe(100);
    });

    it('should calculate average progress of active uploads', () => {
      fixture.detectChanges();
      eventsSubject.next(createUploadEvent({ tempId: 'temp-1', status: 'uploading', progress: 40 }));
      eventsSubject.next(createUploadEvent({ tempId: 'temp-2', status: 'uploading', progress: 60 }));
      expect(fixture.componentInstance.overallProgress).toBe(50);
    });
  });

  describe('cancelUpload', () => {
    it('should call requestCancel on the service', () => {
      fixture.detectChanges();
      fixture.componentInstance.cancelUpload('temp-cancel');
      expect(mockImageUploadService.requestCancel).toHaveBeenCalledWith('temp-cancel');
    });
  });

  describe('navigateToFile', () => {
    it('should navigate to image-manager with correct params when controller_id exists', () => {
      fixture.detectChanges();
      const row = {
        tempId: 'temp-nav',
        filename: 'router.img',
        image_type: 'qemu',
        image_size: 1024,
        progress: 50,
        status: 'uploading' as const,
        controller_id: 42,
      };
      const mockEvent = { stopPropagation: vi.fn() } as unknown as MouseEvent;
      fixture.componentInstance.navigateToFile(row as any, mockEvent);
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/controller', 42, 'image-manager'], {
        queryParams: { highlight: 'router.img' },
      });
    });

    it('should not navigate when controller_id is missing', () => {
      fixture.detectChanges();
      const row = {
        tempId: 'temp-nav',
        filename: 'router.img',
        image_type: 'qemu',
        image_size: 1024,
        progress: 50,
        status: 'uploading' as const,
      };
      const mockEvent = { stopPropagation: vi.fn() } as unknown as MouseEvent;
      fixture.componentInstance.navigateToFile(row as any, mockEvent);
      expect(mockRouter.navigate).not.toHaveBeenCalled();
    });

    it('should stop event propagation', () => {
      fixture.detectChanges();
      const row = { tempId: 'temp-nav', filename: 'img', image_type: 'qemu', image_size: 0, progress: 0, status: 'uploading' as const, controller_id: 1 };
      const mockEvent = { stopPropagation: vi.fn() } as unknown as MouseEvent;
      fixture.componentInstance.navigateToFile(row as any, mockEvent);
      expect(mockEvent.stopPropagation).toHaveBeenCalled();
    });
  });

  describe('toggleExpanded', () => {
    it('should toggle isExpanded signal from true to false', () => {
      fixture.detectChanges();
      expect(fixture.componentInstance.isExpanded()).toBe(true);
      fixture.componentInstance.toggleExpanded();
      expect(fixture.componentInstance.isExpanded()).toBe(false);
    });

    it('should toggle isExpanded from false to true', () => {
      fixture.detectChanges();
      fixture.componentInstance.toggleExpanded();
      fixture.componentInstance.toggleExpanded();
      expect(fixture.componentInstance.isExpanded()).toBe(true);
    });
  });

  describe('trackByTempId', () => {
    it('should return tempId as track key', () => {
      fixture.detectChanges();
      const result = fixture.componentInstance.trackByTempId(0, {
        tempId: 'track-123',
        filename: '',
        image_type: '',
        image_size: 0,
        progress: 0,
        status: 'queued',
      } as any);
      expect(result).toBe('track-123');
    });
  });

  describe('onUploadEvent (via events subscription)', () => {
    it('should add new upload to uploads map on queued event', () => {
      fixture.detectChanges();
      eventsSubject.next(createUploadEvent({ tempId: 'temp-new', status: 'queued' }));
      expect(fixture.componentInstance.uploads.has('temp-new')).toBe(true);
    });

    it('should update existing upload on subsequent events with same tempId', () => {
      fixture.detectChanges();
      eventsSubject.next(createUploadEvent({ tempId: 'temp-same', status: 'uploading', progress: 30 }));
      eventsSubject.next(createUploadEvent({ tempId: 'temp-same', status: 'uploading', progress: 60 }));
      const upload = fixture.componentInstance.uploads.get('temp-same');
      expect(upload?.progress).toBe(60);
    });

    it('should set dismissing to false for queued and uploading uploads', () => {
      fixture.detectChanges();
      eventsSubject.next(createUploadEvent({ tempId: 'temp-1', status: 'uploading' }));
      const upload = fixture.componentInstance.uploads.get('temp-1');
      expect(upload?.dismissing).toBe(false);
    });

    it('should set dismissTimer for completed uploads', () => {
      fixture.detectChanges();
      eventsSubject.next(createUploadEvent({ tempId: 'temp-done', status: 'uploaded' }));
      const upload = fixture.componentInstance.uploads.get('temp-done');
      expect(upload?.dismissTimer).toBeDefined();
      clearTimeout(upload?.dismissTimer);
    });
  });

  describe('ngOnDestroy', () => {
    it('should clear dismiss timers on destroy', () => {
      fixture.detectChanges();
      eventsSubject.next(createUploadEvent({ tempId: 'temp-destroy', status: 'uploaded' }));
      const upload = fixture.componentInstance.uploads.get('temp-destroy');
      const clearSpy = vi.spyOn(global, 'clearTimeout');
      fixture.destroy();
      expect(clearSpy).toHaveBeenCalledWith(upload?.dismissTimer);
    });
  });
});
