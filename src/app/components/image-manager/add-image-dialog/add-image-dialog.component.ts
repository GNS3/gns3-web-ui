import { Component, Inject, OnInit } from '@angular/core';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Server } from '../../../models/server';
import { ImageManagerService } from '../../../services/image-manager.service';
import { Observable } from 'rxjs';

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
  server: Server;
  uploadedFile: boolean = false;
  uploadProgress: number = 0;
  selectFile: any = [];



  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    public dialogRef: MatDialogRef<AddImageDialogComponent>,
    private imageService: ImageManagerService,

  ) { }

  public ngOnInit(): void {
    this.server = this.data
  }

  async uploadImageFile(event) {
    for (let imgFile of event.target.files) {
      this.selectFile.push(imgFile)
    }

    await this.upload().subscribe((_) => {
      console.log(_)
      this.dialogRef.close('file uploaded');
    })
  }

  // files uploading 
  upload() {
    return new Observable<any>(observe => {
      this.selectFile.forEach((img, i) => {
        let resCount = 1
        try {
          resCount = resCount + i
          this.uploadedFile = true;
          this.imageService.uploadedImage(this.server, img.name, img)
            .subscribe(() => {
              this.selectFile.length == resCount ? observe.next() : ''
            }, (error) => {
              observe.error(error)
            })
        } catch (error) {
        }
      })
    })
  }
}
