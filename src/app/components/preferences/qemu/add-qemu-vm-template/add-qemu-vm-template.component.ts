import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { UploadServiceService } from '../../../../common/uploading-processbar/upload-service.service';
import { UploadingProcessbarComponent } from 'app/common/uploading-processbar/uploading-processbar.component';
import { FileItem, FileUploader, FileUploaderOptions, ParsedResponseHeaders } from 'ng2-file-upload';
import { v4 as uuid } from 'uuid';
import { Compute } from '../../../../models/compute';
import { QemuBinary } from '../../../../models/qemu/qemu-binary';
import { QemuImage } from '../../../../models/qemu/qemu-image';
import { Server } from '../../../../models/server';
import { QemuTemplate } from '../../../../models/templates/qemu-template';
import { ComputeService } from '../../../../services/compute.service';
import { QemuConfigurationService } from '../../../../services/qemu-configuration.service';
import { QemuService } from '../../../../services/qemu.service';
import { ServerService } from '../../../../services/server.service';
import { TemplateMocksService } from '../../../../services/template-mocks.service';
import { ToasterService } from '../../../../services/toaster.service';

@Component({
  selector: 'app-add-qemu-virtual-machine-template',
  templateUrl: './add-qemu-vm-template.component.html',
  styleUrls: ['./add-qemu-vm-template.component.scss', '../../preferences.component.scss'],
})
export class AddQemuVmTemplateComponent implements OnInit {
  server: Server;
  qemuBinaries: QemuBinary[] = [];
  selectPlatform: string[] = [];
  selectedPlatform: string;
  selectedBinary: QemuBinary;
  ramMemory: number;
  consoleTypes: string[] = [];
  newImageSelected: boolean = false;
  qemuImages: QemuImage[] = [];
  selectedImage: QemuImage;
  chosenImage: string = '';
  qemuTemplate: QemuTemplate;
  uploader: FileUploader;
  uploadedFile: boolean = false;
  uploadProgress: number = 0;

  nameForm: FormGroup;
  memoryForm: FormGroup;
  diskForm: FormGroup;
  isLocalComputerChosen: boolean = true;

  constructor(
    private route: ActivatedRoute,
    private serverService: ServerService,
    private qemuService: QemuService,
    private toasterService: ToasterService,
    private router: Router,
    private formBuilder: FormBuilder,
    private templateMocksService: TemplateMocksService,
    private configurationService: QemuConfigurationService,
    private computeService: ComputeService,
    private snackBar : MatSnackBar,
    private uploadServiceService  : UploadServiceService
  ) {
    this.qemuTemplate = new QemuTemplate();

    this.nameForm = this.formBuilder.group({
      templateName: new FormControl(null, Validators.required),
    });

    this.memoryForm = this.formBuilder.group({
      ramMemory: new FormControl('256', Validators.required),
    });

    this.diskForm = this.formBuilder.group({
      fileName: new FormControl('', Validators.required),
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
    this.uploader.onSuccessItem = (
      item: FileItem,
      response: string,
      status: number,
      headers: ParsedResponseHeaders
    ) => {
      this.qemuService.getImages(this.server).subscribe((qemuImages: QemuImage[]) => {
        this.qemuImages = qemuImages;
      });
      this.toasterService.success('Image uploaded');
    };

    this.uploader.onProgressItem = (progress: any) => {
      this.uploadProgress = progress['progress'];
      this.uploadServiceService.processBarCount(this.uploadProgress)

    };

    const server_id = this.route.snapshot.paramMap.get('server_id');
    this.serverService.get(parseInt(server_id, 10)).then((server: Server) => {
      this.server = server;

      this.templateMocksService.getQemuTemplate().subscribe((qemuTemplate: QemuTemplate) => {
        this.qemuTemplate = qemuTemplate;
      });


      this.qemuService.getBinaries(this.server).subscribe((qemuBinaries: QemuBinary[]) => {
        this.qemuBinaries = qemuBinaries;
        if (this.qemuBinaries[0]) this.selectedBinary = this.qemuBinaries[0];
      });

      this.qemuService.getImages(this.server).subscribe((qemuImages: QemuImage[]) => {
        this.qemuImages = qemuImages;
      });

      this.selectPlatform = this.configurationService.getPlatform();
      this.selectedPlatform = this.selectPlatform[0];

      this.consoleTypes = this.configurationService.getConsoleTypes();
    });

    this.uploadServiceService.currentCancelItemDetails.subscribe((isCancel) => {
      if (isCancel) {
        this.cancelUploading()
      }

    })


  }

  setServerType(serverType: string) {
    if (serverType === 'local') {
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

    const url = this.qemuService.getImagePath(this.server, name);
    this.uploader.queue.forEach((elem) => (elem.url = url));
  
    const itemToUpload = this.uploader.queue[0];
    
    if ((itemToUpload as any).options) (itemToUpload as any).options.disableMultipart = true; ((itemToUpload as any).options.headers =[{name:'Authorization',value:'Bearer ' + this.server.authToken}]) 
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
    this.router.navigate(['/server', this.server.id, 'preferences', 'qemu', 'templates']);
  }

  addTemplate() {
    if (!this.nameForm.invalid && !this.memoryForm.invalid && (this.selectedImage || this.chosenImage)) {
      this.qemuTemplate.ram = +this.memoryForm.get('ramMemory').value;
      this.qemuTemplate.qemu_path = this.selectedBinary.path;
      this.qemuTemplate.platform = this.selectedPlatform;

      if (this.newImageSelected) {
        this.qemuTemplate.hda_disk_image = this.diskForm.get('fileName').value;
      } else {
        this.qemuTemplate.hda_disk_image = this.selectedImage.path;
      }
      this.qemuTemplate.template_id = uuid();
      this.qemuTemplate.name = this.nameForm.get('templateName').value;
      this.qemuTemplate.compute_id = 'local';

      this.qemuService.addTemplate(this.server, this.qemuTemplate).subscribe((template: QemuTemplate) => {
        this.goBack();
      });
    } else {
      this.toasterService.error(`Fill all required fields`);
    }
  }
  

}
