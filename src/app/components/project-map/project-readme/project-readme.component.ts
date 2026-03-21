import { Component, AfterViewInit, inject, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Controller } from '@models/controller';
import { Project } from '@models/project';
import { ProjectService } from '@services/project.service';
import { ElementRef, Renderer2 } from '@angular/core';
import { marked } from 'marked';

@Component({
  standalone: true,
  selector: 'app-project-readme',
  templateUrl: './project-readme.component.html',
  styleUrls: ['./project-readme.component.scss'],
  imports: [CommonModule, MatDialogModule, MatButtonModule],
})
export class ProjectReadmeComponent implements AfterViewInit {
  private dialogRef = inject(MatDialogRef<ProjectReadmeComponent>);
  private projectService = inject(ProjectService);
  private sanitizer = inject(DomSanitizer);

  controller: Controller;
  project: Project;
  readonly text = viewChild<ElementRef>('text');
  readmeHtml: SafeHtml | string = '';

  constructor() {}

  ngAfterViewInit() {
    let markdown = ``;

    this.projectService.getReadmeFile(this.controller, this.project.project_id).subscribe((file) => {
      if (file) {
        markdown = file;
        const markdownHtml = marked(markdown) as string;
        this.readmeHtml = this.sanitizer.bypassSecurityTrustHtml(markdownHtml);
      }
    });
  }

  onNoClick() {
    this.dialogRef.close();
  }
}
