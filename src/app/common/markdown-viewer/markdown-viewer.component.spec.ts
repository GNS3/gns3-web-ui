import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { MarkdownModule } from 'ngx-markdown';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  CodeBlockDialogComponent,
} from '../code-block-dialog/code-block-dialog.component';
import { MarkdownViewerComponent } from './markdown-viewer.component';

describe('MarkdownViewerComponent', () => {
  let fixture: ComponentFixture<MarkdownViewerComponent>;
  let mockDialog: { open: ReturnType<typeof vi.fn> };

  const longCode = (lines: number): string =>
    Array.from({ length: lines }, (_, i) => 'line ' + (i + 1)).join('\n');

  const render = (data: string): void => {
    fixture.componentRef.setInput('data', data);
    fixture.detectChanges();
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    mockDialog = { open: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [MarkdownViewerComponent, MarkdownModule.forRoot()],
    })
      .overrideProvider(MatDialog, { useValue: mockDialog })
      .compileComponents();

    fixture = TestBed.createComponent(MarkdownViewerComponent);
    fixture.componentRef.setInput('data', '');
    fixture.detectChanges();
  });

  afterEach(() => {
    if (fixture) {
      fixture.destroy();
    }
  });

  describe('Rendering', () => {
    it('should create', () => {
      expect(fixture.componentInstance).toBeTruthy();
    });

    it('should render markdown data as HTML', async () => {
      render('# Hello GNS3');
      await vi.waitFor(() => {
        expect(fixture.nativeElement.querySelector('h1')?.textContent).toContain('Hello GNS3');
      });
    });

    it('should wrap tables in a scrollable container', async () => {
      render('| a | b |\n| --- | --- |\n| 1 | 2 |');
      await vi.waitFor(() => {
        const wrapper = fixture.nativeElement.querySelector('.markdown-table-wrapper');
        expect(wrapper).toBeTruthy();
        expect(wrapper.querySelector('table')).toBeTruthy();
      });
    });
  });

  describe('Code blocks', () => {
    it('should keep short code blocks expanded', async () => {
      render('```bash\n' + longCode(10) + '\n```');
      await vi.waitFor(() => {
        expect(fixture.nativeElement.querySelector('pre code')).toBeTruthy();
      });
      expect(fixture.nativeElement.querySelector('pre.code-block-collapsible')).toBeFalsy();
    });

    it('should collapse code blocks over 50 lines', async () => {
      render('```bash\n' + longCode(60) + '\n```');
      await vi.waitFor(() => {
        expect(fixture.nativeElement.querySelector('pre.code-block-collapsible')).toBeTruthy();
      });
      const pre = fixture.nativeElement.querySelector('pre.code-block-collapsible');
      // marked emits a trailing newline, so 60 source lines split into 61
      expect(pre.getAttribute('title')).toBe('Click to view full code (61 lines)');
    });

    it('should open the code block dialog on click of a collapsed block', async () => {
      render('```bash\n' + longCode(60) + '\n```');
      await vi.waitFor(() => {
        expect(fixture.nativeElement.querySelector('pre.code-block-collapsible')).toBeTruthy();
      });

      fixture.nativeElement.querySelector('pre.code-block-collapsible').click();

      expect(mockDialog.open).toHaveBeenCalledTimes(1);
      expect(mockDialog.open).toHaveBeenCalledWith(
        CodeBlockDialogComponent,
        expect.objectContaining({
          panelClass: ['base-dialog-panel', 'code-block-dialog-panel', 'dialog-extra-large-panel'],
        })
      );
      const callData = mockDialog.open.mock.calls[0][1].data;
      expect(callData.language).toBe('bash');
      expect(callData.code).toContain('line 60');
    });
  });
});
