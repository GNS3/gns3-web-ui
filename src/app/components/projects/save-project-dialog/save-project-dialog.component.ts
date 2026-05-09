import { ChangeDetectionStrategy, Component, EventEmitter, computed, inject, model, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { NodesDataSource } from '../../../cartography/datasources/nodes-datasource';
import { Project } from '@models/project';
import { Controller } from '@models/controller';
import { ProjectService } from '@services/project.service';
import { ToasterService } from '@services/toaster.service';
import { ProjectNameValidator } from '../models/projectNameValidator';

@Component({
  standalone: true,
  selector: 'app-save-project-dialog',
  templateUrl: './save-project-dialog.component.html',
  styleUrls: ['./save-project-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
  ],
})
export class SaveProjectDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<SaveProjectDialogComponent>);
  private readonly projectService = inject(ProjectService);
  private readonly nodesDataSource = inject(NodesDataSource);
  private readonly toasterService = inject(ToasterService);
  private readonly projectNameValidator = inject(ProjectNameValidator);

  controller: Controller;
  project: Project;

  readonly projectName = model('');
  readonly uuid = signal('');
  readonly isCheckingName = signal(false);
  readonly nameExistsError = signal(false);

  readonly onAddProject = new EventEmitter<string>();

  readonly isNameValid = computed(() => {
    const name = this.projectName();
    if (!name || name.trim().length === 0) {
      return false;
    }
    const validationError = this.projectNameValidator.get({ value: name });
    return !validationError;
  });

  readonly hasInvalidCharacters = computed(() => {
    const name = this.projectName();
    if (!name || name.trim().length === 0) {
      return false;
    }
    const validationError = this.projectNameValidator.get({ value: name });
    return validationError?.invalidName === true;
  });

  onAddClick(): void {
    if (!this.isNameValid()) {
      return;
    }
    this.checkProjectNameExists();
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      this.onAddClick();
    }
  }

  private checkProjectNameExists(): void {
    this.isCheckingName.set(true);
    this.nameExistsError.set(false);

    this.projectService.list(this.controller).subscribe({
      next: (projects: Project[]) => {
        const projectName = this.projectName().trim();
        const existingProject = projects.find((project) => project.name === projectName);

        this.isCheckingName.set(false);

        if (existingProject) {
          this.nameExistsError.set(true);
          this.toasterService.error('Project with this name already exists.');
        } else if (this.hasRunningNodes()) {
          this.toasterService.error('Please stop all nodes in order to save project.');
        } else {
          this.addProject();
        }
      },
      error: (err) => {
        this.isCheckingName.set(false);
        const message = err.error?.message || err.message || 'Failed to check project name';
        this.toasterService.error(message);
      },
    });
  }

  private addProject(): void {
    this.uuid.set(crypto.randomUUID());

    this.projectService
      .duplicate(this.controller, this.project.project_id, this.projectName().trim())
      .subscribe({
        next: (project: Project) => {
          this.dialogRef.close();
          this.toasterService.success(`Project ${project.name} added`);
          this.onAddProject.emit(project.project_id);
        },
        error: (err) => {
          const message = err.error?.message || err.message || 'Failed to save project';
          this.toasterService.error(message);
        },
      });
  }

  private hasRunningNodes(): boolean {
    return (
      this.nodesDataSource
        .getItems()
        .filter(
          (node) =>
            (node.status === 'started' && node.node_type === 'vpcs') ||
            (node.status === 'started' && node.node_type === 'virtualbox') ||
            (node.status === 'started' && node.node_type === 'vmware')
        ).length > 0
    );
  }
}
