import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { ControllerService } from '@services/controller.service';
import { ImageManagerService } from '@services/image-manager.service';
import { ImageUploadSessionService } from '@services/image-upload-session.service';
import { ToasterService } from '@services/toaster.service';
import { ChangeDetectorRef } from '@angular/core';
import { EMPTY, of, throwError } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ImageManagerComponent } from './image-manager.component';

describe('Image Manager synchronization', () => {
  let component: ImageManagerComponent;
  let images: any;
  let toaster: any;
  let controllers: any;
  const completed = { job_id: 'job', status: 'completed', counts: { added: 1 }, errors: [] };

  beforeEach(() => {
    vi.useFakeTimers();
    sessionStorage.clear();
    images = {
      syncImages: vi.fn().mockReturnValue(of({ ...completed, status: 'queued' })),
      getSyncJob: vi.fn().mockReturnValue(of(completed)),
      getImages: vi.fn().mockReturnValue(of([])),
    };
    toaster = { success: vi.fn(), error: vi.fn(), warning: vi.fn() };
    controllers = { get: vi.fn().mockResolvedValue({ id: 1, authToken: 'token' }) };
    TestBed.configureTestingModule({
      providers: [
        { provide: ImageManagerService, useValue: images },
        { provide: ToasterService, useValue: toaster },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => '1' } }, queryParams: of({}) } },
        { provide: ControllerService, useValue: controllers },
        { provide: MatDialog, useValue: {} },
        { provide: ImageUploadSessionService, useValue: { events$: EMPTY } },
        { provide: Router, useValue: {} },
        { provide: ChangeDetectorRef, useValue: { markForCheck: vi.fn() } },
      ],
    });
    component = TestBed.runInInjectionContext(() => new ImageManagerComponent());
    component.controller = { id: 1 } as any;
  });

  afterEach(() => {
    component.ngOnDestroy();
    vi.useRealTimers();
    TestBed.resetTestingModule();
  });

  it('polls until completion, prevents duplicate submissions, and refreshes images', async () => {
    images.getSyncJob.mockReturnValueOnce(of({ ...completed, status: 'running' }));
    component.syncImages();
    component.syncImages();
    expect(images.syncImages).toHaveBeenCalledTimes(1);
    expect(images.syncImages).toHaveBeenCalledWith(component.controller);
    expect(component.syncing()).toBe(true);
    await vi.advanceTimersByTimeAsync(0);
    expect(component.syncing()).toBe(true);
    await vi.advanceTimersByTimeAsync(1000);
    expect(component.syncing()).toBe(false);
    expect(images.getImages).toHaveBeenCalledTimes(1);
    expect(toaster.success).toHaveBeenCalledWith(
      'Synchronization: Completed · 0 scanned · 1 added · 0 updated · 0 missing · 0 deferred · 0 errors'
    );
    await vi.advanceTimersByTimeAsync(5000);
    expect(images.getSyncJob).toHaveBeenCalledTimes(2);
  });

  it('shows partial failures without reporting success', async () => {
    images.getSyncJob.mockReturnValue(
      of({ ...completed, status: 'partial', errors: [{ path: '/images', reason: 'unavailable' }] })
    );
    component.syncImages();
    await vi.advanceTimersByTimeAsync(0);
    expect(toaster.warning).toHaveBeenCalledWith(expect.stringContaining('/images: unavailable'));
    expect(toaster.success).not.toHaveBeenCalled();
    expect(component.syncing()).toBe(false);
  });

  it('makes failures retryable and stops polling after destruction', async () => {
    images.syncImages.mockReturnValueOnce(throwError(() => ({ error: { message: 'Already running' } })));
    component.syncImages();
    expect(component.syncing()).toBe(false);
    expect(toaster.error).toHaveBeenCalledWith('Already running');
    images.getSyncJob.mockReturnValue(of({ ...completed, status: 'running' }));
    component.syncImages();
    await vi.advanceTimersByTimeAsync(0);
    component.ngOnDestroy();
    await vi.advanceTimersByTimeAsync(5000);
    expect(images.getSyncJob).toHaveBeenCalledTimes(1);
  });

  it('shows missing-image status while retaining older-server and upload behavior', () => {
    expect(component.imageStatusLabel({ rowType: 'image', availability: 'missing' })).toBe('missing');
    expect(component.imageStatusLabel({ rowType: 'image' })).toBe('Available');
    expect(component.imageStatusLabel({ rowType: 'upload', uploadStatus: 'uploading' })).toBe('uploading');
  });

  it('resumes polling after a network error without submitting another sync', async () => {
    images.getSyncJob.mockReturnValueOnce(throwError(() => ({ status: 503 })));
    component.syncImages();
    await vi.advanceTimersByTimeAsync(0);
    expect(component.syncing()).toBe(false);
    expect(sessionStorage.getItem('gns3-image-sync-1')).toBe('job');
    component.syncImages();
    await vi.advanceTimersByTimeAsync(0);
    expect(images.syncImages).toHaveBeenCalledTimes(1);
    expect(images.getSyncJob).toHaveBeenCalledTimes(2);
    expect(toaster.success).toHaveBeenCalledTimes(1);
    expect(sessionStorage.getItem('gns3-image-sync-1')).toBeNull();
  });

  it('limits notification details for large error collections', async () => {
    images.getSyncJob.mockReturnValue(
      of({
        ...completed,
        status: 'partial',
        counts: { errors: 100 },
        errors: Array.from({ length: 100 }, (_, index) => ({ path: `/image${index}`, reason: 'unreadable' })),
      })
    );
    component.syncImages();
    await vi.advanceTimersByTimeAsync(0);
    const message = toaster.warning.mock.calls[0][0];
    expect(message).toContain('100 errors');
    expect(message).toContain('/image4: unreadable');
    expect(message).not.toContain('/image5: unreadable');
    expect(message).toContain('Showing the first 5 issues');
  });

  it('does not resume polling when controller loading finishes after navigation away', async () => {
    sessionStorage.setItem('gns3-image-sync-1', 'job');
    component.ngOnInit();
    component.ngOnDestroy();
    await vi.advanceTimersByTimeAsync(5000);
    expect(images.getImages).not.toHaveBeenCalled();
    expect(images.getSyncJob).not.toHaveBeenCalled();
    expect(sessionStorage.getItem('gns3-image-sync-1')).toBe('job');
  });

  it('retains the active job across navigation and clears it when finished', async () => {
    images.getSyncJob.mockReturnValue(of({ ...completed, status: 'running' }));
    component.syncImages();
    await vi.advanceTimersByTimeAsync(0);
    expect(sessionStorage.getItem('gns3-image-sync-1')).toBe('job');
    component.ngOnDestroy();
    expect(sessionStorage.getItem('gns3-image-sync-1')).toBe('job');
    images.getSyncJob.mockReturnValue(of(completed));
    component = TestBed.runInInjectionContext(() => new ImageManagerComponent());
    component.ngOnInit();
    await vi.advanceTimersByTimeAsync(0);
    expect(sessionStorage.getItem('gns3-image-sync-1')).toBeNull();
    expect(component.syncing()).toBe(false);
  });
});
