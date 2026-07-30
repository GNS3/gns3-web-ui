import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
  OnDestroy,
  model,
  signal,
  inject,
  computed,
} from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatRadioModule } from '@angular/material/radio';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatStepperModule } from '@angular/material/stepper';
import { UploadServiceService } from '../../../../common/uploading-processbar/upload-service.service';
import { UploadingProcessbarComponent } from 'app/common/uploading-processbar/uploading-processbar.component';
import { FileItem, FileUploader, ParsedResponseHeaders, FileUploadModule } from 'ng2-file-upload';
import { Subscription } from 'rxjs';
import { v4 as uuid } from 'uuid';
import { QemuImage } from '@models/qemu/qemu-image';
import { Controller } from '@models/controller';
import { QemuTemplate } from '@models/templates/qemu-template';
import { QemuConfigurationService } from '@services/qemu-configuration.service';
import { QemuService } from '@services/qemu.service';
import { ControllerService } from '@services/controller.service';
import { TemplateMocksService } from '@services/template-mocks.service';
import { ToasterService } from '@services/toaster.service';

@Component({
  selector: 'app-add-qemu-virtual-machine-template',
  templateUrl: './add-qemu-vm-template.component.html',
  styleUrls: ['./add-qemu-vm-template.component.scss', '../../preferences.component.scss'],
  imports: [
    MatIconModule,
    MatButtonModule,
    MatRadioModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatAutocompleteModule,
    MatStepperModule,
    FileUploadModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddQemuVmTemplateComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private controllerService = inject(ControllerService);
  private qemuService = inject(QemuService);
  private toasterService = inject(ToasterService);
  private router = inject(Router);
  private templateMocksService = inject(TemplateMocksService);
  private configurationService = inject(QemuConfigurationService);
  private snackBar = inject(MatSnackBar);
  private uploadServiceService = inject(UploadServiceService);
  private cd = inject(ChangeDetectorRef);
  subscription: Subscription;

  readonly controller = signal<Controller | undefined>(undefined);
  readonly selectPlatform = signal<string[]>([]);
  readonly consoleTypes = signal<string[]>([]);
  readonly auxConsoleTypes = signal<string[]>([]);
  readonly newImageSelected = signal<boolean>(false);
  readonly qemuImages = signal<QemuImage[]>([]);
  readonly selectedImage = signal<QemuImage | undefined>(undefined);
  readonly filteredImages = signal<QemuImage[]>([]);
  readonly chosenImage = signal<string>('');
  readonly qemuTemplate = signal<QemuTemplate>(new QemuTemplate());
  readonly uploader = signal<FileUploader | undefined>(undefined);
  readonly isLocalComputerChosen = signal<boolean>(true);
  readonly selectedStepIndex = signal(0);

  // Form field signals
  templateName = model('');
  usage = model('');
  symbol = model('qemu_guest');
  ramMemory = model(256);
  fileName = model('');
  selectedPlatform = model('');
  consoleType = model('');
  auxConsoleType = model('');

  // Step completion computed signals
  nameStepCompleted = computed(() => !!this.templateName().trim());
  platformStepCompleted = computed(() => !!this.ramMemory() && !!this.selectedPlatform());
  consoleStepCompleted = computed(() => !!this.consoleType());
  auxConsoleStepCompleted = computed(() => !!this.auxConsoleType());
  diskStepCompleted = computed(() =>
    this.newImageSelected()
      ? !!this.chosenImage() && !!this.fileName().trim()
      : !!this.selectedImage()
  );
  canCreateTemplate = computed(
    () =>
      this.isLocalComputerChosen() &&
      !!this.templateName().trim() &&
      !!this.controller() &&
      this.ramMemory() > 0 &&
      !!this.selectedPlatform() &&
      !!this.consoleType() &&
      !!this.auxConsoleType() &&
      this.diskStepCompleted()
  );
  canAdvance = computed(() => {
    switch (this.selectedStepIndex()) {
      case 0:
        return this.isLocalComputerChosen();
      case 1:
        return this.nameStepCompleted();
      case 2:
        return this.platformStepCompleted();
      case 3:
        return this.consoleStepCompleted();
      case 4:
        return this.auxConsoleStepCompleted();
      case 5:
        return this.diskStepCompleted();
      default:
        return this.canCreateTemplate();
    }
  });

  readonly symbolOptions = [
    { value: 'qemu_guest', icon: 'desktop_windows', label: 'Computer' },
    { value: 'computer', icon: 'computer', label: 'PC' },
    { value: 'docker_guest', icon: 'deployed_code', label: 'Container' },
    { value: 'router', icon: 'router', label: 'Router' },
    { value: 'multilayer_switch', icon: 'hub', label: 'Switch' },
  ];

  ngOnInit() {
    this.uploader.set(new FileUploader({ url: '' }));

    this.uploader().onAfterAddingFile = (file) => {
      file.withCredentials = false;
    };
    this.uploader().onErrorItem = (
      item: FileItem,
      response: string,
      status: number,
      headers: ParsedResponseHeaders
    ) => {
      this.toasterService.error('An error occured: ' + response);
    };
    this.uploader().onSuccessItem = (
      item: FileItem,
      response: string,
      status: number,
      headers: ParsedResponseHeaders
    ) => {
      this.qemuService.getImages(this.controller()).subscribe((qemuImages: QemuImage[]) => {
        this.qemuImages.set(qemuImages);
        this.filteredImages.set(qemuImages);
      });
      this.toasterService.success('Image uploaded');
    };

    this.uploader().onProgressItem = (progress: any) => {
      this.uploadServiceService.processBarCount(progress['progress']);
    };

    const controller_id = this.route.snapshot.paramMap.get('controller_id');
    this.controllerService.get(parseInt(controller_id, 10)).then(
      (ctrl: Controller) => {
        this.controller.set(ctrl);

        this.templateMocksService.getQemuTemplate().subscribe({
          next: (qemuTemplate: QemuTemplate) => {
            this.qemuTemplate.set(qemuTemplate);
            this.usage.set(qemuTemplate.usage || '');
            this.symbol.set(qemuTemplate.symbol || 'qemu_guest');
          },
          error: () => {
            this.toasterService.error('Failed to load QEMU template');
            this.cd.markForCheck();
          },
        });

        this.qemuService.getImages(this.controller()).subscribe({
          next: (qemuImages: QemuImage[]) => {
            this.qemuImages.set(qemuImages);
            this.filteredImages.set(qemuImages);
          },
          error: (err) => {
            const message = err.error?.message || err.message || 'Failed to load QEMU images';
            this.toasterService.error(message);
            this.cd.markForCheck();
          },
        });

        this.selectPlatform.set(this.configurationService.getPlatform());
        this.selectedPlatform.set(this.selectPlatform()[0]);
        this.consoleTypes.set(this.configurationService.getConsoleTypes());
        this.auxConsoleTypes.set(this.configurationService.getAuxConsoleTypes());
      },
      (err) => {
        const message = err.error?.message || err.message || 'Failed to load controller';
        this.toasterService.error(message);
        this.cd.markForCheck();
      }
    );

    this.subscription = this.uploadServiceService.currentCancelItemDetails.subscribe((isCancel) => {
      if (isCancel) {
        this.cancelUploading();
      }
    });
  }

  setControllerType(controllerType: string) {
    if (controllerType === 'local') {
      this.isLocalComputerChosen.set(true);
    }
  }

  setDiskImage(value: string) {
    this.newImageSelected.set(value === 'newImage');
    if (value === 'newImage') {
      this.selectedImage.set(undefined);
    }
  }

  filterImages(event: Event): QemuImage[] {
    const filterValue = (event.target as HTMLInputElement).value.toLowerCase();
    return this.qemuImages().filter((image) => image.filename.toLowerCase().includes(filterValue));
  }

  onDiskImageInput(event: Event) {
    this.filteredImages.set(this.filterImages(event));
    // Typing free text invalidates any previously picked image so we never
    // save a stale path. A valid selection is only restored via onDiskImageSelected.
    this.selectedImage.set(undefined);
  }

  onDiskImageSelected(filename: string) {
    const image = this.qemuImages().find((img) => img.filename === filename);
    this.selectedImage.set(image);
  }

  uploadImageFile(event) {
    let name = event.target.files[0].name;
    this.fileName.set(name);
    this.chosenImage.set(name);

    const url = this.qemuService.getImagePath(this.controller(), name);
    this.uploader().queue.forEach((elem) => (elem.url = url));

    const itemToUpload = this.uploader().queue[0];

    if ((itemToUpload as any).options) (itemToUpload as any).options.disableMultipart = true;
    (itemToUpload as any).options.headers = [{ name: 'Authorization', value: 'Bearer ' + this.controller().authToken }];
    this.uploader().uploadItem(itemToUpload);
    this.snackBar.openFromComponent(UploadingProcessbarComponent, {
      panelClass: 'uplaoding-file-snackabar',
      data: { upload_file_type: 'Image' },
    });
  }

  cancelUploading() {
    this.uploader().clearQueue();
    this.uploadServiceService.processBarCount(null);
    this.toasterService.warning('Image Uploading canceled');
    this.uploadServiceService.cancelFileUploading(false);
  }

  goBack() {
    const controllerId = this.controller()?.id ?? parseInt(this.route.snapshot.paramMap.get('controller_id'), 10);
    this.router.navigate(['/controller', controllerId, 'preferences']);
  }

  addTemplate() {
    if (this.canCreateTemplate()) {
      const template = this.qemuTemplate();
      template.ram = this.ramMemory();
      template.platform = this.selectedPlatform();
      if (this.newImageSelected()) {
        template.hda_disk_image = this.fileName();
      } else {
        template.hda_disk_image = this.selectedImage().path;
      }
      template.template_id = uuid();
      template.name = this.templateName();
      template.usage = this.usage();
      template.symbol = this.symbol();
      template.compute_id = 'local';
      template.console_type = this.consoleType();
      template.aux_type = this.auxConsoleType();

      this.qemuService.addTemplate(this.controller(), template).subscribe({
        next: () => {
          this.goBack();
        },
        error: (err) => {
          const message = err.error?.message || err.message || 'Failed to add qemu template';
          this.toasterService.error(message);
          this.cd.markForCheck();
        },
      });
    } else {
      this.toasterService.error(`Fill all required fields`);
    }
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }
}
