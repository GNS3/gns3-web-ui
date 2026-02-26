import { animate, state, style, transition, trigger } from '@angular/animations';
import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FileItem, FileUploader, ParsedResponseHeaders } from 'ng2-file-upload';
import { Controller } from '@models/controller';
import { ImageManagerService } from '@services/image-manager.service';
import { ToasterService } from '@services/toaster.service';
import { ImageUploadSessionService } from '@services/image-upload-session.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-add-image-dialog',
  templateUrl: './add-image-dialog.component.html',
  styleUrls: ['./add-image-dialog.component.scss'],
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({ height: '0px', minHeight: '0', visibility: 'hidden' })),
      state('expanded', style({ height: '*', visibility: 'visible' })),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ],
})
export class AddImageDialogComponent implements OnInit, OnDestroy {
  controller: Controller;
  isInstallAppliance: boolean = false;
  install_appliance: boolean = false;
  uploaderImage: FileUploader;
  uploadState: { [key: string]: { progress: number; status: string; errorMessage?: string } } = {};
  private cancelRequestsSubscription: Subscription;
  private activeUploads = new Set<string>();
  private activeUploadSizes = new Map<string, number>();

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    public dialogRef: MatDialogRef<AddImageDialogComponent>,
    private imageService: ImageManagerService,
    private toasterService: ToasterService,
    private imageUploadSessionService: ImageUploadSessionService
  ) {}

  public ngOnInit() {
    this.controller = this.data;

    this.uploaderImage = new FileUploader({ url: '' });

    this.uploaderImage.onAfterAddingFile = (file) => {
      file.withCredentials = false;
      this.setupUploadItem(file);
      this.emitUploadEvent(file, 'queued', 0);
      this.processUploadQueue();
    };

    this.uploaderImage.onErrorItem = (
      item: FileItem,
      response: string,
      status: number,
      headers: ParsedResponseHeaders
    ) => {
      const responseData = this.parseResponse(response);
      const errorMessage = responseData?.message?.message || responseData?.message || 'Upload failed';
      this.emitUploadEvent(item, 'error', item.progress, errorMessage);
      this.toasterService.error(errorMessage);
      this.releaseUploadSlot(item);
      this.removeItemFromQueue(item);
      this.processUploadQueue();
    };

    this.uploaderImage.onSuccessItem = (
      item: FileItem,
      response: string,
      status: number,
      headers: ParsedResponseHeaders
    ) => {
      const responseData = this.parseResponse(response);
      const filename = responseData?.filename || responseData?.message?.filename || item.file.name;
      this.emitUploadEvent(item, 'uploaded', 100);
      this.toasterService.success(`Image ${filename} imported succesfully`);
      this.releaseUploadSlot(item);
      this.removeItemFromQueue(item);
      this.processUploadQueue();
    };

    this.uploaderImage.onProgressItem = (item: any, progress: number) => {
      this.emitUploadEvent(item, 'uploading', progress);
    };

    this.uploaderImage.onCancelItem = (item: FileItem) => {
      this.emitUploadEvent(item, 'canceled', item.progress);
      this.releaseUploadSlot(item);
      this.removeItemFromQueue(item);
      this.processUploadQueue();
    };

    this.cancelRequestsSubscription = this.imageUploadSessionService.cancelRequests$.subscribe((tempId: string) => {
      this.cancelUploadByTempId(tempId);
    });
  }

  private parseResponse(response: string): any {
    if (!response) {
      return {};
    }

    try {
      return JSON.parse(response);
    } catch (e) {
      return {};
    }
  }

  private setupUploadItem(item: FileItem) {
    const tempId = this.getItemTempId(item);
    const url = this.imageService.getImagePath(this.controller, this.install_appliance, item.file.name);
    item.url = url;
    if ((item as any).options) {
      (item as any).options.disableMultipart = true;
    }
    (item as any).options.headers = [{ name: 'Authorization', value: 'Bearer ' + this.controller.authToken }];
    this.uploadState[tempId] = { progress: 0, status: 'queued' };
    this.imageUploadSessionService.registerCancelHandler(tempId, () => this.cancelUploadByTempId(tempId));
  }

  private uploadImageItem(item: FileItem) {
    const hardCap = this.getHardConcurrencyCapFromEnvironment();
    if (!item.isUploading && !item.isUploaded && this.activeUploads.size < hardCap) {
      const tempId = this.getItemTempId(item);
      this.activeUploads.add(tempId);
      this.activeUploadSizes.set(tempId, this.getItemSize(item));
      item.upload();
      return true;
    }
    return false;
  }

  private processUploadQueue() {
    if (!this.uploaderImage) {
      return;
    }

    const hardCap = this.getHardConcurrencyCapFromEnvironment();
    if (this.activeUploads.size >= hardCap) {
      return;
    }

    while (this.activeUploads.size < hardCap) {
      const nextItem = this.pickNextQueueItem();

      if (!nextItem) {
        break;
      }

      if (!this.canStartUpload(nextItem)) {
        break;
      }

      const started = this.uploadImageItem(nextItem);
      if (!started) {
        break;
      }
    }
  }

  private releaseUploadSlot(item: FileItem) {
    const tempId = this.getItemTempId(item);
    this.activeUploads.delete(tempId);
    this.activeUploadSizes.delete(tempId);
  }

  private getHardConcurrencyCapFromEnvironment(): number {
    const signals = this.getRuntimeSignals();
    const cpuCap = Math.max(1, Math.round(Math.log2(signals.cores + 1) * 2));
    const memoryCap = Math.max(1, Math.round(signals.memoryGiB * 1.2));
    const pending = this.getPendingQueueItems();
    const pendingKnownSizes = pending.map((item) => Number(item?.file?.size || 0)).filter((size) => size > 0);
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
    const averageKnownItemSize = this.getAverageKnownItemSize();
    const memoryBasedBudget = signals.memoryGiB * 1024 * 1024 * 1024 * 0.18;
    const queueBasedBudget = averageKnownItemSize * hardCap * 1.5;
    const rawBudget = Math.max(memoryBasedBudget, queueBasedBudget);
    const networkAdjustedBudget = rawBudget * this.getNetworkMultiplier(signals.effectiveType);
    return Math.max(averageKnownItemSize, Math.round(networkAdjustedBudget));
  }

  private getPendingQueueItems(): FileItem[] {
    if (!this.uploaderImage) {
      return [];
    }

    return this.uploaderImage.queue.filter(
      (item) =>
        !item.isUploading &&
        !item.isUploaded &&
        !item.isError &&
        this.getUploadState(item).status !== 'canceled' &&
        !this.activeUploads.has(this.getItemTempId(item))
    );
  }

  private pickNextQueueItem(): FileItem | null {
    const pendingItems = this.getPendingQueueItems();
    if (!pendingItems.length) {
      return null;
    }

    const budgetRemaining = this.getInFlightBytesBudget() - this.getApproxInFlightBytes();
    const fittingItems = pendingItems.filter((item) => this.getItemSize(item) <= budgetRemaining);

    if (fittingItems.length) {
      return fittingItems.sort((a, b) => this.getItemSize(a) - this.getItemSize(b))[0];
    }

    if (this.activeUploads.size === 0) {
      return pendingItems.sort((a, b) => this.getItemSize(a) - this.getItemSize(b))[0];
    }

    return null;
  }

  private canStartUpload(item: FileItem): boolean {
    if (this.activeUploads.size === 0) {
      return true;
    }

    const inFlightBytes = this.getApproxInFlightBytes();
    const nextItemBytes = this.getItemSize(item);
    const budgetBytes = this.getInFlightBytesBudget();
    const pendingItems = this.getPendingQueueItems();
    const avgPendingSize = pendingItems.length
      ? pendingItems.reduce((sum, queueItem) => sum + this.getItemSize(queueItem), 0) / pendingItems.length
      : this.getAverageKnownItemSize();
    const estimatedParallelLimit = Math.max(
      1,
      Math.floor(budgetBytes / Math.max(avgPendingSize, this.getAverageKnownItemSize()))
    );
    const dynamicCap = Math.min(this.getHardConcurrencyCapFromEnvironment(), estimatedParallelLimit);

    if (this.activeUploads.size >= dynamicCap) {
      return false;
    }

    return inFlightBytes + nextItemBytes <= budgetBytes;
  }

  private getApproxInFlightBytes(): number {
    let total = 0;
    this.activeUploadSizes.forEach((size) => {
      total += size;
    });
    return total;
  }

  private getItemSize(item: FileItem): number {
    const actualSize = Number(item?.file?.size || 0);
    if (actualSize > 0) {
      return actualSize;
    }
    return this.getAverageKnownItemSize();
  }

  private clampConcurrency(value: number): number {
    const minimum = 1;
    const maximum = 12;
    return Math.max(minimum, Math.min(maximum, Math.floor(value || minimum)));
  }

  private getRuntimeSignals(): { cores: number; memoryGiB: number; effectiveType: string } {
    const nav = navigator as any;
    const cores = Math.max(1, Number(nav.hardwareConcurrency || 4));
    const memoryGiB = Math.max(1, Number(nav.deviceMemory || 4));
    const effectiveType =
      nav.connection && nav.connection.effectiveType ? String(nav.connection.effectiveType).toLowerCase() : '';
    return { cores, memoryGiB, effectiveType };
  }

  private getAverageKnownItemSize(): number {
    const queueSizes = (this.uploaderImage ? this.uploaderImage.queue : [])
      .map((item) => Number(item?.file?.size || 0))
      .filter((size) => size > 0);
    const activeSizes = Array.from(this.activeUploadSizes.values()).filter((size) => size > 0);
    const sizes = [...queueSizes, ...activeSizes];
    if (!sizes.length) {
      return 32 * 1024 * 1024;
    }
    return Math.round(sizes.reduce((sum, size) => sum + size, 0) / sizes.length);
  }

  private getNetworkMultiplier(effectiveType: string): number {
    if (effectiveType.includes('slow-2g')) {
      return 0.25;
    }
    if (effectiveType.includes('2g')) {
      return 0.35;
    }
    if (effectiveType.includes('3g')) {
      return 0.6;
    }
    if (effectiveType.includes('4g')) {
      return 1;
    }
    if (effectiveType.includes('5g')) {
      return 1.15;
    }
    return 0.85;
  }

  private getItemTempId(item: FileItem): string {
    if (!(item as any).tempId) {
      (item as any).tempId = `img-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    }

    return (item as any).tempId;
  }

  private emitUploadEvent(item: FileItem, status: any, progress: number, errorMessage?: string) {
    const tempId = this.getItemTempId(item);
    this.uploadState[tempId] = { progress, status, errorMessage };
    this.imageUploadSessionService.emit({
      tempId,
      filename: item.file.name,
      image_size: item.file.size,
      image_type: this.resolveImageType(item.file.name),
      progress,
      status,
      errorMessage,
    });

    if (status === 'uploaded' || status === 'error' || status === 'canceled') {
      this.imageUploadSessionService.unregisterCancelHandler(tempId);
    }
  }

  private resolveImageType(fileName: string): string {
    const splitName = (fileName || '').split('.');
    if (splitName.length <= 1) {
      return 'unknown';
    }
    return splitName[splitName.length - 1].toLowerCase();
  }

  selectInstallApplianceOption(ev: any) {
    this.install_appliance = ev.value === true;
  }

  uploadImageFile() {
    // Upload starts in onAfterAddingFile for each item.
  }

  getUploadState(item: FileItem) {
    return this.uploadState[this.getItemTempId(item)] || { progress: 0, status: 'queued' };
  }

  hasActiveUploads(): boolean {
    return this.activeUploads.size > 0;
  }

  closeDialog() {
    this.dialogRef.close(false);
  }

  cancelUploading() {
    this.uploaderImage.cancelAll();
    this.uploaderImage.clearQueue();
    this.dialogRef.close(false);
    this.toasterService.warning('Image file uploading canceled');
  }

  ngOnDestroy(): void {
    if (this.cancelRequestsSubscription) {
      this.cancelRequestsSubscription.unsubscribe();
    }
  }

  private cancelUploadByTempId(tempId: string) {
    if (!tempId || !this.uploaderImage) {
      return;
    }

    const item = this.uploaderImage.queue.find((queueItem) => this.getItemTempId(queueItem) === tempId);
    if (!item) {
      return;
    }

    if (item.isUploading) {
      item.cancel();
    } else {
      this.emitUploadEvent(item, 'canceled', item.progress || 0);
      this.releaseUploadSlot(item);
      this.removeItemFromQueue(item);
      this.processUploadQueue();
    }
    this.imageUploadSessionService.unregisterCancelHandler(tempId);
  }

  private removeItemFromQueue(item: FileItem) {
    const index = this.uploaderImage.queue.indexOf(item);
    if (index >= 0) {
      this.uploaderImage.queue.splice(index, 1);
    }
  }
}
