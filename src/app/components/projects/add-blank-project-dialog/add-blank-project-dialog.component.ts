import { ChangeDetectionStrategy, Component, EventEmitter, inject, model, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { v4 as uuid } from 'uuid';
import { Project } from '@models/project';
import { Controller } from '@models/controller';
import { ProjectService } from '@services/project.service';
import { ToasterService } from '@services/toaster.service';
import { ProjectNameValidator } from '../models/projectNameValidator';

@Component({
  standalone: true,
  selector: 'app-add-blank-project-dialog',
  templateUrl: './add-blank-project-dialog.component.html',
  styleUrls: ['./add-blank-project-dialog.component.scss'],
  providers: [ProjectNameValidator],
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
export class AddBlankProjectDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<AddBlankProjectDialogComponent>);
  private readonly router = inject(Router);
  private readonly projectService = inject(ProjectService);
  private readonly toasterService = inject(ToasterService);
  private readonly projectNameValidator = inject(ProjectNameValidator);

  // Input data (passed from parent)
  controller: Controller;

  // Form fields using model() for two-way binding
  readonly projectName = model('');

  // Data properties using signal()
  readonly uuid = signal('');
  readonly isCheckingName = signal(false);
  readonly nameExistsError = signal(false);

  // Event emitter
  readonly onAddProject = new EventEmitter<string>();

  // Computed validation state
  readonly isNameValid = computed(() => {
    const name = this.projectName();
    if (!name || name.trim().length === 0) {
      return false;
    }

    // Check for invalid characters using ProjectNameValidator
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
    this.uuid.set(uuid());

    this.projectService.add(this.controller, this.projectName().trim(), this.uuid()).subscribe({
      next: (project: Project) => {
        this.dialogRef.close();
        this.toasterService.success(`Project ${project.name} added`);
        this.router.navigate(['/controller', this.controller.id, 'project', project.project_id]);
        this.onAddProject.emit(project.project_id);
      },
      error: (err) => {
        const message = err.error?.message || err.message || 'Cannot create new project';
        this.toasterService.error(message);
      },
    });
  }
}
