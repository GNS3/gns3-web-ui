import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { ImageUploadStatus } from '@components/image-manager/image-database-file';

export interface ImageUploadEvent {
  tempId: string;
  filename: string;
  image_type: string;
  image_size: number;
  progress: number;
  status: ImageUploadStatus;
  errorMessage?: string;
}

@Injectable({
  providedIn: 'root',
})
export class ImageUploadSessionService {
  private uploadEvents = new Subject<ImageUploadEvent>();
  private cancelRequests = new Subject<string>();
  private cancelHandlers = new Map<string, () => void>();

  get events$(): Observable<ImageUploadEvent> {
    return this.uploadEvents.asObservable();
  }

  get cancelRequests$(): Observable<string> {
    return this.cancelRequests.asObservable();
  }

  emit(event: ImageUploadEvent) {
    this.uploadEvents.next(event);
  }

  requestCancel(tempId: string) {
    const cancelHandler = this.cancelHandlers.get(tempId);
    if (cancelHandler) {
      cancelHandler();
      return;
    }
    this.cancelRequests.next(tempId);
  }

  registerCancelHandler(tempId: string, handler: () => void) {
    if (!tempId || !handler) {
      return;
    }
    this.cancelHandlers.set(tempId, handler);
  }

  unregisterCancelHandler(tempId: string) {
    if (!tempId) {
      return;
    }
    this.cancelHandlers.delete(tempId);
  }
}
