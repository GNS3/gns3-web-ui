import { animate, state, style, transition, trigger } from '@angular/animations';
import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { UploadServiceService } from 'app/common/uploading-processbar/upload-service.service';
import { FileItem, FileUploader, ParsedResponseHeaders } from 'ng2-file-upload';
import{ Controller } from '../../../models/controller';
import { ImageManagerService } from '../../../services/image-manager.service';
import { ToasterService } from '../../../services/toaster.service';

@Component({
  selector: 'app-add-image-dialog',
  templateUrl: './add-image-dialog.component.html',
  styleUrls: ['./add-image-dialog.component.scss'],
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({ height: '0px', minHeight: '0', visibility: 'hidden' })),
      state('expanded', style({ height: '*', visibility: 'visible' })),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ],
})
export class AddImageDialogComponent implements OnInit {
  controller:Controller ;
  isInstallAppliance: boolean = false;
  install_appliance: boolean = false;
  selectFile: any = [];
  uploaderImage: FileUploader;
  uploadProgress: number = 0;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    public dialogRef: MatDialogRef<AddImageDialogComponent>,
    private imageService: ImageManagerService,
    private toasterService: ToasterService,
    private uploadServiceService: UploadServiceService
  ) {}

  public ngOnInit() {
    this.controller = this.data;

    this.uploaderImage = new FileUploader({url: ''});
    this.uploaderImage.onAfterAddingFile = (file) => {
      file.withCredentials = false;
    };

    this.uploaderImage.onErrorItem = (
      item: FileItem,
      response: string,
      status: number,
      headers: ParsedResponseHeaders
    ) => {
      let responseData = {
        name: item.file.name,
        message: JSON.parse(response),
      };
      this.toasterService.error(responseData?.message.message);
    };

    this.uploaderImage.onSuccessItem = (
      item: FileItem,
      response: string,
      status: number,
      headers: ParsedResponseHeaders
    ) => {
      let responseData = {
        filename: item.file.name,
        message: JSON.parse(response),
      };
      this.toasterService.success('Image ' + responseData?.message.filename + ' imported succesfully' );
    };
    this.uploaderImage.onProgressItem = (progress: any) => {
      this.uploadProgress = progress;
    };
  }

  cancelUploading() {
    this.uploaderImage.clearQueue();
    this.dialogRef.close();
    this.uploadServiceService.processBarCount(null);
    this.toasterService.warning('Image file Uploading canceled');
  }

  selectInstallApplianceOption(ev) {
    this.install_appliance = ev.value;
  }

  async uploadImageFile(event) {
    for (let imgFile of event) {
      this.selectFile.push(imgFile);
    }
    await this.importImageFile();
  }

  // files uploading
  importImageFile() {
    this.selectFile.forEach((event, i) => {
      let fileName = event.name;
      let file = event;
      let fileReader: FileReader = new FileReader();
      fileReader.onloadend = () => {
        const url = this.imageService.getImagePath(this.controller, this.install_appliance, fileName);
        const itemToUpload = this.uploaderImage.queue[i];
        itemToUpload.url = url;
        if ((itemToUpload as any).options) (itemToUpload as any).options.disableMultipart = true;
        (itemToUpload as any).options.headers = [{ name: 'Authorization', value: 'Bearer ' + this.controller.authToken }];
        this.uploaderImage.uploadItem(itemToUpload);
      };
      fileReader.readAsText(file);
    });
  }
}
