import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  Inject,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialog, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { toObservable, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Controller } from '@models/controller';
import { ApiKey } from '@models/api/api-key';
import { ApiKeyService } from '@services/api-key.service';
import { ToasterService } from '@services/toaster.service';
import { AddApiKeyDialogComponent } from './add-api-key-dialog/add-api-key-dialog.component';
import {
  ApiKeyDisplayDialogComponent,
  ApiKeyDisplayDialogData,
} from './api-key-display-dialog/api-key-display-dialog.component';
import {
  ConfirmationDialogComponent,
  ConfirmationDialogData,
} from '@components/dialogs/confirmation-dialog/confirmation-dialog.component';
import { filter } from 'rxjs';

export interface ApiKeyManagementDialogData {
  controller: Controller;
}

@Component({
  selector: 'app-api-key-management-dialog',
  standalone: true,
  templateUrl: './api-key-management-dialog.component.html',
  styleUrl: './api-key-management-dialog.component.scss',
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatSortModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ApiKeyManagementDialogComponent implements OnInit {
  private dialogRef = inject(MatDialogRef<ApiKeyManagementDialogComponent>);
  private apiKeyService = inject(ApiKeyService);
  private toasterService = inject(ToasterService);
  private dialog = inject(MatDialog);
  private destroyRef = inject(DestroyRef);

  displayedColumns = ['name', 'key_prefix', 'created_at', 'status', 'actions'];

  // ── Signal state ──────────────────────────────────────────────
  private _keys = signal<ApiKey[]>([]);
  readonly isLoading = signal(true);
  private _sortActive = signal<string>('');
  private _sortDirection = signal<'asc' | 'desc' | ''>('');

  // ── Derived: sorted display data ──────────────────────────────
  readonly sortedKeys = computed(() => {
    const keys = this._keys();
    const active = this._sortActive();
    const direction = this._sortDirection();

    if (!active || !direction) return keys;

    return [...keys].sort((a, b) => {
      const valueA = (a as any)[active];
      const valueB = (b as any)[active];
      if (valueA == null) return 1;
      if (valueB == null) return -1;
      const valA = typeof valueA === 'string' ? valueA.toLowerCase() : valueA;
      const valB = typeof valueB === 'string' ? valueB.toLowerCase() : valueB;
      return (valA < valB ? -1 : 1) * (direction === 'asc' ? 1 : -1);
    });
  });

  // Bridge to mat-table
  private _sortedKeys$ = toObservable(this.sortedKeys);
  readonly dataSource = this._sortedKeys$;

  constructor(@Inject(MAT_DIALOG_DATA) public data: ApiKeyManagementDialogData) {}

  ngOnInit() {
    this.loadKeys();
  }

  // ── Sort handler ──────────────────────────────────────────────
  onSortChange(sortState: Sort) {
    this._sortActive.set(sortState.active);
    this._sortDirection.set(sortState.direction);
  }

  // ── Data fetching ─────────────────────────────────────────────
  private loadKeys() {
    this.isLoading.set(true);
    this.apiKeyService
      .list(this.data.controller)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (keys) => {
          this._keys.set(keys);
          this.isLoading.set(false);
        },
        error: (err) => {
          this.isLoading.set(false);
          this.toasterService.error(err.error?.message || err.message || 'Failed to load API keys');
        },
      });
  }

  // ── Actions ───────────────────────────────────────────────────
  onCreate() {
    this.dialog
      .open(AddApiKeyDialogComponent, {
        panelClass: ['base-dialog-panel', 'simple-dialog-panel', 'add-api-key-dialog-panel', 'dialog-medium-panel'],
        autoFocus: false,
        disableClose: true,
      })
      .afterClosed()
      .pipe(filter(Boolean), takeUntilDestroyed(this.destroyRef))
      .subscribe((name: string) => {
        this.apiKeyService
          .create(this.data.controller, name)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: (response) => {
              this.loadKeys();
              this.dialog.open(ApiKeyDisplayDialogComponent, {
                panelClass: ['base-dialog-panel', 'simple-dialog-panel', 'dialog-medium-panel'],
                autoFocus: false,
                disableClose: true,
                data: { response } satisfies ApiKeyDisplayDialogData,
              });
            },
            error: (err) => {
              this.toasterService.error(err.error?.message || err.message || 'Failed to create API key');
            },
          });
      });
  }

  onRevoke(key: ApiKey) {
    this.dialog
      .open(ConfirmationDialogComponent, {
        panelClass: ['base-confirmation-dialog-panel', 'confirmation-danger-panel', 'dialog-small-panel'],
        data: {
          title: 'Revoke API Key',
          message: `Are you sure you want to revoke "${key.name}"? Any services using this key will immediately lose access. You can restore it later.`,
          confirmButtonText: 'Revoke',
          cancelButtonText: 'Cancel',
        } satisfies ConfirmationDialogData,
      })
      .afterClosed()
      .pipe(filter(Boolean), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.apiKeyService
          .revoke(this.data.controller, key.api_key_id)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: (response) => {
              this.toasterService.success(response.message || 'API key revoked');
              this.loadKeys();
            },
            error: (err) => {
              this.toasterService.error(err.error?.message || err.message || 'Failed to revoke API key');
            },
          });
      });
  }

  onRestore(key: ApiKey) {
    this.dialog
      .open(ConfirmationDialogComponent, {
        panelClass: ['base-confirmation-dialog-panel', 'confirmation-warning-panel', 'dialog-small-panel'],
        data: {
          title: 'Restore API Key',
          message: `Restore "${key.name}"? It will become active again.`,
          confirmButtonText: 'Restore',
          cancelButtonText: 'Cancel',
        } satisfies ConfirmationDialogData,
      })
      .afterClosed()
      .pipe(filter(Boolean), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.apiKeyService
          .restore(this.data.controller, key.api_key_id)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: (response) => {
              this.toasterService.success(response.message || 'API key restored');
              this.loadKeys();
            },
            error: (err) => {
              this.toasterService.error(err.error?.message || err.message || 'Failed to restore API key');
            },
          });
      });
  }

  onPermanentDelete(key: ApiKey) {
    this.dialog
      .open(ConfirmationDialogComponent, {
        panelClass: ['base-confirmation-dialog-panel', 'confirmation-danger-panel', 'dialog-small-panel'],
        data: {
          title: 'Permanently Delete API Key',
          message: `Delete "${key.name}" permanently? This action cannot be undone.`,
          confirmButtonText: 'Delete',
          cancelButtonText: 'Cancel',
        } satisfies ConfirmationDialogData,
      })
      .afterClosed()
      .pipe(filter(Boolean), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.apiKeyService
          .delete(this.data.controller, key.api_key_id)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: () => {
              this.toasterService.success('API key permanently deleted');
              this.loadKeys();
            },
            error: (err) => {
              this.toasterService.error(err.error?.message || err.message || 'Failed to delete API key');
            },
          });
      });
  }

  onClose() {
    this.dialogRef.close();
  }
}
