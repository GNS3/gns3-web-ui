import { Component, AfterViewInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Controller } from '@models/controller';
import { Project } from '@models/project';
import { ProjectService } from '@services/project.service';
import { ElementRef } from '@angular/core';
import { Renderer2 } from '@angular/core';
import { ViewChild } from '@angular/core';
import { marked } from 'marked';

@Component({
  standalone: false,
  selector: 'app-project-readme',
  templateUrl: './project-readme.component.html',
  styleUrls: ['./project-readme.component.scss']
})
export class ProjectReadmeComponent implements AfterViewInit {
  controller: Controller;
  project: Project;
  @ViewChild('text', {static: false}) text: ElementRef;
  readmeHtml: SafeHtml | string = '';

  constructor(
    public dialogRef: MatDialogRef<ProjectReadmeComponent>,
    private projectService: ProjectService,
    private elementRef: ElementRef,
    private renderer: Renderer2,
    private sanitizer: DomSanitizer
  ) {}

  ngAfterViewInit() {
    let markdown = ``;

    this.projectService.getReadmeFile(this.controller, this.project.project_id).subscribe(file => {
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
