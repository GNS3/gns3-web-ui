import { animate, state, style, transition, trigger } from '@angular/animations';
import { Component, DoCheck, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { UploadServiceService } from 'app/common/uploading-processbar/upload-service.service';
import { UploadingProcessbarComponent } from 'app/common/uploading-processbar/uploading-processbar.component';
import { forkJoin, Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ImageData } from '../../../models/images';
import { Server } from '../../../models/server';
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
export class AddImageDialogComponent implements OnInit, DoCheck {
  server: Server;
  uploadedFile: boolean = false;
  isExistImage: boolean = false;
  isInstallAppliance: boolean = false;
  install_appliance: boolean = false;
  selectFile: any = [];
  uploadFileMessage: ImageData = [];
  uploadProgress: number = 0;
  cancelRequsts: any;
  forkObservable: Observable<any>[] = [];
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    public dialogRef: MatDialogRef<AddImageDialogComponent>,
    private imageService: ImageManagerService,
    public snackBar: MatSnackBar,
    private uploadServiceService: UploadServiceService,
    private toasterService: ToasterService
  ) {}

  public ngOnInit(): void {
    this.server = this.data;
    this.uploadServiceService.currentCancelItemDetails.subscribe((isCancel) => {
      if (isCancel) {
        this.cancelUploading();
      }
    });
  }

  selectInstallApplianceOption(ev) {
    this.install_appliance = ev.value;
  }

  async uploadImageFile(event) {
    for (let imgFile of event.target.files) {
      this.selectFile.push(imgFile);
    }
    await this.upload();
  }

  // files uploading
  upload() {
    this.uploadedFile = true;
    this.snackBar.openFromComponent(UploadingProcessbarComponent, {
      panelClass: 'uplaoding-file-snackabar',
    });
    this.selectFile.forEach((imgElement) => {
      const object = this.imageService
        .uploadedImage(this.server, this.install_appliance, imgElement.name, imgElement)
        .pipe(catchError((error) => of(error)));
      this.forkObservable.push(object);
    });
    
    this.uploadProgress = this.forkObservable.length;
    this.cancelRequsts = forkJoin(this.forkObservable).subscribe((responses) => {
      this.uploadFileMessage = responses;
      this.uploadServiceService.processBarCount(100);
      this.uploadedFile = false;
      this.isExistImage = true;
    });
  }

  ngDoCheck() {
    setTimeout(() => {
      if (this.uploadProgress < 100 - this.forkObservable.length) {
        this.uploadProgress = this.uploadProgress + 1;
        this.uploadServiceService.processBarCount(this.uploadProgress);
      }
    }, this.forkObservable.length * 10000);
  }
  cancelUploading() {
    this.cancelRequsts.unsubscribe();
    this.dialogRef.close();
    this.uploadServiceService.processBarCount(100);
    this.toasterService.warning('Image upload cancelled');
    this.uploadServiceService.cancelFileUploading(false);
  }
}
