import { from, of, Subscription } from 'rxjs';
import { concatMap, filter, map, switchMap, tap, timeout, toArray } from 'rxjs/operators';
import { ImageChecksumService } from '@services/image-checksum.service';
import { ImageManagerService } from '@services/image-manager.service';
import { ImageApplianceMatch } from '@models/images';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, inject, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ErrorStateMatcher } from '@angular/material/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatRadioModule } from '@angular/material/radio';
import { Controller } from '@models/controller';
import { BackgroundUploadService } from '@services/background-upload.service';
import { ToasterService } from '@services/toaster.service';

@Component({
  standalone: true,
  selector: 'app-add-image-dialog',
  templateUrl: './add-image-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatRadioModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
  ],
})
export class AddImageDialogComponent implements OnDestroy {
  private checksumService = inject(ImageChecksumService);
  private imageManagerService = inject(ImageManagerService);
  private compatibilitySubscription?: Subscription;
  compatibilityState: 'idle' | 'checking' | 'ready' | 'error' = 'idle';
  compatibilityProgress = '';
  compatibilityError = '';
  compatibilityResults: { filename: string; matches: ImageApplianceMatch[]; reason?: string }[] = [];
  private backgroundUploadService = inject(BackgroundUploadService);
  private toasterService = inject(ToasterService);
  private cd = inject(ChangeDetectorRef);

  step: 'files' | 'appliances' = 'files';
  install_appliance: boolean = false;
  selectedFiles: File[] = [];
  subdirectory = '';
  readonly subdirectoryErrorStateMatcher: ErrorStateMatcher = {
    isErrorState: () => !!this.subdirectoryError,
  };

  get subdirectoryError(): string {
    if (!this.subdirectory) return '';
    const parts = this.subdirectory.split('/');
    if (this.subdirectory.length > 512 || parts.length > 8)
      return 'Use at most eight subfolder levels and 512 characters.';
    if (
      parts.some(
        (part) =>
          !/^[A-Za-z0-9][A-Za-z0-9 ._-]{0,63}$/.test(part) ||
          /[\r\n]/.test(part) ||
          /[. ]$/.test(part) ||
          /\.(tmp|md5sum)$/.test(part) ||
          /^(lib|lib64)$/i.test(part) ||
          /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(\..*)?$/i.test(part)
      )
    ) {
      return 'Use relative folder names with letters, numbers, spaces, dots, hyphens or underscores. Hidden and reserved names are not allowed.';
    }
    return '';
  }

  get canProceed(): boolean {
    return this.selectedFiles.length > 0 && !this.subdirectoryError;
  }

  get canUpload(): boolean {
    return this.canProceed && (!this.install_appliance || this.compatibilityState === 'ready');
  }

  constructor(
    @Inject(MAT_DIALOG_DATA) public controller: Controller,
    public dialogRef: MatDialogRef<AddImageDialogComponent>
  ) {}

  onFilesSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || !input.files.length) return;

    this.cancelCompatibilityCheck();
    this.selectedFiles = Array.from(input.files);
    input.value = '';
    this.cd.markForCheck();
  }

  nextStep(): void {
    if (!this.canProceed) return;
    this.step = 'appliances';
    if (this.install_appliance) this.checkCompatibility();
  }

  uploadFiles(): void {
    if (this.step !== 'appliances' || !this.canUpload) return;
    for (const file of this.selectedFiles) {
      this.backgroundUploadService.queueFile(this.controller, file, this.install_appliance, this.subdirectory);
    }
    const label = this.selectedFiles.length === 1 ? '1 file' : `${this.selectedFiles.length} files`;
    this.toasterService.success(`${label} queued — uploading in the background`);
    this.dialogRef.close(true);
  }

  selectInstallApplianceOption(ev: { value: boolean }) {
    this.install_appliance = ev.value === true;
    if (this.install_appliance) this.checkCompatibility();
    else this.cancelCompatibilityCheck();
    this.cd.markForCheck();
  }

  back(): void {
    this.cancelCompatibilityCheck();
    this.step = 'files';
  }

  checkCompatibility(): void {
    this.cancelCompatibilityCheck();
    this.compatibilityState = 'checking';
    const files = [...this.selectedFiles];
    this.compatibilityProgress = 'Checking the server appliance catalog…';
    let phase = 'catalog';
    this.compatibilitySubscription = this.imageManagerService
      .getCompatibilityCatalog(this.controller)
      .pipe(
        timeout(30000),
        switchMap((catalog) => {
          if (
            !Array.isArray(catalog?.image_sizes) ||
            catalog.image_sizes.some((size) => !Number.isSafeInteger(size) || size < 0) ||
            typeof catalog.has_unknown_sizes !== 'boolean'
          )
            throw new Error('The server returned an invalid compatibility catalog.');
          const sizes = new Set(catalog.image_sizes);
          return from(files).pipe(
            concatMap((file) => {
              if (!catalog.has_unknown_sizes && !sizes.has(file.size)) {
                return of({
                  filename: file.name,
                  checksum: '',
                  reason:
                    'No appliance definition found in the server catalog for this image. You can upload it and create a template manually.',
                });
              }
              phase = 'file';
              return this.checksumService.calculate(file).pipe(
                tap(({ progress }) => {
                  this.compatibilityProgress = `Reading ${file.name}: ${progress}%`;
                  this.cd.markForCheck();
                }),
                filter((result) => !!result.checksum),
                map((result) => ({ filename: file.name, checksum: result.checksum!, reason: '' }))
              );
            }),
            toArray()
          );
        }),
        switchMap((hashed) => {
          phase = 'catalog';
          this.compatibilityProgress = 'Checking the server appliance catalog…';
          this.cd.markForCheck();
          const checksums = hashed.filter((image) => image.checksum).map((image) => image.checksum);
          const lookup = checksums.length
            ? this.imageManagerService.checkCompatibility(this.controller, checksums)
            : of([]);
          return lookup.pipe(
            timeout(30000),
            map((results) =>
              hashed.map((image) => {
                if (!image.checksum) return { filename: image.filename, matches: [], reason: image.reason };
                const result = results.find((result) => result.checksum === image.checksum);
                if (!result || !Array.isArray(result.matches))
                  throw new Error('The server returned an incomplete compatibility result.');
                return { filename: image.filename, matches: result.matches };
              })
            )
          );
        })
      )
      .subscribe({
        next: (results) => {
          this.compatibilityResults = results;
          this.compatibilityState = 'ready';
          this.cd.markForCheck();
        },
        error: (error) => {
          this.compatibilityState = 'error';
          const status = error?.originalError?.status ?? error?.status;
          let reason: string;
          if (phase === 'file') reason = error?.message || 'The selected file could not be read.';
          else if (status === 404)
            reason = 'The server does not support this compatibility endpoint. Restart the updated GNS3 server.';
          else if (status === 401 || status === 403)
            reason = 'The server denied the compatibility check. Check your login and image upload permissions.';
          else if (status === 0)
            reason = 'The server could not be reached. Check its connection and browser access settings.';
          else if (error?.name === 'TimeoutError') reason = 'The server catalog check timed out after 30 seconds.';
          else
            reason =
              error?.error?.message || error?.message || 'The server returned an invalid compatibility response.';
          this.compatibilityError = `Compatibility could not be checked: ${reason} Retry, or select No to upload without creating templates.`;
          this.cd.markForCheck();
        },
      });
    this.cd.markForCheck();
  }

  private cancelCompatibilityCheck(): void {
    this.compatibilitySubscription?.unsubscribe();
    this.compatibilitySubscription = undefined;
    this.compatibilityState = 'idle';
    this.compatibilityProgress = '';
    this.compatibilityResults = [];
    this.compatibilityError = '';
  }

  ngOnDestroy(): void {
    this.cancelCompatibilityCheck();
  }

  closeDialog() {
    this.cancelCompatibilityCheck();
    this.dialogRef.close(false);
  }
}
