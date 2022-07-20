import { Component, OnInit, ViewEncapsulation, Input } from '@angular/core';
import * as marked from 'marked';
import { ProjectService } from '../../../../services/project.service';
import { Server } from '../../../../models/server';
import { Project } from '../../../../models/project';

@Component({
    selector: 'app-readme-editor',
    templateUrl: './readme-editor.component.html',
    encapsulation: ViewEncapsulation.None,
    styleUrls: ['./readme-editor.component.scss']
})
export class ReadmeEditorComponent implements OnInit {
    @Input() controller: Server;
    @Input() project: Project;

    public markdown = ``;

    constructor(
        private projectService: ProjectService
    ) {}

    ngOnInit() {
        this.projectService.getReadmeFile(this.controller, this.project.project_id).subscribe(file => {
            if (file) this.markdown = file;
        });
    }
}
