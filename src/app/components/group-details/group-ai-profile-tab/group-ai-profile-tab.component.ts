import { ChangeDetectionStrategy, Component, OnInit, OnDestroy, inject, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BehaviorSubject, Subject, combineLatest } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { Controller } from '@models/controller';
import { Group } from '@models/groups/group';
import {
  LLMModelConfigResponse,
  LLMModelConfigListResponse,
  CreateLLMModelConfigRequest,
  UpdateLLMModelConfigRequest,
} from '@models/ai-profile';

import { AiProfilesService } from '@services/ai-profiles.service';
import { AiProfileDialogComponent } from '@components/user-management/user-detail/ai-profile-tab/ai-profile-dialog/ai-profile-dialog.component';
import { ConfirmDialogComponent } from '@components/user-management/user-detail/ai-profile-tab/ai-profile-dialog/confirm-dialog/confirm-dialog.component';

@Component({
  standalone: true,
  selector: 'app-group-ai-profile-tab',
  templateUrl: './group-ai-profile-tab.component.html',
  styleUrls: ['./group-ai-profile-tab.component.scss'],
  imports: [
    CommonModule,
    MatDialogModule,
    MatSnackBarModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatCardModule,
    MatProgressSpinnerModule,
  ],
  // TODO: This component has been partially migrated to be zoneless-compatible.
  // After testing, this should be updated to ChangeDetectionStrategy.OnPush.
  changeDetection: ChangeDetectionStrategy.Default,
})
export class GroupAiProfileTabComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Input properties from parent component
  readonly controller = input<Controller>(undefined);
  readonly group = input<Group>(undefined);

  // Data state
  loading$ = new BehaviorSubject<boolean>(false);
  settingDefault$ = new BehaviorSubject<Set<string>>(new Set());
  error$ = new BehaviorSubject<string | null>(null);
  configs$ = new BehaviorSubject<LLMModelConfigResponse[]>([]);
  defaultConfig$ = new BehaviorSubject<LLMModelConfigResponse | null>(null);

  // Local data
  configs: LLMModelConfigResponse[] = [];
  defaultConfig: LLMModelConfigResponse | null = null;
  settingDefaultConfigs = new Set<string>();

  // Table columns - now with model type column
  readonly displayedColumns = signal(['name', 'model_type', 'provider', 'model', 'context_limit', 'actions']);

  private aiProfilesService = inject(AiProfilesService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  constructor() {}

  ngOnInit(): void {
    this.loadConfigs();

    // Subscribe to data changes
    combineLatest([this.configs$, this.defaultConfig$])
      .pipe(takeUntil(this.destroy$))
      .subscribe(([configs, defaultConfig]) => {
        this.configs = configs;
        this.defaultConfig = defaultConfig;
      });

    // Subscribe to errors
    this.error$
      .pipe(
        takeUntil(this.destroy$),
        filter((error) => error !== null)
      )
      .subscribe((error) => {
        this.showError(error);
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Load configurations list
   */
  loadConfigs(): void {
    this.loading$.next(true);
    this.error$.next(null);

    this.aiProfilesService
      .getGroupConfigs(this.controller(), this.group().user_group_id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: LLMModelConfigListResponse) => {
          this.configs$.next(response.configs);
          this.defaultConfig$.next(response.default_config);
          this.loading$.next(false);
        },
        error: (error) => {
          this.handleError(error, 'Failed to load configurations');
        },
      });
  }

  /**
   * Check if config is default
   */
  isDefault(config: LLMModelConfigResponse): boolean {
    return this.defaultConfig?.config_id === config.config_id;
  }

  /**
   * Open create configuration dialog
   */
  openCreateDialog(): void {
    const dialogRef = this.dialog.open(AiProfileDialogComponent, {
      width: '700px',
      data: {
        mode: 'create',
        config: null,
        existingNames: this.configs.map((c) => c.name),
      },
    });

    dialogRef
      .afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((result) => {
        if (result) {
          this.createConfig(result);
        }
      });
  }

  /**
   * Open edit configuration dialog
   */
  openEditDialog(config: LLMModelConfigResponse): void {
    const dialogRef = this.dialog.open(AiProfileDialogComponent, {
      width: '700px',
      data: {
        mode: 'edit',
        config: { ...config },
        existingNames: this.configs.filter((c) => c.config_id !== config.config_id).map((c) => c.name),
      },
    });

    dialogRef
      .afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((result) => {
        if (result) {
          this.updateConfig(config.config_id, result);
        }
      });
  }

  /**
   * Create configuration
   */
  createConfig(configData: CreateLLMModelConfigRequest): void {
    this.loading$.next(true);

    this.aiProfilesService
      .createGroupConfig(this.controller(), this.group().user_group_id, configData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          // Reload all configs to get fresh data
          this.loadConfigs();
          this.showSuccess('Configuration created successfully');
        },
        error: (error) => {
          this.handleError(error, 'Failed to create configuration');
        },
      });
  }

  /**
   * Update configuration
   */
  updateConfig(configId: string, updates: UpdateLLMModelConfigRequest): void {
    this.loading$.next(true);

    this.aiProfilesService
      .updateGroupConfig(this.controller(), this.group().user_group_id, configId, updates)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          // Reload all configs to get fresh data
          this.loadConfigs();
          this.showSuccess('Configuration updated successfully');
        },
        error: (error) => {
          if (error.status === 409) {
            this.handleConflict(error);
          } else {
            this.handleError(error, 'Failed to update configuration');
          }
        },
      });
  }

  /**
   * Delete configuration
   */
  deleteConfig(config: LLMModelConfigResponse): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Delete Configuration',
        message: `Are you sure you want to delete configuration "${config.name}"? This action cannot be undone.`,
        confirmText: 'Delete',
        cancelText: 'Cancel',
      },
    });

    dialogRef
      .afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((result) => {
        if (result) {
          this.loading$.next(true);

          this.aiProfilesService
            .deleteGroupConfig(this.controller(), this.group().user_group_id, config.config_id)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
              next: () => {
                // Reload all configs to get fresh data
                this.loadConfigs();
                this.showSuccess('Configuration deleted successfully');
              },
              error: (error) => {
                this.handleError(error, 'Failed to delete configuration');
              },
            });
        }
      });
  }

  /**
   * Toggle default configuration (set if not default, unset if already default)
   */
  toggleDefaultConfig(config: LLMModelConfigResponse): void {
    const configId = config.config_id;
    const isCurrentlyDefault = this.isDefault(config);

    // Add to setting default set (button-level loading state)
    this.settingDefaultConfigs.add(configId);
    this.settingDefault$.next(new Set(this.settingDefaultConfigs));

    if (isCurrentlyDefault) {
      this.aiProfilesService
        .unsetDefaultGroupConfig(this.controller(), this.group().user_group_id, configId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            // Reload all configs to get fresh data
            this.loadConfigs();

            // Remove from setting default set
            this.settingDefaultConfigs.delete(configId);
            this.settingDefault$.next(new Set(this.settingDefaultConfigs));

            this.showSuccess('Default configuration removed');
          },
          error: (error) => {
            // Remove from setting default set on error too
            this.settingDefaultConfigs.delete(configId);
            this.settingDefault$.next(new Set(this.settingDefaultConfigs));

            if (error.status === 409) {
              this.handleConflict(error);
            } else {
              this.handleError(error, 'Failed to remove default configuration');
            }
          },
        });
    } else {
      this.aiProfilesService
        .setDefaultGroupConfig(this.controller(), this.group().user_group_id, configId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            // Reload all configs to get fresh data
            this.loadConfigs();

            // Remove from setting default set
            this.settingDefaultConfigs.delete(configId);
            this.settingDefault$.next(new Set(this.settingDefaultConfigs));

            this.showSuccess('Default configuration set successfully');
          },
          error: (error) => {
            // Remove from setting default set on error too
            this.settingDefaultConfigs.delete(configId);
            this.settingDefault$.next(new Set(this.settingDefaultConfigs));

            if (error.status === 409) {
              this.handleConflict(error);
            } else {
              this.handleError(error, 'Failed to set default configuration');
            }
          },
        });
    }
  }

  /**
   * Handle 409 conflict error
   */
  private handleConflict(error: any): void {
    // Reload data
    this.loadConfigs();
    this.showWarning('Data has been modified by another user, auto-refreshed');
  }

  /**
   * Error handling
   */
  private handleError(error: any, defaultMessage: string): void {
    console.error(`${defaultMessage}:`, error);

    let message = defaultMessage;
    if (error?.error?.detail) {
      message = error.error.detail;
    } else if (error?.message) {
      message = error.message;
    }

    this.error$.next(message);
    this.loading$.next(false);
    this.showError(message);
  }

  /**
   * Show success message
   */
  private showSuccess(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      panelClass: ['success-snackbar'],
    });
  }

  /**
   * Show warning message
   */
  private showWarning(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      panelClass: ['warning-snackbar'],
    });
  }

  /**
   * Show error message
   */
  private showError(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      panelClass: ['error-snackbar'],
    });
  }
}
