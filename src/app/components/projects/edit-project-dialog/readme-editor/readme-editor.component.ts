import { Component, OnInit, ViewEncapsulation, Input } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { marked } from 'marked';
import { ProjectService } from '@services/project.service';
import { Controller } from '@models/controller';
import { Project } from '@models/project';

@Component({
    selector: 'app-readme-editor',
    templateUrl: './readme-editor.component.html',
    encapsulation: ViewEncapsulation.None,
    styleUrls: ['./readme-editor.component.scss']
})
export class ReadmeEditorComponent implements OnInit {
    @Input() controller: Controller;
    @Input() project: Project;

    public markdown = ``;

    constructor(
        private projectService: ProjectService,
        private sanitizer: DomSanitizer
    ) {}

    /**
     * Get safe HTML for markdown preview
     * @returns SafeHtml
     */
    get markdownHtml(): SafeHtml | string {
        if (!this.markdown) {
            return '';
        }
        try {
            const html = marked(this.markdown) as string;
            return this.sanitizer.bypassSecurityTrustHtml(html);
        } catch (e) {
            return this.markdown;
        }
    }

    ngOnInit() {
        this.projectService.getReadmeFile(this.controller, this.project.project_id).subscribe({
            next: (file) => {
                if (file) {
                    this.markdown = file;
                }
            },
            error: (err) => {
                if (err.status === 404) {
                    // File doesn't exist yet, which is fine
                    this.markdown = '';
                }
            }
        });
    }
}
