import {
  ChangeDetectionStrategy,
  Component,
  AfterViewInit,
  inject,
  viewChild,
  ChangeDetectorRef,
  ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Controller } from '@models/controller';
import { Project } from '@models/project';
import { ProjectService } from '@services/project.service';
import { marked } from 'marked';

@Component({
  selector: 'app-project-readme',
  templateUrl: './project-readme.component.html',
  styleUrl: './project-readme.component.scss',
  imports: [CommonModule, MatDialogModule, MatButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectReadmeComponent implements AfterViewInit {
  readonly text = viewChild<ElementRef>('text');
  private dialogRef = inject(MatDialogRef<ProjectReadmeComponent>);
  private projectService = inject(ProjectService);
  private sanitizer = inject(DomSanitizer);
  private cdr = inject(ChangeDetectorRef);

  controller: Controller;
  project: Project;
  readmeHtml: SafeHtml | string = '';

  ngAfterViewInit() {
    let markdown = ``;

    this.projectService.getReadmeFile(this.controller, this.project.project_id).subscribe({
      next: (file) => {
        if (file) {
          markdown = file;
          const markdownHtml = marked(markdown) as string;
          this.readmeHtml = this.sanitizer.bypassSecurityTrustHtml(markdownHtml);
          this.cdr.markForCheck();
        }
      },
      error: (err) => {
        console.error('Failed to load project readme:', err);
        this.cdr.markForCheck();
      },
    });
  }

  onNoClick() {
    this.dialogRef.close();
  }
}
