import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { ImageUploadEvent, ImageUploadSessionService } from '@services/image-upload-session.service';

interface UploadRow extends ImageUploadEvent {
  dismissTimer?: ReturnType<typeof setTimeout>;
  dismissing?: boolean;
}

@Component({
  standalone: false,
  selector: 'app-global-upload-indicator',
  templateUrl: './global-upload-indicator.component.html',
  styleUrls: ['./global-upload-indicator.component.scss'],
})
export class GlobalUploadIndicatorComponent implements OnInit, OnDestroy {
  uploads = new Map<string, UploadRow>();
  isExpanded = true;
  private subscription: Subscription;

  constructor(private imageUploadSessionService: ImageUploadSessionService, private router: Router) {}

  ngOnInit() {
    this.subscription = this.imageUploadSessionService.events$.subscribe((event: ImageUploadEvent) => {
      this.onUploadEvent(event);
    });
  }

  get uploadList(): UploadRow[] {
    return Array.from(this.uploads.values());
  }

  get hasUploads(): boolean {
    return this.uploads.size > 0;
  }

  get activeCount(): number {
    return this.uploadList.filter((u) => u.status === 'uploading' || u.status === 'queued').length;
  }

  get overallProgress(): number {
    const active = this.uploadList.filter((u) => u.status === 'uploading' || u.status === 'queued');
    if (!active.length) return 100;
    return Math.round(active.reduce((sum, u) => sum + (u.progress || 0), 0) / active.length);
  }

  cancelUpload(tempId: string) {
    this.imageUploadSessionService.requestCancel(tempId);
  }

    navigateToFile(row: UploadRow, event: MouseEvent) {
    event.stopPropagation();
    if (!row.controller_id) return;
    this.router.navigate(['/controller', row.controller_id, 'image-manager'], {
      queryParams: { highlight: row.filename },
    });
  }

  toggleExpanded() {
    this.isExpanded = !this.isExpanded;
  }

  trackByTempId(_index: number, row: UploadRow): string {
    return row.tempId;
  }

  private onUploadEvent(event: ImageUploadEvent) {
    const existing = this.uploads.get(event.tempId);

    if (existing?.dismissTimer) {
      clearTimeout(existing.dismissTimer);
    }

    const row: UploadRow = { ...(existing || {}), ...event };

    if (event.status === 'uploaded' || event.status === 'error' || event.status === 'canceled') {
      row.dismissing = false;
      row.dismissTimer = setTimeout(() => {
        const current = this.uploads.get(event.tempId);
        if (current) {
          current.dismissing = true;
        }
        setTimeout(() => {
          this.uploads.delete(event.tempId);
        }, 400);
      }, 3000);
    } else {
      row.dismissing = false;
    }

    this.uploads.set(event.tempId, row);

    if (!existing && event.status === 'queued') {
      this.isExpanded = true;
    }
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
    this.uploadList.forEach((row) => {
      if (row.dismissTimer) clearTimeout(row.dismissTimer);
    });
  }
}