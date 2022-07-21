import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ImageManagerService } from '../../../services/image-manager.service';
import { ToasterService } from '../../../services/toaster.service';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ImageData } from '../../../models/images';

@Component({
  selector: 'app-deleteallfiles-dialog',
  templateUrl: './deleteallfiles-dialog.component.html',
  styleUrls: ['./deleteallfiles-dialog.component.scss']
})
export class DeleteAllImageFilesDialogComponent implements OnInit {
  isDelete: boolean = false;
  isUsedFiles: boolean = false;
  deleteFliesDetails: ImageData = []
  fileNotDeleted: ImageData = []

  constructor(
    @Inject(MAT_DIALOG_DATA) public deleteData: any,
    public dialogRef: MatDialogRef<DeleteAllImageFilesDialogComponent>,
    private imageService: ImageManagerService,
    private toasterService: ToasterService
  ) { }

  ngOnInit(): void {
  }

  async deleteAll() {
    this.isDelete = true
    await this.deleteFile()
  }

  deleteFile() {
    const calls = [];
    this.deleteData.deleteFilesPaths.forEach(pathElement => {
      calls.push(this.imageService.deleteFile(this.deleteData.controller, pathElement.filename).pipe(catchError(error => of(error))))
    });
    Observable.forkJoin(calls).subscribe(responses => {
      this.deleteFliesDetails = responses.filter(x => x !== null)
      this.fileNotDeleted = responses.filter(x => x === null)
      this.isUsedFiles = true;
      this.isDelete = true
    });

  }


}
