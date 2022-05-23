import { Component, DoCheck, Inject, OnInit } from '@angular/core';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Server } from '../../../models/server';
import { ImageManagerService } from '../../../services/image-manager.service';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ImageData } from '../../../models/images';

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

export class AddImageDialogComponent implements OnInit,DoCheck {
  server: Server;
  uploadedFile: boolean = false;
  isExistImage: boolean = false;
  isInstallAppliance: boolean = false
  install_appliance: boolean = false
  selectFile: any = [];
  uploadFileMessage: ImageData = []
  uploadProgress:number = 0
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    public dialogRef: MatDialogRef<AddImageDialogComponent>,
    private imageService: ImageManagerService,

  ) { }

  public ngOnInit(): void {
    this.server = this.data
  }

  selectInstallApplianceOption(ev) {
    this.install_appliance = ev.value
  }

  async uploadImageFile(event) {
    for (let imgFile of event.target.files) {
      this.selectFile.push(imgFile)
    }
    await this.upload()
  }

  // files uploading 
  upload() {
    const calls = [];
    this.uploadedFile = true;
    this.selectFile.forEach(imgElement => {
      calls.push(this.imageService.uploadedImage(this.server, this.install_appliance, imgElement.name, imgElement).pipe(catchError(error => of(error))))
    });
    this.uploadProgress = calls.length
    Observable.forkJoin(calls).subscribe(responses => {
      this.uploadFileMessage = responses
      this.uploadedFile = false;
      this.isExistImage = true;
    });
  }
  ngDoCheck(){
    setTimeout(() => {
      if(this.uploadProgress < 95){
        this.uploadProgress = this.uploadProgress + 1
      }
    }, 100000);
   
  }
}
