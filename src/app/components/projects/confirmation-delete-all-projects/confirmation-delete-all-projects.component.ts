import { Component, Inject, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ProjectService } from '@services/project.service';
import { ToasterService } from '@services/toaster.service';
import { Observable, of, forkJoin } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Component({
  standalone: true,
  selector: 'app-confirmation-delete-all-projects',
  templateUrl: './confirmation-delete-all-projects.component.html',
  styleUrls: ['./confirmation-delete-all-projects.component.scss'],
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatProgressSpinnerModule],
})
export class ConfirmationDeleteAllProjectsComponent implements OnInit {
  public dialogRef = inject(MatDialogRef<ConfirmationDeleteAllProjectsComponent>);
  private projectService = inject(ProjectService);
  private toasterService = inject(ToasterService);

  isDelete: boolean = false;
  isUsedFiles: boolean = false;
  deleteFliesDetails: any = []
  fileNotDeleted: any = []

  constructor(@Inject(MAT_DIALOG_DATA) public deleteData: any) {}

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
    forkJoin(calls).subscribe(responses => {
      this.deleteFliesDetails = responses.filter(x => x !== null)
      this.fileNotDeleted = responses.filter(x => x === null)
      this.isUsedFiles = true;
      this.isDelete = true
    });

  }

}
