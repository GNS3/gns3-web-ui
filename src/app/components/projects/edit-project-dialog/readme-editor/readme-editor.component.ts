import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
  inject,
  input,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTabsModule } from '@angular/material/tabs';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { marked } from 'marked';
import { ProjectService } from '@services/project.service';
import { Controller } from '@models/controller';
import { Project } from '@models/project';

@Component({
  standalone: true,
  selector: 'app-readme-editor',
  templateUrl: './readme-editor.component.html',
  styleUrls: ['./readme-editor.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, MatTabsModule],
})
export class ReadmeEditorComponent implements OnInit {
  readonly controller = input<Controller>(undefined);
  readonly project = input<Project>(undefined);

  private projectService = inject(ProjectService);
  private sanitizer = inject(DomSanitizer);
  private cd = inject(ChangeDetectorRef);

  public markdown = ``;

  constructor() {}

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
    this.projectService.getReadmeFile(this.controller(), this.project().project_id).subscribe({
      next: (file) => {
        if (file) {
          this.markdown = file;
        }
        this.cd.markForCheck();
      },
      error: (err) => {
        if (err.status === 404) {
          // File doesn't exist yet, which is fine
          this.markdown = '';
        }
        this.cd.markForCheck();
      },
    });
  }
}
