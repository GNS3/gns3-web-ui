import { HttpClient, HttpEventType, HttpHeaders, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Controller } from '@models/controller';
import { ImageManagerService } from '@services/image-manager.service';
import { ImageUploadSessionService } from '@services/image-upload-session.service';
import { ToasterService } from '@services/toaster.service';

interface UploadTask {
  tempId: string;
  file: File;
  controller: Controller;
  installAppliance: boolean;
  cancel$: Subject<void>;
  status: 'queued' | 'uploading' | 'uploaded' | 'error' | 'canceled';
  progress: number;
}

@Injectable({
  providedIn: 'root',
})
export class BackgroundUploadService {
  private queue: UploadTask[] = [];
  private activeUploads = new Set<string>();
  private activeUploadSizes = new Map<string, number>();

  private activeCountSource = new BehaviorSubject<number>(0);
  activeCount$ = this.activeCountSource.asObservable();

  constructor(
    private http: HttpClient,
    private imageService: ImageManagerService,
    private imageUploadSessionService: ImageUploadSessionService,
    private toasterService: ToasterService
  ) {
    this.imageUploadSessionService.cancelRequests$.subscribe((tempId: string) => {
      this.cancelUploadByTempId(tempId);
    });
  }

  queueFile(controller: Controller, file: File, installAppliance: boolean): string {
    const tempId = `img-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    const task: UploadTask = {
      tempId,
      file,
      controller,
      installAppliance,
      cancel$: new Subject<void>(),
      status: 'queued',
      progress: 0,
    };

    this.queue.push(task);
    this.imageUploadSessionService.registerCancelHandler(tempId, () => this.cancelUploadByTempId(tempId));
    this.emitEvent(task);
    this.processQueue();
    this.updateActiveCount();
    return tempId;
  }

  cancelUploadByTempId(tempId: string) {
    const task = this.queue.find((t) => t.tempId === tempId);
    if (!task) return;

    task.cancel$.next();
    task.cancel$.complete();
    task.status = 'canceled';
    this.emitEvent(task);
    this.imageUploadSessionService.unregisterCancelHandler(tempId);
    this.releaseSlot(task);
    this.removeFromQueue(task);
    this.processQueue();
    this.updateActiveCount();
  }

  private processQueue() {
    const hardCap = this.getHardConcurrencyCapFromEnvironment();
    while (this.activeUploads.size < hardCap) {
      const next = this.pickNextTask();
      if (!next) break;
      if (!this.canStartUpload(next)) break;
      this.startUpload(next);
    }
  }

  private startUpload(task: UploadTask) {
    this.activeUploads.add(task.tempId);
    this.activeUploadSizes.set(task.tempId, task.file.size);
    task.status = 'uploading';
    this.emitEvent(task);

    const url = this.imageService.getImagePath(task.controller, task.installAppliance, task.file.name);
    const headers: { [key: string]: string } = {};
    if (task.controller.authToken && !task.controller.tokenExpired) {
      headers['Authorization'] = `Bearer ${task.controller.authToken}`;
    }

    const req = new HttpRequest('POST', url, task.file, {
      headers: new HttpHeaders(headers),
      reportProgress: true,
    });

    this.http
      .request(req)
      .pipe(takeUntil(task.cancel$))
      .subscribe({
        next: (event) => {
          if (event.type === HttpEventType.UploadProgress) {
            task.progress = event.total ? Math.round((100 * event.loaded) / event.total) : 0;
            this.emitEvent(task);
            this.updateActiveCount();
          } else if (event.type === HttpEventType.Response) {
            const body: any = event.body;
            const filename = body?.filename || body?.message?.filename || task.file.name;
            task.status = 'uploaded';
            task.progress = 100;
            this.emitEvent(task);
            this.toasterService.success(`Image ${filename} imported successfully`);
            this.releaseSlot(task);
            this.removeFromQueue(task);
            this.processQueue();
            this.updateActiveCount();
          }
        },
        error: (err) => {
          const errorMessage = err?.error?.message || err?.message || 'Upload failed';
          task.status = 'error';
          this.emitEvent(task, errorMessage);
          this.toasterService.error(errorMessage);
          this.releaseSlot(task);
          this.removeFromQueue(task);
          this.processQueue();
          this.updateActiveCount();
        },
      });
  }

  private pickNextTask(): UploadTask | null {
    const pending = this.getPendingTasks();
    if (!pending.length) return null;

    const budgetRemaining = this.getInFlightBytesBudget() - this.getApproxInFlightBytes();
    const fitting = pending.filter((t) => t.file.size <= budgetRemaining);

    if (fitting.length) {
      return fitting.sort((a, b) => a.file.size - b.file.size)[0];
    }
    if (this.activeUploads.size === 0) {
      return pending.sort((a, b) => a.file.size - b.file.size)[0];
    }
    return null;
  }

  private canStartUpload(task: UploadTask): boolean {
    if (this.activeUploads.size === 0) return true;

    const inFlightBytes = this.getApproxInFlightBytes();
    const nextItemBytes = task.file.size;
    const budgetBytes = this.getInFlightBytesBudget();
    const pendingTasks = this.getPendingTasks();
    const avgPendingSize = pendingTasks.length
      ? pendingTasks.reduce((sum, t) => sum + t.file.size, 0) / pendingTasks.length
      : this.getAverageKnownSize();
    const estimatedParallelLimit = Math.max(
      1,
      Math.floor(budgetBytes / Math.max(avgPendingSize, this.getAverageKnownSize()))
    );
    const dynamicCap = Math.min(this.getHardConcurrencyCapFromEnvironment(), estimatedParallelLimit);

    if (this.activeUploads.size >= dynamicCap) return false;
    return inFlightBytes + nextItemBytes <= budgetBytes;
  }

  private getPendingTasks(): UploadTask[] {
    return this.queue.filter((t) => t.status === 'queued');
  }

  private releaseSlot(task: UploadTask) {
    this.activeUploads.delete(task.tempId);
    this.activeUploadSizes.delete(task.tempId);
  }

  private removeFromQueue(task: UploadTask) {
    const index = this.queue.indexOf(task);
    if (index >= 0) this.queue.splice(index, 1);
  }

  private getHardConcurrencyCapFromEnvironment(): number {
    const signals = this.getRuntimeSignals();
    const cpuCap = Math.max(1, Math.round(Math.log2(signals.cores + 1) * 2));
    const memoryCap = Math.max(1, Math.round(signals.memoryGiB * 1.2));
    const pendingKnownSizes = this.getPendingTasks()
      .map((t) => t.file.size)
      .filter((size) => size > 0);
    const averagePendingSize = pendingKnownSizes.length
      ? pendingKnownSizes.reduce((sum, size) => sum + size, 0) / pendingKnownSizes.length
      : 0;

    let cap = Math.min(cpuCap, Math.max(1, memoryCap * 2));
    cap = Math.max(1, Math.round(cap * this.getNetworkMultiplier(signals.effectiveType)));

    if (averagePendingSize > 0) {
      const sizeCap = Math.max(1, Math.round((signals.memoryGiB * 1024 * 1024 * 1024 * 0.15) / averagePendingSize));
      cap = Math.min(cap, sizeCap);
    }

    return this.clampConcurrency(cap);
  }

  private getInFlightBytesBudget(): number {
    const signals = this.getRuntimeSignals();
    const hardCap = this.getHardConcurrencyCapFromEnvironment();
    const avgSize = this.getAverageKnownSize();
    const memoryBasedBudget = signals.memoryGiB * 1024 * 1024 * 1024 * 0.18;
    const queueBasedBudget = avgSize * hardCap * 1.5;
    const rawBudget = Math.max(memoryBasedBudget, queueBasedBudget);
    const networkAdjustedBudget = rawBudget * this.getNetworkMultiplier(signals.effectiveType);
    return Math.max(avgSize, Math.round(networkAdjustedBudget));
  }

  private getApproxInFlightBytes(): number {
    let total = 0;
    this.activeUploadSizes.forEach((size) => (total += size));
    return total;
  }

  private getAverageKnownSize(): number {
    const queueSizes = this.queue.map((t) => t.file.size).filter((s) => s > 0);
    const activeSizes = Array.from(this.activeUploadSizes.values()).filter((s) => s > 0);
    const sizes = [...queueSizes, ...activeSizes];
    if (!sizes.length) return 32 * 1024 * 1024;
    return Math.round(sizes.reduce((sum, s) => sum + s, 0) / sizes.length);
  }

  private clampConcurrency(value: number): number {
    return Math.max(1, Math.min(12, Math.floor(value || 1)));
  }

  private getRuntimeSignals(): { cores: number; memoryGiB: number; effectiveType: string } {
    const nav = navigator as any;
    return {
      cores: Math.max(1, Number(nav.hardwareConcurrency || 4)),
      memoryGiB: Math.max(1, Number(nav.deviceMemory || 4)),
      effectiveType:
        nav.connection && nav.connection.effectiveType ? String(nav.connection.effectiveType).toLowerCase() : '',
    };
  }

  private getNetworkMultiplier(effectiveType: string): number {
    if (effectiveType.includes('slow-2g')) return 0.25;
    if (effectiveType.includes('2g')) return 0.35;
    if (effectiveType.includes('3g')) return 0.6;
    if (effectiveType.includes('4g')) return 1;
    if (effectiveType.includes('5g')) return 1.15;
    return 0.85;
  }

  private emitEvent(task: UploadTask, errorMessage?: string) {
    this.imageUploadSessionService.emit({
      tempId: task.tempId,
      filename: task.file.name,
      image_size: task.file.size,
      image_type: this.resolveImageType(task.file.name),
      progress: task.progress,
      status: task.status,
      errorMessage,
      controller_id: task.controller.id,
    });

    if (task.status === 'uploaded' || task.status === 'error' || task.status === 'canceled') {
      this.imageUploadSessionService.unregisterCancelHandler(task.tempId);
    }
  }

  private resolveImageType(fileName: string): string {
    const parts = (fileName || '').split('.');
    return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : 'unknown';
  }

  private updateActiveCount() {
    this.activeCountSource.next(this.activeUploads.size + this.getPendingTasks().length);
  }
}