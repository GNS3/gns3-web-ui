import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { BehaviorSubject, Subject, combineLatest } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

import { Controller } from '@models/controller';
import { User } from '@models/users/user';
import {
  AiProfile,
  AiProfilesResponse,
  CreateProfileRequest,
  UpdateProfileRequest,
  SetActiveProfileRequest
} from '@models/ai-profile';

import { AiProfilesService } from '@services/ai-profiles.service';
import { AiProfileDialogComponent } from './ai-profile-dialog/ai-profile-dialog.component';

@Component({
  selector: 'app-ai-profile-tab',
  templateUrl: './ai-profile-tab.component.html',
  styleUrls: ['./ai-profile-tab.component.scss']
})
export class AiProfileTabComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Input properties from parent component
  @Input() controller: Controller;
  @Input() user: User;

  // Data state
  loading$ = new BehaviorSubject<boolean>(false);
  error$ = new BehaviorSubject<string | null>(null);
  profiles$ = new BehaviorSubject<AiProfile[]>([]);
  activeProfile$ = new BehaviorSubject<AiProfile | null>(null);
  currentVersion$ = new BehaviorSubject<number>(0);

  // Local data
  profiles: AiProfile[] = [];
  activeProfile: AiProfile | null = null;
  currentVersion = 0;

  // Table columns
  displayedColumns: string[] = ['name', 'provider', 'model', 'temperature', 'actions'];

  constructor(
    private aiProfilesService: AiProfilesService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadProfiles();

    // Subscribe to data changes
    combineLatest([
      this.profiles$,
      this.activeProfile$,
      this.currentVersion$
    ]).pipe(
      takeUntil(this.destroy$)
    ).subscribe(([profiles, activeProfile, version]) => {
      this.profiles = profiles;
      this.activeProfile = activeProfile;
      this.currentVersion = version;
    });

    // Subscribe to errors
    this.error$.pipe(
      takeUntil(this.destroy$),
      filter(error => error !== null)
    ).subscribe(error => {
      this.showError(error);
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Load profiles list
   */
  loadProfiles(): void {
    this.loading$.next(true);
    this.error$.next(null);

    this.aiProfilesService.getProfiles(this.controller, this.user.user_id)
      .pipe(
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (response: AiProfilesResponse) => {
          this.profiles$.next(response.profiles);

          // Find active profile
          const active = response.profiles.find(p => p.name === response.active);
          this.activeProfile$.next(active || null);
          this.currentVersion$.next(response.version);

          this.loading$.next(false);
        },
        error: (error) => {
          this.handleError(error, 'Failed to load profiles');
        }
      });
  }

  /**
   * Open create profile dialog
   */
  openCreateDialog(): void {
    const dialogRef = this.dialog.open(AiProfileDialogComponent, {
      width: '600px',
      data: {
        mode: 'create',
        profile: {},
        existingNames: this.profiles.map(p => p.name)
      }
    });

    dialogRef.afterClosed().pipe(takeUntil(this.destroy$)).subscribe(result => {
      if (result) {
        this.createProfile(result);
      }
    });
  }

  /**
   * Open edit profile dialog
   */
  openEditDialog(profile: AiProfile): void {
    const dialogRef = this.dialog.open(AiProfileDialogComponent, {
      width: '600px',
      data: {
        mode: 'edit',
        profile: { ...profile },
        existingNames: this.profiles.map(p => p.name).filter(n => n !== profile.name)
      }
    });

    dialogRef.afterClosed().pipe(takeUntil(this.destroy$)).subscribe(result => {
      if (result) {
        this.updateProfile(profile.name, result);
      }
    });
  }

  /**
   * Create profile
   */
  createProfile(profileData: Partial<AiProfile>): void {
    this.loading$.next(true);

    this.aiProfilesService.createProfile(
      this.controller,
      this.user.user_id,
      profileData as CreateProfileRequest
    ).pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (newProfile: AiProfile) => {
          const updatedProfiles = [...this.profiles, newProfile];
          this.profiles$.next(updatedProfiles);
          this.loading$.next(false);
          this.showSuccess('Profile created successfully');
        },
        error: (error) => {
          this.handleError(error, 'Failed to create profile');
        }
      });
  }

  /**
   * Update profile
   */
  updateProfile(profileName: string, updates: Partial<AiProfile>): void {
    this.loading$.next(true);

    const request: UpdateProfileRequest = {
      ...updates,
      expected_version: this.currentVersion
    };

    this.aiProfilesService.updateProfile(
      this.controller,
      this.user.user_id,
      profileName,
      request
    ).pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updatedProfile: AiProfile) => {
          const updatedProfiles = this.profiles.map(p =>
            p.name === profileName ? updatedProfile : p
          );
          this.profiles$.next(updatedProfiles);
          this.currentVersion$.next(this.currentVersion + 1);
          this.loading$.next(false);
          this.showSuccess('Profile updated successfully');
        },
        error: (error) => {
          if (error.status === 409) {
            this.handleConflict(error);
          } else {
            this.handleError(error, 'Failed to update profile');
          }
        }
      });
  }

  /**
   * Delete profile
   */
  deleteProfile(profile: AiProfile): void {
    if (confirm(`Are you sure you want to delete profile "${profile.name}"?`)) {
      this.loading$.next(true);

      this.aiProfilesService.deleteProfile(
        this.controller,
        this.user.user_id,
        profile.name
      ).pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            const updatedProfiles = this.profiles.filter(p => p.name !== profile.name);

            // If deleted profile was active, need to set new active
            let newActive = this.activeProfile;
            if (this.activeProfile?.name === profile.name) {
              newActive = updatedProfiles[0] || null;
            }

            this.profiles$.next(updatedProfiles);
            this.activeProfile$.next(newActive);
            this.loading$.next(false);
            this.showSuccess('Profile deleted successfully');
          },
          error: (error) => {
            this.handleError(error, 'Failed to delete profile');
          }
        });
    }
  }

  /**
   * Set active profile
   */
  setActiveProfile(profileName: string): void {
    this.loading$.next(true);

    const request: SetActiveProfileRequest = {
      profile_name: profileName,
      expected_version: this.currentVersion
    };

    this.aiProfilesService.setActiveProfile(
      this.controller,
      this.user.user_id,
      request
    ).pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: AiProfilesResponse) => {
          this.profiles$.next(response.profiles);
          this.activeProfile$.next(
            response.profiles.find(p => p.name === response.active) || null
          );
          this.currentVersion$.next(response.version);
          this.loading$.next(false);
          this.showSuccess('Active profile set successfully');
        },
        error: (error) => {
          if (error.status === 409) {
            this.handleConflict(error);
          } else {
            this.handleError(error, 'Failed to set active profile');
          }
        }
      });
  }

  /**
   * Handle 409 conflict error
   */
  private handleConflict(error: any): void {
    // Reload data
    this.loadProfiles();
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
      panelClass: ['success-snackbar']
    });
  }

  /**
   * Show warning message
   */
  private showWarning(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      panelClass: ['warning-snackbar']
    });
  }

  /**
   * Show error message
   */
  private showError(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      panelClass: ['error-snackbar']
    });
  }
}
