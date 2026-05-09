import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  viewChild,
  model,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTabsModule } from '@angular/material/tabs';
import { Project, ProjectVariable } from '@models/project';
import { Controller } from '@models/controller';
import { ProjectService } from '@services/project.service';
import { ToasterService } from '@services/toaster.service';
import { ReadmeEditorComponent } from './readme-editor/readme-editor.component';
import { DeleteConfirmationDialogComponent } from '../../preferences/common/delete-confirmation-dialog/delete-confirmation-dialog.component';

@Component({
  standalone: true,
  selector: 'app-edit-project-dialog',
  templateUrl: './edit-project-dialog.component.html',
  styleUrls: ['./edit-project-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatCheckboxModule,
    MatTableModule,
    MatIconModule,
    MatTooltipModule,
    MatTabsModule,
    ReadmeEditorComponent,
  ],
})
export class EditProjectDialogComponent implements OnInit {
  readonly editor = viewChild<ReadmeEditorComponent>('editor');

  private dialogRef = inject(MatDialogRef<EditProjectDialogComponent>);
  private dialog = inject(MatDialog);
  private projectService = inject(ProjectService);
  private toasterService = inject(ToasterService);

  controller: Controller;
  project: Project;

  readonly displayedColumns: string[] = ['name', 'value', 'actions'];
  readonly variables = signal<ProjectVariable[]>([]);

  // Form fields
  readonly projectName = model('');
  readonly width = model(0);
  readonly height = model(0);
  readonly nodeGridSize = model(25);
  readonly drawingGridSize = model(25);

  // Checkboxes (already model() signals)
  readonly auto_open = model(false);
  readonly auto_start = model(false);
  readonly auto_close = model(false);
  readonly show_interface_labels = model(false);

  // Variable form fields
  readonly variableName = model('');
  readonly variableValue = model('');

  // Form validity
  readonly isFormValid = computed(() => {
    return this.projectName().trim().length > 0 && +this.width() >= 0 && +this.height() >= 0 && +this.nodeGridSize() >= 0 && +this.drawingGridSize() >= 0;
  });

  readonly isVariableFormValid = computed(() => {
    return this.variableName().trim().length > 0 && this.variableValue().trim().length > 0;
  });

  ngOnInit() {
    this.projectName.set(this.project.name);
    this.width.set(this.project.scene_width);
    this.height.set(this.project.scene_height);
    this.nodeGridSize.set(this.project.grid_size);
    this.drawingGridSize.set(this.project.drawing_grid_size);
    if (this.project.variables) {
      this.variables.set([...this.project.variables]);
    }
    this.auto_open.set(this.project.auto_open);
    this.auto_start.set(this.project.auto_start);
    this.auto_close.set(!this.project.auto_close);
    this.show_interface_labels.set(this.project.show_interface_labels);
  }

  addVariable(): void {
    if (this.isVariableFormValid()) {
      const variable: ProjectVariable = {
        name: this.variableName().trim(),
        value: this.variableValue().trim(),
      };
      this.variables.update((v) => v.concat([variable]));
    } else {
      this.toasterService.error('Fill all required fields with correct values.');
    }
  }

  deleteVariable(variable: ProjectVariable): void {
    const dialogRef = this.dialog.open(DeleteConfirmationDialogComponent, {
      data: { templateName: variable.name },
      panelClass: 'base-dialog-panel',
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.variables.update((v) => v.filter((elem) => elem !== variable));
      }
    });
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  onYesClick(): void {
    if (!this.isFormValid()) {
      this.toasterService.error('Fill all required fields with correct values.');
      return;
    }

    this.project.name = this.projectName().trim();
    this.project.scene_width = +this.width();
    this.project.scene_height = +this.height();
    this.project.drawing_grid_size = +this.drawingGridSize();
    this.project.grid_size = +this.nodeGridSize();
    this.project.variables = this.variables();
    this.project.auto_open = this.auto_open();
    this.project.auto_start = this.auto_start();
    this.project.auto_close = !this.auto_close();
    this.project.show_interface_labels = this.show_interface_labels();

    this.projectService.update(this.controller, this.project).subscribe({
      next: (updatedProject: Project) => {
        this.projectService
          .postReadmeFile(this.controller, this.project.project_id, this.editor()?.markdown() ?? '')
          .subscribe({
            next: () => {
              this.toasterService.success(`Project ${updatedProject.name} updated.`);
              this.dialogRef.close(updatedProject);
            },
            error: (err) => {
              const message = err.error?.message || err.message || 'Failed to update project readme';
              this.toasterService.error(message);
            },
          });
      },
      error: (err) => {
        const message = err.error?.message || err.message || 'Failed to update project';
        this.toasterService.error(message);
      },
    });
  }
}
