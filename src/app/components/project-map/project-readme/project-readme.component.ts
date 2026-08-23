import { ChangeDetectionStrategy, Component, AfterViewInit, inject, signal } from '@angular/core';
import { MatDialogRef, MatDialogTitle, MatDialogContent, MatDialogActions } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { Controller } from '@models/controller';
import { Project } from '@models/project';
import { ProjectService } from '@services/project.service';
import { MarkdownViewerComponent } from '../../../common/markdown-viewer/markdown-viewer.component';

@Component({
  selector: 'app-project-readme',
  templateUrl: './project-readme.component.html',
  styleUrl: './project-readme.component.scss',
  imports: [MatDialogTitle, MatDialogContent, MatDialogActions, MatButtonModule, MarkdownViewerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectReadmeComponent implements AfterViewInit {
  private dialogRef = inject(MatDialogRef<ProjectReadmeComponent>);
  private projectService = inject(ProjectService);

  controller: Controller;
  project: Project;
  readonly readme = signal('');

  ngAfterViewInit() {
    this.projectService.getReadmeFile(this.controller, this.project.project_id).subscribe({
      next: (file) => {
        this.readme.set(file ?? '');
      },
      error: (err) => {
        console.error('Failed to load project readme:', err);
      },
    });
  }

  onNoClick() {
    this.dialogRef.close();
  }
}
