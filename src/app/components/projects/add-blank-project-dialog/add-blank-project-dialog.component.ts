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
import { MapSettingsService } from '@services/mapsettings.service';
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
  private readonly mapSettingsService = inject(MapSettingsService);
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
        // Apply the user's saved project-workspace defaults to the freshly
        // created project (scene size, grid sizes, show/snap flags). These
        // are persisted client-side by the Settings → Project workspace
        // section via MapSettingsService; the GNS3 server has no /settings
        // endpoint with Graphicsview, so we mirror them onto each new
        // project at creation time.
        project.scene_width = this.mapSettingsService.getDefaultSceneWidth();
        project.scene_height = this.mapSettingsService.getDefaultSceneHeight();
        project.grid_size = this.mapSettingsService.getDefaultGridSize();
        project.drawing_grid_size = this.mapSettingsService.getDefaultDrawingGridSize();
        project.show_grid = this.mapSettingsService.getDefaultShowGrid();
        project.snap_to_grid = this.mapSettingsService.getDefaultSnapToGrid();

        this.projectService.update(this.controller, project).subscribe({
          error: () => {
            // Updating the defaults is best-effort — the project is already
            // created and navigable; surface a non-blocking warning.
            this.toasterService.error('Project created, but workspace defaults were not applied');
            this.finishProjectCreation(project);
          },
          complete: () => this.finishProjectCreation(project),
        });
      },
      error: (err) => {
        const message = err.error?.message || err.message || 'Cannot create new project';
        this.toasterService.error(message);
      },
    });
  }

  private finishProjectCreation(project: Project): void {
    this.dialogRef.close();
    this.toasterService.success(`Project ${project.name} added`);
    this.router.navigate(['/controller', this.controller.id, 'project', project.project_id]);
    this.onAddProject.emit(project.project_id);
  }
}
