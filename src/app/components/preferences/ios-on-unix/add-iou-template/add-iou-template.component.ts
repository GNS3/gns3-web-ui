import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  model,
  signal,
  inject,
  computed,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatRadioModule } from '@angular/material/radio';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatStepperModule } from '@angular/material/stepper';
import { MatSnackBar } from '@angular/material/snack-bar';
import { UploadServiceService } from 'app/common/uploading-processbar/upload-service.service';
import { UploadingProcessbarComponent } from 'app/common/uploading-processbar/uploading-processbar.component';
import { FileItem, FileUploader, ParsedResponseHeaders, FileUploadModule } from 'ng2-file-upload';
import { Subscription } from 'rxjs';
import { v4 as uuid } from 'uuid';
import { IouImage } from '@models/iou/iou-image';
import { Controller } from '@models/controller';
import { IouTemplate } from '@models/templates/iou-template';
import { IouService } from '@services/iou.service';
import { ControllerService } from '@services/controller.service';
import { TemplateMocksService } from '@services/template-mocks.service';
import { ToasterService } from '@services/toaster.service';
import { TemplateInfoFieldsComponent } from '../../common/template-info-fields/template-info-fields.component';

@Component({
  selector: 'app-add-iou-template',
  templateUrl: './add-iou-template.component.html',
  styleUrls: ['./add-iou-template.component.scss', '../../preferences.component.scss'],
  imports: [
    MatIconModule,
    MatButtonModule,
    MatRadioModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatStepperModule,
    FileUploadModule,
    TemplateInfoFieldsComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddIouTemplateComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private controllerService = inject(ControllerService);
  private iouService = inject(IouService);
  private toasterService = inject(ToasterService);
  private router = inject(Router);
  private templateMocksService = inject(TemplateMocksService);
  private uploadServiceService = inject(UploadServiceService);
  private snackBar = inject(MatSnackBar);
  private cd = inject(ChangeDetectorRef);

  readonly controller = signal<Controller | undefined>(undefined);
  readonly iouTemplate = signal<IouTemplate>(new IouTemplate());
  readonly newImageSelected = signal<boolean>(false);
  readonly types = signal<string[]>(['L2 image', 'L3 image']);
  readonly iouImages = signal<IouImage[]>([]);
  readonly uploader = signal<FileUploader | undefined>(undefined);
  readonly isLocalComputerChosen = signal<boolean>(true);
  readonly selectedStepIndex = signal(0);
  subscription: Subscription;

  // Form field signals
  templateName = model('');
  imageName = model('');
  selectedType = model('');
  usage = model('');
  symbol = model('multilayer_switch');

  // Step completion computed signals
  nameStepCompleted = computed(() => !!this.templateName());
  imageStepCompleted = computed(() => (this.newImageSelected() ? !!this.imageName() : !!this.iouTemplate().path));

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
    this.uploader().onProgressItem = (progress: any) => {
      this.uploadServiceService.processBarCount(progress['progress']);
    };

    this.uploader().onSuccessItem = (
      item: FileItem,
      response: string,
      status: number,
      headers: ParsedResponseHeaders
    ) => {
      this.getImages();
      this.toasterService.success('Image uploaded');
    };

    const controller_id = this.route.snapshot.paramMap.get('controller_id');
    this.controllerService.get(parseInt(controller_id, 10)).then(
      (ctrl: Controller) => {
        this.controller.set(ctrl);
        this.getImages();
        this.templateMocksService.getIouTemplate().subscribe({
          next: (iouTemplate: IouTemplate) => {
            this.iouTemplate.set(iouTemplate);
          },
          error: () => {
            this.toasterService.error('Failed to load IOU template');
            this.cd.markForCheck();
          },
        });
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

  getImages() {
    this.iouService.getImages(this.controller()).subscribe({
      next: (images: IouImage[]) => {
        this.iouImages.set(images);
      },
      error: (err) => {
        const message = err.error?.message || err.message || 'Failed to load IOU images';
        this.toasterService.error(message);
        this.cd.markForCheck();
      },
    });
  }

  setControllerType(controllerType: string) {
    if (controllerType === 'local') {
      this.isLocalComputerChosen.set(true);
    }
  }

  setDiskImage(value: string) {
    this.newImageSelected.set(value === 'newImage');
  }

  canAdvance(): boolean {
    return this.selectedStepIndex() === 0 ? this.isLocalComputerChosen() : this.nameStepCompleted();
  }

  canCreateTemplate(): boolean {
    return !!this.controller() && this.nameStepCompleted() && this.imageStepCompleted();
  }

  uploadImageFile(event): void {
    let name = event.target.files[0].name;
    this.imageName.set(name);

    const url = this.iouService.getImagePath(this.controller(), name);
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
    this.uploadServiceService.processBarCount(100);
    this.toasterService.warning('File upload cancelled');
  }

  goBack() {
    const controllerId = this.controller()?.id ?? parseInt(this.route.snapshot.paramMap.get('controller_id'), 10);
    this.router.navigate(['/controller', controllerId, 'preferences']);
  }

  addTemplate() {
    if (this.canCreateTemplate()) {
      const template = this.iouTemplate();
      template.template_id = uuid();
      template.name = this.templateName();
      template.usage = this.usage();
      template.symbol = this.symbol();
      if (this.newImageSelected()) template.path = this.imageName();
      template.compute_id = 'local';

      if (this.selectedType() === 'L2 image') {
        template.ethernet_adapters = 4;
        template.serial_adapters = 0;
      } else if (this.selectedType() === 'L3 image') {
        template.ethernet_adapters = 2;
        template.serial_adapters = 2;
      }

      this.iouService.addTemplate(this.controller(), template).subscribe({
        next: () => {
          this.goBack();
        },
        error: (err) => {
          const message = err.error?.message || err.message || 'Failed to add iou template';
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
