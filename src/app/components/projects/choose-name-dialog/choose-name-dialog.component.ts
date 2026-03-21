import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { Project } from '@models/project';
import { Controller } from '@models/controller';
import { ProjectService } from '@services/project.service';

@Component({
  standalone: true,
  selector: 'app-choose-name-dialog',
  templateUrl: './choose-name-dialog.component.html',
  styleUrls: ['./choose-name-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, MatDialogModule, MatButtonModule, MatInputModule, MatFormFieldModule],
})
export class ChooseNameDialogComponent implements OnInit {
  public dialogRef = inject(MatDialogRef<ChooseNameDialogComponent>);
  private projectService = inject(ProjectService);
  private cd = inject(ChangeDetectorRef);

  @Input() controller: Controller;
  @Input() project: Project;
  name: string;

  ngOnInit() {
    this.name = this.project.name;
    this.cd.markForCheck();
  }

  onCloseClick() {
    this.dialogRef.close();
  }

  onSaveClick() {
    this.projectService.duplicate(this.controller, this.project.project_id, this.name).subscribe(() => {
      this.dialogRef.close();
    });
  }
}
