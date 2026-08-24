import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  input,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MarkdownModule } from 'ngx-markdown';
import {
  CodeBlockDialogComponent,
  CodeBlockDialogData,
} from '../code-block-dialog/code-block-dialog.component';

/**
 * Markdown Viewer Component
 *
 * Shared markdown renderer: unified typography (see src/styles/_markdown.scss,
 * personalizable via --markdown-viewer-* CSS tokens) and post-render behavior
 * (long code blocks collapse into a dialog, tables get a scroll wrapper).
 */
@Component({
  selector: 'app-markdown-viewer',
  imports: [MarkdownModule],
  templateUrl: './markdown-viewer.component.html',
  styleUrl: './markdown-viewer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MarkdownViewerComponent {
  /** Raw markdown source. */
  readonly data = input.required<string>();

  private readonly dialog = inject(MatDialog);
  private readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);

  /**
   * Runs after every markdown render. Processing is idempotent: ngx-markdown
   * replaces the inner HTML on each render, so the markers below only guard
   * against double-processing within a single render pass.
   */
  onRenderReady(): void {
    this.processCodeBlocks();
    this.wrapTables();
  }

  /**
   * Add collapse functionality to long code blocks (>50 lines)
   */
  private processCodeBlocks(): void {
    const codeBlocks = this.elementRef.nativeElement.querySelectorAll('pre');

    codeBlocks.forEach((pre) => {
      if (pre.hasAttribute('data-code-processed')) {
        return;
      }

      const code = pre.querySelector('code');
      if (!code) {
        return;
      }

      const lines = code.textContent?.split('\n').length || 0;

      pre.setAttribute('data-code-processed', 'true');

      if (lines > 50) {
        pre.classList.add('code-block-collapsible');
        pre.setAttribute('title', `Click to view full code (${lines} lines)`);

        pre.addEventListener('click', (event) => {
          event.preventDefault();
          event.stopPropagation();
          this.openCodeBlockDialog(code.innerHTML, code.className);
        });
      }
    });
  }

  /**
   * Wrap tables in scrollable containers
   */
  private wrapTables(): void {
    const tables = this.elementRef.nativeElement.querySelectorAll('table');

    tables.forEach((table) => {
      if (table.parentElement?.classList.contains('markdown-table-wrapper')) {
        return;
      }

      const wrapper = document.createElement('div');
      wrapper.className = 'markdown-table-wrapper';

      table.parentNode?.insertBefore(wrapper, table);
      wrapper.appendChild(table);
    });
  }

  /**
   * Open code block in dialog
   */
  private openCodeBlockDialog(code: string, languageClass: string): void {
    const language = languageClass.match(/language-(\w+)/)?.[1] || undefined;

    const data: CodeBlockDialogData = {
      code,
      language,
    };

    this.dialog.open(CodeBlockDialogComponent, {
      data,
      panelClass: ['base-dialog-panel', 'code-block-dialog-panel', 'dialog-extra-large-panel'],
    });
  }
}
