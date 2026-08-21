import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  ElementRef,
  Input,
  OnInit,
  computed,
  effect,
  inject,
  model,
  signal,
  viewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, UntypedFormControl, Validators } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatStepper, MatStepperModule } from '@angular/material/stepper';
import { StepperSelectionEvent } from '@angular/cdk/stepper';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FileItem, FileUploader, ParsedResponseHeaders, FileUploadModule } from 'ng2-file-upload';
import * as SparkMD5 from 'spark-md5';
import { timer } from 'rxjs';
import { v4 as uuid } from 'uuid';
import { ProgressService } from '../../../common/progress/progress.service';
import { ConfirmationDialogComponent } from '@components/dialogs/confirmation-dialog/confirmation-dialog.component';
import { Appliance, Image, Images, Version } from '@models/appliance';
import { Controller } from '@models/controller';
import { Template } from '@models/template';
import { DockerTemplate } from '@models/templates/docker-template';
import { IosTemplate } from '@models/templates/ios-template';
import { IouTemplate } from '@models/templates/iou-template';
import { QemuTemplate } from '@models/templates/qemu-template';
import { ApplianceService } from '@services/appliances.service';
import { getVersionSettingProperties, buildApplianceMetadata, normalizeAppliance } from '@services/appliance-normalizer';
import { ControllerService } from '@services/controller.service';
import { DockerService } from '@services/docker.service';
import { IosService } from '@services/ios.service';
import { IouService } from '@services/iou.service';
import { QemuService } from '@services/qemu.service';
import { TemplateService } from '@services/template.service';
import { ToasterService } from '@services/toaster.service';
import { ApplianceInfoDialogComponent } from './appliance-info-dialog/appliance-info-dialog.component';
import { UploadServiceService } from '../../../common/uploading-processbar/upload-service.service';
import { UploadingProcessbarComponent } from 'app/common/uploading-processbar/uploading-processbar.component';
import { templateNameAsyncValidator } from '../../../validators/template-name-async-validator';
import { ProjectNameValidator } from '../../projects/models/projectNameValidator';

type CreationAction = 'install' | 'import';
type ApplianceSort = 'name' | 'emulator' | 'vendor';

const ALL_FILTER = 'all';
const IMAGE_SLOTS: (keyof Images)[] = [
  'bios_image',
  'hda_disk_image',
  'hdb_disk_image',
  'hdc_disk_image',
  'hdd_disk_image',
  'cdrom_image',
];

@Component({
  standalone: true,
  selector: 'app-new-template-dialog',
  templateUrl: './new-template-dialog.component.html',
  styleUrls: ['./new-template-dialog.component.scss'],
  providers: [ProjectNameValidator],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatStepperModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatPaginatorModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatExpansionModule,
    MatIconModule,
    MatTooltipModule,
    FileUploadModule,
  ],
})
export class NewTemplateDialogComponent implements OnInit {
  @Input() controller: Controller;

  // ------------------------------------------------------------------
  // Wizard state
  // ------------------------------------------------------------------
  readonly selectedStepIndex = signal(0);
  readonly action = signal<CreationAction>('install');
  readonly applianceToInstall = signal<Appliance | null>(null);
  readonly selectedVersion = signal<Version | null>(null);
  readonly selectedImage = signal<string | null>(null);
  readonly isCreating = signal(false);

  // ------------------------------------------------------------------
  // Registry browsing state
  // ------------------------------------------------------------------
  readonly allAppliances = signal<Appliance[]>([]);
  readonly isLoadingAppliances = signal(true);
  readonly isUpdatingAppliances = signal(false);
  readonly searchText = model('');
  readonly category = model(ALL_FILTER);
  readonly emulator = model(ALL_FILTER);
  readonly vendor = model(ALL_FILTER);
  readonly categories = signal<string[]>([]);
  readonly emulators = signal<string[]>([]);
  readonly vendors = signal<string[]>([]);
  readonly sortBy = model<ApplianceSort>('name');
  readonly sortAscending = signal(true);
  readonly pageIndex = signal(0);
  readonly pageSize = signal(5);

  readonly filteredAppliances = computed(() => {
    const search = this.searchText().toLowerCase();
    const category = this.category();
    const emulator = this.emulator();
    const vendor = this.vendor();
    const direction = this.sortAscending() ? 1 : -1;

    const filtered = this.allAppliances().filter((appliance) => {
      if (search && !appliance.name.toLowerCase().includes(search)) return false;
      if (category !== ALL_FILTER && appliance.category !== category) return false;
      if (emulator !== ALL_FILTER && appliance.emulator !== emulator) return false;
      if (vendor !== ALL_FILTER && appliance.vendor_name !== vendor) return false;
      return true;
    });

    const key = this.sortBy();
    return filtered.sort((a, b) => {
      const first = (key === 'vendor' ? a.vendor_name : key === 'emulator' ? a.emulator : a.name) || '';
      const second = (key === 'vendor' ? b.vendor_name : key === 'emulator' ? b.emulator : b.name) || '';
      return first.toLowerCase().localeCompare(second.toLowerCase()) * direction;
    });
  });

  readonly pagedAppliances = computed(() => {
    const start = this.pageIndex() * this.pageSize();
    return this.filteredAppliances().slice(start, start + this.pageSize());
  });

  // ------------------------------------------------------------------
  // Images available on the controller
  // ------------------------------------------------------------------
  readonly qemuImages = signal<Image[]>([]);
  readonly iosImages = signal<Image[]>([]);
  readonly iouImages = signal<Image[]>([]);

  // ------------------------------------------------------------------
  // Upload state
  // ------------------------------------------------------------------
  uploaderImage: FileUploader;
  uploadProgress: number = 0;
  uploadingImageName: string = '';
  readonly isUploading = signal(false);
  readonly isImportingAppliance = signal(false);
  private checksumCancelled = false;

  // ------------------------------------------------------------------
  // Review state
  // ------------------------------------------------------------------
  templateNameControl: UntypedFormControl;
  readonly nameValid = signal(false);

  readonly requiresImages = computed(() => {
    const appliance = this.applianceToInstall();
    return !!appliance && !appliance.docker;
  });

  readonly lastStepIndex = computed(() => (this.requiresImages() ? 3 : 2));

  readonly browseStepTitle = computed(() =>
    this.action() === 'install' ? 'Choose appliance' : 'Import appliance'
  );

  readonly browseStepDescription = computed(() =>
    this.action() === 'install' ? 'Select from the registry' : 'Upload a .gns3a file'
  );

  readonly filesReady = computed(() => {
    const appliance = this.applianceToInstall();
    if (!appliance) return false;
    if (appliance.qemu) {
      const version = this.selectedVersion();
      return !!version && this.isVersionComplete(version);
    }
    const image = this.selectedImage();
    return !!image && this.checkImageFromVersion(image);
  });

  readonly canAdvance = computed(() => {
    switch (this.selectedStepIndex()) {
      case 0:
        return true;
      case 1:
        return !!this.applianceToInstall();
      case 2:
        return this.requiresImages() ? this.filesReady() : this.nameValid();
      default:
        return this.nameValid();
    }
  });

  readonly stepper = viewChild<MatStepper>('stepper');
  readonly applianceFileInput = viewChild<ElementRef<HTMLInputElement>>('applianceFile');

  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private controllerService = inject(ControllerService);
  private applianceService = inject(ApplianceService);
  private toasterService = inject(ToasterService);
  private qemuService = inject(QemuService);
  private dockerService = inject(DockerService);
  private iosService = inject(IosService);
  private iouService = inject(IouService);
  private templateService = inject(TemplateService);
  public dialog = inject(MatDialog);
  private cd = inject(ChangeDetectorRef);
  private progressService = inject(ProgressService);
  public snackBar = inject(MatSnackBar);
  private uploadServiceService = inject(UploadServiceService);
  private projectNameValidator = inject(ProjectNameValidator);
  private destroyRef = inject(DestroyRef);

  constructor() {
    // Reset pagination whenever the registry filters change.
    effect(() => {
      this.searchText();
      this.category();
      this.emulator();
      this.vendor();
      this.pageIndex.set(0);
    });

    // Automatically pre-select the first version/image whose required files
    // are all present on the controller, so the user can continue right away.
    // Only auto-select while nothing is selected: overriding an explicit user
    // choice (e.g. opening an incomplete version to upload its images) would
    // snap the stepper back to the complete version and make those files
    // unreachable.
    effect(() => {
      const appliance = this.applianceToInstall();
      if (!appliance) return;
      // Track the controller image lists.
      this.qemuImages();
      this.iosImages();
      this.iouImages();

      if (appliance.qemu) {
        if (!this.selectedVersion()) {
          const complete = (appliance.versions || []).find((version) => this.isVersionComplete(version));
          if (complete) this.selectedVersion.set(complete);
        }
      } else if (appliance.dynamips || appliance.iou) {
        if (!this.selectedImage()) {
          const ready = (appliance.images || []).find((image) => this.checkImageFromVersion(image.filename));
          if (ready) this.selectedImage.set(ready.filename);
        }
      }
    });
  }

  ngOnInit() {
    this.setupUploaders();

    // The wizard is now a routed page. When no controller was provided as an
    // input (e.g. directly routed), resolve it from the URL before loading the
    // registry and image lists.
    if (this.controller) {
      this.onControllerReady();
    } else {
      this.loadController();
    }
  }

  private loadController(): void {
    const controllerId = this.route.snapshot.paramMap.get('controller_id') ?? '';
    this.controllerService.get(parseInt(controllerId, 10)).then(
      (controller: Controller) => {
        this.controller = controller;
        this.onControllerReady();
        this.cd.markForCheck();
      },
      (err) => {
        const message = err.error?.message || err.message || 'Failed to load controller';
        this.toasterService.error(message);
        this.cd.markForCheck();
      }
    );
  }

  private onControllerReady(): void {
    this.templateNameControl = new UntypedFormControl(
      '',
      [Validators.required, this.projectNameValidator.get],
      [templateNameAsyncValidator(this.controller, this.templateService)]
    );
    this.templateNameControl.statusChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      // Do not allow submission while the duplicate-name check is pending.
      // Otherwise a fast click can create a duplicate before the async
      // validator has had a chance to report the error.
      this.nameValid.set(this.templateNameControl.status === 'VALID');
    });

    this.loadAppliances();
    this.refreshImages();
  }

  private setupUploaders(): void {
    this.uploaderImage = new FileUploader({ url: '' });
    this.uploaderImage.onAfterAddingFile = (file) => {
      file.withCredentials = false;
    };
    this.uploaderImage.onErrorItem = (
      item: FileItem,
      response: string,
      status: number,
      headers: ParsedResponseHeaders
    ) => {
      this.toasterService.error(
        status === 409 ? 'An error has occurred because image already exists' : 'Failed to import image'
      );
      this.resetUploadState();
      this.cd.markForCheck();
    };
    this.uploaderImage.onSuccessItem = (
      item: FileItem,
      response: string,
      status: number,
      headers: ParsedResponseHeaders
    ) => {
      this.toasterService.success('Image successfully imported');
      const uploadedFilename = this.uploadingImageName;
      this.resetUploadState();
      this.cd.markForCheck();
      // The server computes the image checksum asynchronously after the upload
      // finishes, so poll until the just-uploaded image shows up as installed
      // (otherwise the image stays "missing" until a manual refresh).
      this.refreshImagesUntilReady(uploadedFilename);
    };
    this.uploaderImage.onProgressItem = (progress: any) => {
      this.uploadProgress = progress['progress'];
      this.uploadServiceService.processBarCount(this.uploadProgress);
      this.cd.markForCheck();
    };

    this.uploadServiceService.currentCancelItemDetails
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((isCancel) => {
        if (isCancel) {
          this.cancelUploading();
        }
      });
  }

  // ------------------------------------------------------------------
  // Step navigation
  // ------------------------------------------------------------------
  onStepChange(event: StepperSelectionEvent) {
    this.selectedStepIndex.set(event.selectedIndex);
    // Keep the image status fresh when entering the files step so a manual
    // "Refresh" click is not required after copying images on the server.
    if (this.requiresImages() && event.selectedIndex === 2) {
      this.refreshImages();
    }
  }

  setAction(action: CreationAction) {
    this.action.set(action);
    this.applianceToInstall.set(null);
    this.selectedVersion.set(null);
    this.selectedImage.set(null);
    // Selecting a creation method is enough to move to the browse step, so the
    // import page (with its file picker) is shown right away.
    setTimeout(() => {
      this.stepper()?.next();
      this.cd.markForCheck();
    }, 150);
  }

  selectAppliance(appliance: Appliance) {
    this.applianceToInstall.set(appliance);
    this.selectedVersion.set(null);
    this.selectedImage.set(null);
    if (this.templateNameControl) {
      this.templateNameControl.setValue(appliance.name);
    }
    // Selecting an appliance is enough, move straight to the next step.
    setTimeout(() => {
      this.stepper()?.next();
      this.cd.markForCheck();
    }, 150);
  }

  selectVersion(version: Version) {
    this.selectedVersion.set(version);
  }

  selectImage(filename: string) {
    this.selectedImage.set(filename);
  }

  onCloseClick() {
    this.goBack();
  }

  /**
   * Navigate back to the Templates page on the controller this wizard is
   * editing. Mirrors the behaviour of the manual template creation pages.
   */
  goBack(): void {
    const controllerId =
      this.controller?.id ?? parseInt(this.route.snapshot.paramMap.get('controller_id') ?? '', 10);
    this.router.navigate(['/controller', controllerId, 'preferences']);
  }

  // ------------------------------------------------------------------
  // Registry browsing
  // ------------------------------------------------------------------
  private loadAppliances() {
    this.isLoadingAppliances.set(true);
    this.applianceService.getAppliances(this.controller).subscribe({
      next: (appliances) => {
        this.applyAppliances(appliances);
        this.isLoadingAppliances.set(false);
        this.cd.markForCheck();
      },
      error: (err) => {
        const message = err.error?.message || err.message || 'Failed to load appliances';
        this.toasterService.error(message);
        this.isLoadingAppliances.set(false);
        this.cd.markForCheck();
      },
    });
  }

  updateAppliances() {
    this.isUpdatingAppliances.set(true);
    this.progressService.activate();
    this.applianceService.updateAppliances(this.controller).subscribe({
      next: (appliances) => {
        this.applyAppliances(appliances);
        this.progressService.deactivate();
        this.isUpdatingAppliances.set(false);
        this.toasterService.success('Appliances are up-to-date.');
        this.cd.markForCheck();
      },
      error: (err) => {
        const message = err.error?.message || err.message || 'Failed to update appliances';
        this.progressService.deactivate();
        this.isUpdatingAppliances.set(false);
        this.toasterService.error(message);
        this.cd.markForCheck();
      },
    });
  }

  private applyAppliances(appliances: Appliance[]) {
    appliances.forEach((appliance) => {
      if (appliance.docker) appliance.emulator = 'Docker';
      if (appliance.dynamips) appliance.emulator = 'Dynamips';
      if (appliance.iou) appliance.emulator = 'Iou';
      if (appliance.qemu) appliance.emulator = 'Qemu';
    });
    this.allAppliances.set(appliances);
    this.extractFilterOptions(appliances);
  }

  private extractFilterOptions(appliances: Appliance[]) {
    const categories = new Set<string>();
    const emulators = new Set<string>();
    const vendors = new Set<string>();
    appliances.forEach((appliance) => {
      if (appliance.category) categories.add(appliance.category);
      if (appliance.emulator) emulators.add(appliance.emulator);
      if (appliance.vendor_name) vendors.add(appliance.vendor_name);
    });
    this.categories.set(Array.from(categories).sort());
    this.emulators.set(Array.from(emulators).sort());
    this.vendors.set(Array.from(vendors).sort());
  }

  onPage(event: PageEvent) {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
  }

  toggleSortDirection() {
    this.sortAscending.set(!this.sortAscending());
  }

  formatLabel(value: string): string {
    if (!value) return '';
    return value.replace(/_/g, ' ').replace(/\b\w/g, (character) => character.toUpperCase());
  }

  emulatorIcon(appliance: Appliance): string {
    switch (appliance.emulator) {
      case 'Docker':
        return 'deployed_code';
      case 'Qemu':
        return 'desktop_windows';
      case 'Dynamips':
        return 'router';
      case 'Iou':
        return 'hub';
      default:
        return 'dns';
    }
  }

  showInfo(appliance: Appliance) {
    this.dialog.open(ApplianceInfoDialogComponent, {
      panelClass: ['base-dialog-panel', 'dialog-small-panel'],
      data: { appliance: appliance },
    });
  }

  // ------------------------------------------------------------------
  // Appliance import
  // ------------------------------------------------------------------
  /**
   * Open the native file picker for a .gns3a / .gns3appliance file. The input
   * value is reset first so re-picking the same file still fires a change.
   */
  openApplianceFileBrowser(): void {
    const input = this.applianceFileInput()?.nativeElement;
    if (!input) {
      return;
    }
    input.value = '';
    input.click();
  }

  /**
   * Import a .gns3a / .gns3appliance file. The file is plain JSON describing
   * the appliance, so it is parsed directly in the browser (the same way the
   * GNS3 desktop client imports appliances). The controller has no endpoint
   * to ingest appliance files: posting the JSON to the image upload endpoint
   * fails because it is not a valid disk image.
   */
  addAppliance(event) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    if (!this.controller) {
      this.toasterService.error('Controller is not loaded yet. Please try again.');
      return;
    }
    const fileReader: FileReader = new FileReader();

    fileReader.onloadend = () => {
      this.isImportingAppliance.set(true);
      try {
        // normalizeAppliance maps v8 appliance files onto the legacy shape the
        // template builders below expect (versions/settings/platform fields).
        const appliance = normalizeAppliance(JSON.parse(fileReader.result as string) as Appliance);
        if (!appliance || typeof appliance !== 'object' || !appliance.name) {
          this.toasterService.error(`'${file.name}' is not a valid appliance file`);
          return;
        }
        if (!appliance.qemu && !appliance.dynamips && !appliance.iou && !appliance.docker) {
          this.toasterService.error('Template type not supported');
          return;
        }
        // Derive the emulator label the same way as for registry appliances
        // (it is shown in the review summary).
        if (appliance.docker) appliance.emulator = 'Docker';
        if (appliance.dynamips) appliance.emulator = 'Dynamips';
        if (appliance.iou) appliance.emulator = 'Iou';
        if (appliance.qemu) appliance.emulator = 'Qemu';
        this.applianceToInstall.set(appliance);
        this.selectedVersion.set(null);
        this.selectedImage.set(null);
        if (this.templateNameControl) {
          this.templateNameControl.setValue(appliance.name);
        }
        this.toasterService.success('Appliance imported successfully');
        setTimeout(() => {
          this.stepper()?.next();
          this.cd.markForCheck();
        }, 100);
      } catch (err) {
        // JSON.parse failed - the selected file is not an appliance file.
        this.toasterService.error(`'${file.name}' is not a valid appliance file`);
      } finally {
        // Never leave the wizard stuck on "Importing..." regardless of the outcome.
        this.isImportingAppliance.set(false);
        this.cd.markForCheck();
      }
    };

    fileReader.readAsText(file);
  }

  // ------------------------------------------------------------------
  // Image handling
  // ------------------------------------------------------------------
  refreshImages() {
    this.qemuService.getImages(this.controller).subscribe({
      next: (qemuImages) => {
        this.qemuImages.set(qemuImages);
        this.cd.markForCheck();
      },
      error: (err) => {
        const message = err.error?.message || err.message || 'Failed to load QEMU images';
        this.toasterService.error(message);
        this.cd.markForCheck();
      },
    });

    this.iosService.getImages(this.controller).subscribe({
      next: (iosImages) => {
        this.iosImages.set(iosImages);
        this.cd.markForCheck();
      },
      error: (err) => {
        const message = err.error?.message || err.message || 'Failed to load IOS images';
        this.toasterService.error(message);
        this.cd.markForCheck();
      },
    });

    this.iouService.getImages(this.controller).subscribe({
      next: (iouImages) => {
        this.iouImages.set(iouImages);
        this.cd.markForCheck();
      },
      error: (err) => {
        const message = err.error?.message || err.message || 'Failed to load IOU images';
        this.toasterService.error(message);
        this.cd.markForCheck();
      },
    });
  }

  private refreshImagesUntilReady(filename: string, attempt = 0): void {
    const MAX_ATTEMPTS = 15;
    const appliance = this.applianceToInstall();
    const service = appliance?.qemu ? this.qemuService : appliance?.dynamips ? this.iosService : this.iouService;
    service
      .getImages(this.controller)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (images: Image[]) => {
          if (appliance?.qemu) this.qemuImages.set(images);
          else if (appliance?.dynamips) this.iosImages.set(images);
          else this.iouImages.set(images);
          this.cd.markForCheck();
          if (this.checkImageFromVersion(filename) || attempt >= MAX_ATTEMPTS) return;
          timer(1000)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(() => this.refreshImagesUntilReady(filename, attempt + 1));
        },
        error: () => {
          // Image indexing can briefly make the image endpoint unavailable.
          // Keep polling within the same bounded retry window instead of
          // leaving the image permanently marked as missing.
          if (attempt >= MAX_ATTEMPTS) return;
          timer(1000)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(() => this.refreshImagesUntilReady(filename, attempt + 1));
        },
      });
  }

  importImage(event, imageName) {
    const file = event?.target?.files?.[0];
    if (!file) {
      return;
    }

    this.uploadingImageName = imageName;
    this.checksumCancelled = false;
    // Open the progress snackbar up front and drive it from the MD5 computation,
    // so the user sees feedback during the (potentially long) local checksum phase.
    this.uploadServiceService.setMessage('Computing checksum');
    this.uploadServiceService.setComputing(true);
    this.openSnackBar();
    this.uploadServiceService.processBarCount(0);

    this.computeChecksumMd5(file, false, (percent) => {
      this.uploadServiceService.processBarCount(percent);
    }).then((output) => {
      if (this.checksumCancelled) return;

      const imageToInstall = this.applianceToInstall()?.images?.find((n) => n.filename === imageName);

      // Defensive: an imported .gns3a may reference a version image that is
      // missing from the top-level images array. Bail out cleanly instead of
      // crashing on imageToInstall.md5sum and leaving the wizard stuck.
      if (!imageToInstall) {
        this.resetUploadState();
        this.toasterService.error(`Image '${imageName}' was not found in the appliance definition`);
        this.cd.markForCheck();
        return;
      }

      if (imageToInstall.md5sum !== output) {
        // Close the checksum snackbar so it does not linger behind the dialog.
        this.uploadServiceService.processBarCount(null);
        this.uploadServiceService.setMessage('');
        this.uploadServiceService.setComputing(false);
        this.progressService.deactivate();
        const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
          autoFocus: '.cancel-button',
          disableClose: true,
          panelClass: ['base-confirmation-dialog-panel', 'confirmation-warning-panel'],
          data: {
            title: 'Use image with a different checksum?',
            message: `The selected file has MD5 checksum ${output}, but ${imageToInstall.md5sum} was expected.`,
            note: 'Only continue if you trust this image.',
            confirmButtonText: 'Use image',
            tone: 'warning',
            icon: 'verified_user',
          },
        });
        dialogRef.afterClosed().subscribe((answer: boolean) => {
          if (answer) {
            this.openSnackBar();
            this.uploadServiceService.setMessage('Uploading');
            this.uploadServiceService.setComputing(false);
            this.importImageFile(imageName);
          } else {
            this.resetUploadState();
            this.cd.markForCheck();
          }
        });
      } else {
        this.uploadServiceService.setMessage('Uploading');
        this.uploadServiceService.setComputing(false);
        this.uploadServiceService.processBarCount(0);
        this.importImageFile(imageName);
      }
    }).catch((err) => {
      // A local read error must close the progress UI and clear the queued
      // file; otherwise the wizard remains in a stale checksum phase.
      if (this.checksumCancelled) return;
      this.resetUploadState();
      this.toasterService.error(typeof err === 'string' ? err : 'MD5 computation failed - error reading the file');
      this.cd.markForCheck();
    });
  }

  private importImageFile(imageName: string) {
    // Reading the file into memory is intentionally avoided: large disk images
    // would blow up the browser. The file is already queued by ng2FileSelect,
    // so we only configure the upload URL/headers and start the upload.
    const url = this.applianceService.getUploadPath(this.controller, imageName);
    this.uploaderImage.queue.forEach((elem) => (elem.url = url));

    const itemToUpload = this.uploaderImage.queue[0];
    const options = (itemToUpload as any)?.options;
    if (!itemToUpload || !options) {
      this.resetUploadState();
      this.toasterService.error('The selected file could not be queued for upload');
      this.cd.markForCheck();
      return;
    }
    options.disableMultipart = true;
    options.headers = [{ name: 'Authorization', value: 'Bearer ' + this.controller.authToken }];

    this.isUploading.set(true);
    this.uploadProgress = 0;
    this.uploaderImage.uploadItem(itemToUpload);
    this.cd.markForCheck();
  }

  cancelUploading() {
    this.checksumCancelled = true;
    this.resetUploadState();
    this.toasterService.warning('File upload cancelled');
    this.uploadServiceService.cancelFileUploading(false);
    this.cd.markForCheck();
  }

  private resetUploadState(): void {
    this.progressService.deactivate();
    this.uploaderImage.clearQueue();
    this.uploadProgress = 0;
    this.isUploading.set(false);
    this.uploadingImageName = '';
    this.uploadServiceService.processBarCount(null);
    this.uploadServiceService.setMessage('');
    this.uploadServiceService.setComputing(false);
  }

  checkImageFromVersion(image: string): boolean {
    const appliance = this.applianceToInstall();
    if (!appliance) return false;
    const imageToInstall = appliance.images?.find((n) => n.filename === image);
    if (!imageToInstall) return false;
    if (appliance.qemu) {
      if (this.qemuImages().filter((n) => n.checksum === imageToInstall.md5sum).length > 0) return true;
    } else if (appliance.dynamips) {
      if (this.iosImages().filter((n) => n.checksum === imageToInstall.md5sum).length > 0) return true;
    } else if (appliance.iou) {
      if (this.iouImages().filter((n) => n.checksum === imageToInstall.md5sum).length > 0) return true;
    }

    return false;
  }

  getVersionImages(version: Version): { key: keyof Images; filename: string }[] {
    return IMAGE_SLOTS.filter((slot) => version.images[slot]).map((slot) => ({
      key: slot,
      filename: version.images[slot],
    }));
  }

  /**
   * Get the count of images in a version
   */
  getVersionImageCount(version: Version): number {
    return this.getVersionImages(version).length;
  }

  /**
   * Get the count of ready (installed) images in a version
   */
  getVersionReadyCount(version: Version): number {
    return this.getVersionImages(version).filter((image) => this.checkImageFromVersion(image.filename)).length;
  }

  /**
   * Check if all images in a version are ready
   */
  isVersionComplete(version: Version): boolean {
    return this.getVersionImageCount(version) > 0 && this.getVersionReadyCount(version) === this.getVersionImageCount(version);
  }

  openConfirmationDialog(message: string, link: string) {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      autoFocus: '.cancel-button',
      disableClose: true,
      panelClass: ['base-confirmation-dialog-panel', 'confirmation-neutral-panel'],
      data: {
        title: 'Open external download?',
        message,
        confirmButtonText: 'Open download',
        tone: 'neutral',
        icon: 'open_in_new',
      },
    });

    dialogRef.afterClosed().subscribe((answer: boolean) => {
      if (answer) {
        window.open(link);
      }
    });
  }

  downloadImage(image: Image) {
    const directDownloadMessage: string =
      'Download will redirect you where the required file can be downloaded, you may have to be registered with the vendor in order to download the file.';
    const compressionMessage: string = `The file is compressed with ${image.compression}, it must be uncompressed first.`;

    if (image.direct_download_url) {
      if (image.compression) {
        this.openConfirmationDialog(compressionMessage, image.direct_download_url);
      } else {
        window.open(image.direct_download_url);
      }
    } else {
      this.openConfirmationDialog(directDownloadMessage, image.download_url);
    }
  }

  downloadImageFromVersion(image: string) {
    this.applianceToInstall().images.forEach((n) => {
      if (n.filename === image) this.downloadImage(n);
    });
  }

  // ------------------------------------------------------------------
  // Template creation
  // ------------------------------------------------------------------
  getCategory() {
    if (this.applianceToInstall().category === 'multilayer_switch') {
      return 'switch';
    }
    return this.applianceToInstall().category;
  }

  private buildIouTemplate(image: Image, name: string): IouTemplate {
    const appliance = this.applianceToInstall();
    let iou_image = image.filename;
    let imageToInstall = appliance.images.filter((n) => n.filename === iou_image)[0];
    let imageToUse = this.iouImages().filter((n) => n.checksum === imageToInstall.md5sum);
    if (imageToUse.length > 0) {
      iou_image = imageToUse[0].filename; // use the image name from the controller
    }

    let iouTemplate: IouTemplate = new IouTemplate();
    iouTemplate.nvram = appliance.iou.nvram;
    iouTemplate.ram = appliance.iou.ram;
    iouTemplate.ethernet_adapters = appliance.iou.ethernet_adapters;
    iouTemplate.serial_adapters = appliance.iou.serial_adapters;
    iouTemplate.startup_config = appliance.iou.startup_config;
    iouTemplate.category = this.getCategory();
    iouTemplate.default_name_format = appliance.default_name_format;
    iouTemplate.symbol = appliance.symbol;
    iouTemplate.tags = appliance.tags || [];
    iouTemplate.compute_id = 'local';
    iouTemplate.template_id = uuid();
    iouTemplate.path = iou_image;
    iouTemplate.template_type = 'iou';
    iouTemplate.netmiko_device_type = appliance.netmiko_device_type || null;
    iouTemplate.appliance_metadata = buildApplianceMetadata(appliance);
    iouTemplate.name = name;
    return iouTemplate;
  }

  private buildIosTemplate(image: Image, name: string): IosTemplate {
    const appliance = this.applianceToInstall();
    let ios_image = image.filename;
    let imageToInstall = appliance.images.filter((n) => n.filename === ios_image)[0];
    let imageToUse = this.iosImages().filter((n) => n.checksum === imageToInstall.md5sum);
    if (imageToUse.length > 0) {
      ios_image = imageToUse[0].filename; // use the image name from the controller
    }

    let iosTemplate: IosTemplate = new IosTemplate();
    iosTemplate.chassis = appliance.dynamips.chassis;
    iosTemplate.nvram = appliance.dynamips.nvram;
    iosTemplate.platform = appliance.dynamips.platform;
    iosTemplate.ram = appliance.dynamips.ram;
    iosTemplate.startup_config = appliance.dynamips.startup_config;
    iosTemplate.slot0 = appliance.dynamips.slot0;
    iosTemplate.slot1 = appliance.dynamips.slot1;
    iosTemplate.slot2 = appliance.dynamips.slot2;
    iosTemplate.slot3 = appliance.dynamips.slot3;
    iosTemplate.slot4 = appliance.dynamips.slot4;
    iosTemplate.slot5 = appliance.dynamips.slot5;
    iosTemplate.slot6 = appliance.dynamips.slot6;
    iosTemplate.slot7 = appliance.dynamips.slot7;
    iosTemplate.category = this.getCategory();
    iosTemplate.default_name_format = appliance.default_name_format;
    iosTemplate.symbol = appliance.symbol;
    iosTemplate.tags = appliance.tags || [];
    iosTemplate.compute_id = 'local';
    iosTemplate.template_id = uuid();
    iosTemplate.image = ios_image;
    iosTemplate.template_type = 'dynamips';
    iosTemplate.netmiko_device_type = appliance.netmiko_device_type || null;
    iosTemplate.appliance_metadata = buildApplianceMetadata(appliance);
    iosTemplate.name = name;
    return iosTemplate;
  }

  private buildDockerTemplate(name: string): DockerTemplate {
    const appliance = this.applianceToInstall();
    let dockerTemplate: DockerTemplate = new DockerTemplate();
    const docker = appliance.docker;
    dockerTemplate.adapters = docker.adapters;
    dockerTemplate.image = docker.image;
    dockerTemplate.console_type = docker.console_type;
    dockerTemplate.start_command = docker.start_command;
    dockerTemplate.environment = docker.environment;
    dockerTemplate.extra_hosts = docker.extra_hosts;
    dockerTemplate.extra_volumes = docker.extra_volumes || [];
    dockerTemplate.extra_configs = (docker.extra_configs || [])
      .filter((c) => (c.target || '').trim())
      .map((c) => ({ target: c.target.trim(), content: c.content ?? '' }));
    dockerTemplate.custom_adapters = appliance.custom_adapters || [];
    dockerTemplate.mac_address = docker.mac_address;
    dockerTemplate.cpus = docker.cpus;
    dockerTemplate.memory = docker.mem_limit;
    dockerTemplate.console_http_path = docker.console_http_path;
    dockerTemplate.console_http_port = docker.console_http_port;
    dockerTemplate.console_resolution = docker.console_resolution;
    dockerTemplate.template_type = 'docker';
    dockerTemplate.category = this.getCategory();
    dockerTemplate.default_name_format = appliance.default_name_format;
    dockerTemplate.symbol = appliance.symbol;
    dockerTemplate.tags = appliance.tags || [];
    dockerTemplate.usage = appliance.usage;
    dockerTemplate.netmiko_device_type = appliance.netmiko_device_type || null;
    dockerTemplate.appliance_metadata = buildApplianceMetadata(appliance);
    dockerTemplate.compute_id = 'local';
    dockerTemplate.template_id = uuid();
    dockerTemplate.name = name;
    return dockerTemplate;
  }

  findControllerImageName(image_name) {
    if (image_name) {
      const imageToInstall = this.applianceToInstall()?.images?.find((n) => n.filename === image_name);
      if (!imageToInstall) return image_name;
      const imageToUse = this.qemuImages().filter((n) => n.checksum === imageToInstall.md5sum);
      if (imageToUse.length > 0) {
        image_name = imageToUse[0].filename; // use the image name from the controller
      }
    }
    return image_name;
  }

  private buildQemuTemplate(version: Version, name: string): QemuTemplate {
    const appliance = this.applianceToInstall();
    // v8 appliances may override the default settings per version
    const versionProps = getVersionSettingProperties(appliance, version) || {};
    const qemuProps: any = { ...(appliance.qemu || {}), ...versionProps };

    let qemuTemplate: QemuTemplate = new QemuTemplate();
    qemuTemplate.ram = qemuProps.ram;
    qemuTemplate.adapters = qemuProps.adapters;
    qemuTemplate.adapter_type = qemuProps.adapter_type;
    qemuTemplate.boot_priority = qemuProps.boot_priority;
    qemuTemplate.console_type = qemuProps.console_type;
    qemuTemplate.hda_disk_interface = qemuProps.hda_disk_interface;
    qemuTemplate.hdb_disk_interface = qemuProps.hdb_disk_interface;
    qemuTemplate.hdc_disk_interface = qemuProps.hdc_disk_interface;
    qemuTemplate.hdd_disk_interface = qemuProps.hdd_disk_interface;
    qemuTemplate.category = version.category || this.getCategory();
    qemuTemplate.first_port_name = qemuProps.first_port_name ?? appliance.first_port_name;
    qemuTemplate.port_name_format = qemuProps.port_name_format ?? appliance.port_name_format;
    qemuTemplate.port_segment_size = qemuProps.port_segment_size ?? appliance.port_segment_size;
    qemuTemplate.default_name_format = appliance.default_name_format;
    qemuTemplate.symbol = version.symbol || appliance.symbol;
    qemuTemplate.tags = appliance.tags || [];
    qemuTemplate.compute_id = 'local';
    qemuTemplate.template_id = uuid();
    qemuTemplate.bios_image = this.findControllerImageName(version.images.bios_image);
    qemuTemplate.hda_disk_image = this.findControllerImageName(version.images.hda_disk_image);
    qemuTemplate.hdb_disk_image = this.findControllerImageName(version.images.hdb_disk_image);
    qemuTemplate.hdc_disk_image = this.findControllerImageName(version.images.hdc_disk_image);
    qemuTemplate.hdd_disk_image = this.findControllerImageName(version.images.hdd_disk_image);
    qemuTemplate.cdrom_image = this.findControllerImageName(version.images.cdrom_image);
    qemuTemplate.template_type = 'qemu';
    qemuTemplate.usage = version.usage || appliance.usage;
    // v8 template_properties carry `platform`; v1-v6 qemu blocks use `arch`
    qemuTemplate.platform = qemuProps.platform ?? qemuProps.arch;
    qemuTemplate.netmiko_device_type = qemuProps.netmiko_device_type || appliance.netmiko_device_type || null;
    qemuTemplate.appliance_metadata = buildApplianceMetadata(appliance, version);
    qemuTemplate.name = name;
    return qemuTemplate;
  }

  createTemplate() {
    const appliance = this.applianceToInstall();
    if (!appliance) {
      this.toasterService.error('Please select an appliance first');
      return;
    }
    // The submit button is disabled while the async duplicate-name check is
    // pending. Keep this guard focused on an actual invalid value so callers
    // that invoke this method directly do not get a transient false negative
    // while Angular is settling the control status.
    if (!this.templateNameControl || this.templateNameControl.invalid) {
      this.toasterService.error('Please enter correct name for new template');
      return;
    }

    const name = this.templateNameControl.value;
    this.isCreating.set(true);

    let request;
    if (appliance.qemu) {
      const version = this.selectedVersion();
      if (!version || !this.isVersionComplete(version)) {
        this.isCreating.set(false);
        this.toasterService.error('Please select a version with all required images');
        return;
      }
      request = this.qemuService.addTemplate(this.controller, this.buildQemuTemplate(version, name));
    } else if (appliance.dynamips) {
      const image = appliance.images.filter((n) => n.filename === this.selectedImage())[0];
      if (!image || !this.checkImageFromVersion(image.filename)) {
        this.isCreating.set(false);
        this.toasterService.error('Please select an image available on the controller');
        return;
      }
      request = this.iosService.addTemplate(this.controller, this.buildIosTemplate(image, name));
    } else if (appliance.iou) {
      const image = appliance.images.filter((n) => n.filename === this.selectedImage())[0];
      if (!image || !this.checkImageFromVersion(image.filename)) {
        this.isCreating.set(false);
        this.toasterService.error('Please select an image available on the controller');
        return;
      }
      request = this.iouService.addTemplate(this.controller, this.buildIouTemplate(image, name));
    } else {
      request = this.dockerService.addTemplate(this.controller, this.buildDockerTemplate(name));
    }

    request.subscribe({
      next: (template) => {
        this.templateService.newTemplateCreated.next(template as any as Template);
        this.toasterService.success('Template added');
        this.isCreating.set(false);
        this.goBack();
      },
      error: (err) => {
        const message = err.error?.message || err.message || 'Failed to add template';
        this.isCreating.set(false);
        this.toasterService.error(message);
        this.cd.markForCheck();
      },
    });
  }

  // ------------------------------------------------------------------
  // Review helpers
  // ------------------------------------------------------------------
  getSelectedVersionImageNames(): string {
    const version = this.selectedVersion();
    if (!version) return '';
    return this.getVersionImages(version)
      .map((image) => image.filename)
      .join(', ');
  }

  private computeChecksumMd5(
    file: File,
    encode = false,
    onProgress?: (percent: number) => void
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const chunkSize = 2097152;
      const spark = new SparkMD5.ArrayBuffer();
      const fileReader = new FileReader();
      let cursor = 0;

      if (file.size === 0) {
        resolve(spark.end(encode));
        return;
      }

      fileReader.onerror = function (): void {
        reject('MD5 computation failed - error reading the file');
      };

      function processChunk(chunkStart: number): void {
        const chunkEnd = Math.min(file.size, chunkStart + chunkSize);
        fileReader.readAsArrayBuffer(file.slice(chunkStart, chunkEnd));
      }

      fileReader.onload = function (e: any): void {
        spark.append(e.target.result);
        cursor += chunkSize;
        if (onProgress) {
          const pct = Math.min(100, Math.floor((Math.min(cursor, file.size) / file.size) * 100));
          onProgress(pct);
        }
        if (cursor < file.size) {
          processChunk(cursor);
        } else {
          resolve(spark.end(encode));
        }
      };

      processChunk(0);
    });
  }

  openSnackBar() {
    this.snackBar.openFromComponent(UploadingProcessbarComponent, {
      panelClass: 'uplaoding-file-snackabar',
      data: { upload_file_type: 'Image' },
    });
  }
}
