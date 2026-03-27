import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTabsModule } from '@angular/material/tabs';
import { MarkdownModule } from 'ngx-markdown';
import { ProjectService } from '@services/project.service';
import { Controller } from '@models/controller';
import { Project } from '@models/project';

@Component({
  standalone: true,
  selector: 'app-readme-editor',
  templateUrl: './readme-editor.component.html',
  styleUrls: ['./readme-editor.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, MatTabsModule, MarkdownModule],
})
export class ReadmeEditorComponent implements OnInit {
  readonly controller = input<Controller>(undefined);
  readonly project = input<Project>(undefined);

  private projectService = inject(ProjectService);
  private cd = inject(ChangeDetectorRef);

  markdown = signal('');

  ngOnInit() {
    this.projectService.getReadmeFile(this.controller(), this.project().project_id).subscribe({
      next: (file) => {
        if (file) {
          this.markdown.set(file);
        }
        this.cd.markForCheck();
      },
      error: (err) => {
        if (err.status === 404) {
          // File doesn't exist yet, which is fine
          this.markdown.set('');
        }
        this.cd.markForCheck();
      },
    });
  }
}
