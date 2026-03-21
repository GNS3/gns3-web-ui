import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatRadioModule } from '@angular/material/radio';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatStepperModule } from '@angular/material/stepper';
import { UploadServiceService } from '../../../../common/uploading-processbar/upload-service.service';
import { UploadingProcessbarComponent } from 'app/common/uploading-processbar/uploading-processbar.component';
import { FileItem, FileUploader, FileUploaderOptions, ParsedResponseHeaders, FileUploadModule } from 'ng2-file-upload';
import { Subscription } from 'rxjs';
import { v4 as uuid } from 'uuid';
import { Compute } from '@models/compute';
import { QemuBinary } from '@models/qemu/qemu-binary';
import { QemuImage } from '@models/qemu/qemu-image';
import { Controller } from '@models/controller';
import { QemuTemplate } from '@models/templates/qemu-template';
import { ComputeService } from '@services/compute.service';
import { QemuConfigurationService } from '@services/qemu-configuration.service';
import { QemuService } from '@services/qemu.service';
import { ControllerService } from '@services/controller.service';
import { TemplateMocksService } from '@services/template-mocks.service';
import { ToasterService } from '@services/toaster.service';

@Component({
  standalone: true,
  selector: 'app-add-qemu-virtual-machine-template',
  templateUrl: './add-qemu-vm-template.component.html',
  styleUrls: ['./add-qemu-vm-template.component.scss', '../../preferences.component.scss'],
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule, MatIconModule, MatButtonModule, MatCardModule, MatRadioModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatStepperModule, UploadingProcessbarComponent, FileUploadModule]
})
export class AddQemuVmTemplateComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private controllerService = inject(ControllerService);
  private qemuService = inject(QemuService);
  private toasterService = inject(ToasterService);
  private router = inject(Router);
  private formBuilder = inject(UntypedFormBuilder);
  private templateMocksService = inject(TemplateMocksService);
  private configurationService = inject(QemuConfigurationService);
  private computeService = inject(ComputeService);
  private snackBar = inject(MatSnackBar);
  private uploadServiceService = inject(UploadServiceService);
  subscription: Subscription;

  controller: Controller;
  selectPlatform: string[] = [];
  selectedPlatform: string;
  ramMemory: number;
  consoleTypes: string[] = [];
  auxConsoleTypes: string[] = [];
  newImageSelected: boolean = false;
  qemuImages: QemuImage[] = [];
  selectedImage: QemuImage;
  chosenImage: string = '';
  qemuTemplate: QemuTemplate;
  uploader: FileUploader;
  uploadedFile: boolean = false;
  uploadProgress: number = 0;

  nameForm: UntypedFormGroup;
  memoryForm: UntypedFormGroup;
  diskForm: UntypedFormGroup;
  isLocalComputerChosen: boolean = true;

  constructor() {
    this.qemuTemplate = new QemuTemplate();

    this.nameForm = this.formBuilder.group({
      templateName: new UntypedFormControl(null, Validators.required),
    });

    this.memoryForm = this.formBuilder.group({
      ramMemory: new UntypedFormControl('256', Validators.required),
    });

    this.diskForm = this.formBuilder.group({
      fileName: new UntypedFormControl('', Validators.required),
    });
  }

  ngOnInit() {
    this.uploader = new FileUploader({url: ''});

    this.uploader.onAfterAddingFile = (file) => {
      file.withCredentials = false;
    };
    this.uploader.onErrorItem = (item: FileItem, response: string, status: number, headers: ParsedResponseHeaders) => {
      this.toasterService.error('An error occured: ' + response);
    };
    this.uploader.onSuccessItem = (
      item: FileItem,
      response: string,
      status: number,
      headers: ParsedResponseHeaders
    ) => {
      this.qemuService.getImages(this.controller).subscribe((qemuImages: QemuImage[]) => {
        this.qemuImages = qemuImages;
      });
      this.toasterService.success('Image uploaded');
    };

    this.uploader.onProgressItem = (progress: any) => {
      this.uploadProgress = progress['progress'];
      this.uploadServiceService.processBarCount(this.uploadProgress)

    };

    const controller_id = this.route.snapshot.paramMap.get('controller_id');
    this.controllerService.get(parseInt(controller_id, 10)).then((controller: Controller ) => {
      this.controller = controller;

      this.templateMocksService.getQemuTemplate().subscribe((qemuTemplate: QemuTemplate) => {
        this.qemuTemplate = qemuTemplate;
      });

      this.qemuService.getImages(this.controller).subscribe((qemuImages: QemuImage[]) => {
        this.qemuImages = qemuImages;
      });

      this.selectPlatform = this.configurationService.getPlatform();
      this.selectedPlatform = this.selectPlatform[0];
      this.consoleTypes = this.configurationService.getConsoleTypes();
      this.auxConsoleTypes = this.configurationService.getAuxConsoleTypes();
    });

    this.subscription = this.uploadServiceService.currentCancelItemDetails.subscribe((isCancel) => {
      if (isCancel) {
        this.cancelUploading()
      }

    })


  }

  setControllerType(controllerType: string) {
    if (controllerType === 'local') {
      this.isLocalComputerChosen = true;
    }
  }

  setDiskImage(value: string) {
    this.newImageSelected = value === 'newImage';
  }

  uploadImageFile(event) {

    // this.uploadedFile = true;
    let name = event.target.files[0].name;
    this.diskForm.controls['fileName'].setValue(name);

    const url = this.qemuService.getImagePath(this.controller, name);
    this.uploader.queue.forEach((elem) => (elem.url = url));

    const itemToUpload = this.uploader.queue[0];

    if ((itemToUpload as any).options) (itemToUpload as any).options.disableMultipart = true; ((itemToUpload as any).options.headers =[{name:'Authorization',value:'Bearer ' + this.controller.authToken}])
    this.uploader.uploadItem(itemToUpload);
    this.snackBar.openFromComponent(UploadingProcessbarComponent,{panelClass: 'uplaoding-file-snackabar', data:{upload_file_type:'Image'}});
  }

  cancelUploading() {
    this.uploader.clearQueue();
    this.uploadServiceService.processBarCount(null)
    this.toasterService.warning('Image Uploading canceled');
    this.uploadServiceService.cancelFileUploading(false)

  }

  goBack() {
    this.router.navigate(['/controller', this.controller.id, 'preferences', 'qemu', 'templates']);
  }

  addTemplate() {
    if (!this.nameForm.invalid && !this.memoryForm.invalid && (this.selectedImage || this.chosenImage)) {
      this.qemuTemplate.ram = +this.memoryForm.get('ramMemory').value;
      this.qemuTemplate.platform = this.selectedPlatform;
      if (this.newImageSelected) {
        this.qemuTemplate.hda_disk_image = this.diskForm.get('fileName').value;
      } else {
        this.qemuTemplate.hda_disk_image = this.selectedImage.path;
      }
      this.qemuTemplate.template_id = uuid();
      this.qemuTemplate.name = this.nameForm.get('templateName').value;
      this.qemuTemplate.compute_id = 'local';

      this.qemuService.addTemplate(this.controller, this.qemuTemplate).subscribe((template: QemuTemplate) => {
        this.goBack();
      });
    } else {
      this.toasterService.error(`Fill all required fields`);
    }
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

}
