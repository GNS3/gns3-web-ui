import { Component, OnDestroy, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { UploadServiceService } from 'app/common/uploading-processbar/upload-service.service';
import { UploadingProcessbarComponent } from 'app/common/uploading-processbar/uploading-processbar.component';
import { FileItem, FileUploader, ParsedResponseHeaders } from 'ng2-file-upload';
import { Subscription } from 'rxjs';
import { v4 as uuid } from 'uuid';
import { Compute } from '../../../../models/compute';
import { IouImage } from '../../../../models/iou/iou-image';
import{ Controller } from '../../../../models/controller';
import { IouTemplate } from '../../../../models/templates/iou-template';
import { ComputeService } from '../../../../services/compute.service';
import { IouService } from '../../../../services/iou.service';
import { ControllerService } from '../../../../services/controller.service';
import { TemplateMocksService } from '../../../../services/template-mocks.service';
import { ToasterService } from '../../../../services/toaster.service';

@Component({
  selector: 'app-add-iou-template',
  templateUrl: './add-iou-template.component.html',
  styleUrls: ['./add-iou-template.component.scss', '../../preferences.component.scss'],
})
export class AddIouTemplateComponent implements OnInit, OnDestroy {
  controller:Controller ;
  iouTemplate: IouTemplate;
  isRemoteComputerChosen: boolean = false;
  newImageSelected: boolean = false;
  types: string[] = ['L2 image', 'L3 image'];
  selectedType: string;
  iouImages: IouImage[] = [];
  uploader: FileUploader;

  templateNameForm: UntypedFormGroup;
  imageForm: UntypedFormGroup;
  isLocalComputerChosen: boolean = true;
  uploadProgress: number = 0
  subscription: Subscription;

  constructor(
    private route: ActivatedRoute,
    private controllerService: ControllerService,
    private iouService: IouService,
    private toasterService: ToasterService,
    private router: Router,
    private formBuilder: UntypedFormBuilder,
    private templateMocksService: TemplateMocksService,
    private computeService: ComputeService,
    private uploadServiceService: UploadServiceService,
    private snackBar: MatSnackBar
  ) {
    this.iouTemplate = new IouTemplate();

    this.templateNameForm = this.formBuilder.group({
      templateName: new UntypedFormControl(null, Validators.required),
    });

    this.imageForm = this.formBuilder.group({
      imageName: new UntypedFormControl('', Validators.required),
    });
  }

  ngOnInit() {
    this.uploader = new FileUploader({});
    this.uploader.onAfterAddingFile = (file) => {
      file.withCredentials = false;
    };
    this.uploader.onErrorItem = (item: FileItem, response: string, status: number, headers: ParsedResponseHeaders) => {
      this.toasterService.error('An error occured: ' + response);
    };
    this.uploader.onProgressItem = (progress: any) => {
      this.uploadProgress = progress['progress'];
      this.uploadServiceService.processBarCount(this.uploadProgress)
    };

    this.uploader.onSuccessItem = (
      item: FileItem,
      response: string,
      status: number,
      headers: ParsedResponseHeaders
    ) => {
      this.getImages();
      this.toasterService.success('Image uploaded');
    };

    const controller_id = this.route.snapshot.paramMap.get('controller_id');
    this.controllerService.get(parseInt(controller_id, 10)).then((controller:Controller ) => {
      this.controller = controller;
      this.getImages();
      this.templateMocksService.getIouTemplate().subscribe((iouTemplate: IouTemplate) => {
        this.iouTemplate = iouTemplate;
      });
    });
   this.subscription =  this.uploadServiceService.currentCancelItemDetails.subscribe((isCancel) => {
      if (isCancel) {
        this.cancelUploading()
      }

    })

  }

  getImages() {
    this.iouService.getImages(this.controller).subscribe((images: IouImage[]) => {
      this.iouImages = images;
    });
  }

  setControllerType(controllerType: string) {
    if (controllerType === 'local') {
      this.isLocalComputerChosen = true;
    }
  }

  setDiskImage(value: string) {
    this.newImageSelected = value === 'newImage';
  }

  uploadImageFile(event): void {
    let name = event.target.files[0].name;
    this.imageForm.controls['imageName'].setValue(name);

    const url = this.iouService.getImagePath(this.controller, name);
    this.uploader.queue.forEach((elem) => (elem.url = url));

    const itemToUpload = this.uploader.queue[0];
    if ((itemToUpload as any).options) (itemToUpload as any).options.disableMultipart = true; ((itemToUpload as any).options.headers = [{ name: 'Authorization', value: 'Bearer ' + this.controller.authToken }])
    this.uploader.uploadItem(itemToUpload);
    this.snackBar.openFromComponent(UploadingProcessbarComponent, {
      panelClass: 'uplaoding-file-snackabar',
      data:{upload_file_type:'Image'}
    });

  }

  cancelUploading() {
    this.uploader.clearQueue();
    this.uploadServiceService.processBarCount(100)
    this.toasterService.warning('File upload cancelled');
    // this.uploadServiceService.cancelFileUploading(false)
    // window.location.reload()
  }



  goBack() {
    this.router.navigate(['/controller', this.controller.id, 'preferences', 'iou', 'templates']);
  }

  addTemplate() {
    if (
      !this.templateNameForm.invalid &&
      ((this.newImageSelected && !this.imageForm.invalid) || (!this.newImageSelected && this.iouTemplate.path))
    ) {
      this.iouTemplate.template_id = uuid();
      this.iouTemplate.name = this.templateNameForm.get('templateName').value;
      if (this.newImageSelected) this.iouTemplate.path = this.imageForm.get('imageName').value;
      this.iouTemplate.compute_id = 'local';

      if (this.selectedType === 'L2 image') {
        this.iouTemplate.ethernet_adapters = 4;
        this.iouTemplate.serial_adapters = 0;
      } else if (this.selectedType === 'L3 image') {
        this.iouTemplate.ethernet_adapters = 2;
        this.iouTemplate.serial_adapters = 2;
      }

      this.iouService.addTemplate(this.controller, this.iouTemplate).subscribe((template: IouTemplate) => {
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
