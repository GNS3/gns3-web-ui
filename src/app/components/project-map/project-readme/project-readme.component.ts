import { Component, AfterViewInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { Server } from '../../../models/server';
import { Project } from '../../../models/project';
import { ProjectService } from '../../../services/project.service';
import * as marked from 'marked';
import { ElementRef } from '@angular/core';
import { Renderer2 } from '@angular/core';
import { ViewChild } from '@angular/core';

@Component({
  selector: 'app-project-readme',
  templateUrl: './project-readme.component.html',
  styleUrls: ['./project-readme.component.scss']
})
export class ProjectReadmeComponent implements AfterViewInit {
  controller: Server;
  project: Project;
  @ViewChild('text', {static: false}) text: ElementRef;
  
  constructor(
    public dialogRef: MatDialogRef<ProjectReadmeComponent>,
    private projectService: ProjectService,
    private elementRef: ElementRef,
    private renderer: Renderer2
  ) {}

  ngAfterViewInit() {
    let markdown = ``;

    this.projectService.getReadmeFile(this.controller, this.project.project_id).subscribe(file => {
        if (file) {
            markdown = file;
            setTimeout(function(){
                const markdownHtml = marked(markdown);
                document.getElementById('text').innerHTML = markdownHtml;
            }, 1000);
        }
    });
  }

  onNoClick() {
    this.dialogRef.close();
  }
}
