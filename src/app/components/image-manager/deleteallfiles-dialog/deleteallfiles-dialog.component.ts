import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ImageManagerService } from '@services/image-manager.service';
import { ToasterService } from '@services/toaster.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-deleteallfiles-dialog',
  templateUrl: './deleteallfiles-dialog.component.html',
  styleUrls: ['./deleteallfiles-dialog.component.scss']
})
export class DeleteallfilesDialogComponent implements OnInit {
  isDelete: boolean = false;
  constructor(
    @Inject(MAT_DIALOG_DATA) public deleteData: any,
    public dialogRef: MatDialogRef<DeleteallfilesDialogComponent>,
    private imageService: ImageManagerService,
    private toasterService: ToasterService
  ) { }

  ngOnInit(): void {
  }

  async deleteAll() {
    this.isDelete = true
    await this.delete().subscribe((_) => {
      this.dialogRef.close(true);
      this.isDelete = false
    })
  }
  delete() {
    return new Observable<any>(observe => {
      this.deleteData.deleteFilesPaths.forEach((_, i) => {
        let imgDeleteCount = 1
        try {
          imgDeleteCount = imgDeleteCount + i
          this.imageService.deleteImage(this.deleteData.server, _.filename).subscribe(
            () => {
              this.deleteData.deleteFilesPaths.length === imgDeleteCount ? observe.next() : ''
            },
            (error) => {
              this.toasterService.error(error)
            }
          );
        } catch (error) {
          this.toasterService.error(error)
        }
      })
    })
  }


}
