import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnInit, inject, model } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { Project } from '@models/project';
import { Controller } from '@models/controller';
import { ProjectService } from '@services/project.service';
import { ToasterService } from '@services/toaster.service';

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
  private toasterService = inject(ToasterService);
  private cd = inject(ChangeDetectorRef);

  @Input() controller: Controller;
  @Input() project: Project;
  readonly name = model('');

  ngOnInit() {
    this.name.set(this.project.name);
    this.cd.markForCheck();
  }

  onCloseClick() {
    this.dialogRef.close();
  }

  onSaveClick() {
    this.projectService.duplicate(this.controller, this.project.project_id, this.name()).subscribe({
      next: () => {
        this.dialogRef.close();
      },
      error: (err) => {
        const message = err.error?.message || err.message || 'Failed to duplicate project';
        this.toasterService.error(message);
        this.cd.markForCheck();
      },
    });
  }
}
