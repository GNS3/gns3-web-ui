import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject, input, signal, output, Output, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MarkdownModule } from 'ngx-markdown';
import { ProjectService } from '@services/project.service';
import { Controller } from '@models/controller';
import { Project } from '@models/project';
import { debounceTime, distinctUntilChanged, tap, takeUntil } from 'rxjs/operators';
import { Subject, Subscription } from 'rxjs';

@Component({
  standalone: true,
  selector: 'app-readme-editor',
  templateUrl: './readme-editor.component.html',
  styleUrls: ['./readme-editor.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, MatButtonModule, MatIconModule, MatFormFieldModule, MatInputModule, MarkdownModule],
})
export class ReadmeEditorComponent implements OnInit, OnDestroy {
  readonly controller = input<Controller>(undefined);
  readonly project = input<Project>(undefined);

  private projectService = inject(ProjectService);
  private cd = inject(ChangeDetectorRef);

  markdown = signal('');
  isEditing = signal(false);
  saveStatus = signal<'idle' | 'saving' | 'saved' | 'error'>('idle');
  private originalMarkdown = '';
  private destroy$ = new Subject<void>();
  private markdownChangeSubscription: Subscription | null = null;

  readonly isEditingChange = output<boolean>();

  private markdownChange$ = new Subject<string>();

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

    // Setup auto-save with 2 second debounce
    this.markdownChangeSubscription = this.markdownChange$
      .pipe(
        debounceTime(2000),
        distinctUntilChanged(),
        tap((content) => this.autoSave(content)),
        takeUntil(this.destroy$)
      )
      .subscribe();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.markdownChangeSubscription) {
      this.markdownChangeSubscription.unsubscribe();
    }
  }

  onMarkdownInput(event: Event) {
    const content = (event.target as HTMLTextAreaElement).value;
    this.markdown.set(content);
    this.markdownChange$.next(content);
  }

  private autoSave(content: string) {
    this.saveStatus.set('saving');

    this.projectService.postReadmeFile(this.controller(), this.project().project_id, content).subscribe({
      next: () => {
        this.saveStatus.set('saved');
        this.cd.markForCheck();

        // Reset to idle after 2 seconds
        setTimeout(() => {
          this.saveStatus.set('idle');
          this.cd.markForCheck();
        }, 2000);
      },
      error: (err) => {
        this.saveStatus.set('error');
        this.cd.markForCheck();

        // Reset to idle after 3 seconds
        setTimeout(() => {
          this.saveStatus.set('idle');
          this.cd.markForCheck();
        }, 3000);
      },
    });
  }

  enterEditMode() {
    this.originalMarkdown = this.markdown();
    this.isEditing.set(true);
    this.isEditingChange.emit(true);
  }

  cancelEdit() {
    // Just exit edit mode, content is already auto-saved
    this.isEditing.set(false);
    this.isEditingChange.emit(false);
  }

  saveEdit() {
    this.isEditing.set(false);
    this.isEditingChange.emit(false);
  }
}
