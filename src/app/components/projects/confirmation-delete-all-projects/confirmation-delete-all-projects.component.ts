import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ProjectService } from '@services/project.service';
import { ToasterService } from '@services/toaster.service';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Component({
  selector: 'app-confirmation-delete-all-projects',
  templateUrl: './confirmation-delete-all-projects.component.html',
  styleUrls: ['./confirmation-delete-all-projects.component.scss']
})
export class ConfirmationDeleteAllProjectsComponent implements OnInit {
  isDelete: boolean = false;
  isUsedFiles: boolean = false;
  deleteFliesDetails: any = []
  fileNotDeleted: any = []

  constructor(
    @Inject(MAT_DIALOG_DATA) public deleteData: any,
    public dialogRef: MatDialogRef<ConfirmationDeleteAllProjectsComponent>,
    private projectService: ProjectService,
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
    this.deleteData.deleteFilesPaths.forEach(project => {
      calls.push(this.projectService.delete(this.deleteData.controller, project.project_id).pipe(catchError(error => of(error))))
    });
    Observable.forkJoin(calls).subscribe(responses => {
      this.deleteFliesDetails = responses.filter(x => x !== null)
      this.fileNotDeleted = responses.filter(x => x === null)
      this.isUsedFiles = true;
      this.isDelete = true
    });

  }

}
