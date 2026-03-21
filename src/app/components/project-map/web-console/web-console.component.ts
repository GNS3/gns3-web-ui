import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnInit,
  OnDestroy,
  ViewEncapsulation,
  ChangeDetectorRef,
  inject,
  input,
  viewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Terminal } from 'xterm';
import { AttachAddon } from 'xterm-addon-attach';
import { FitAddon } from 'xterm-addon-fit';
import { Node as GNS3Node } from '../../../cartography/models/node';
import { Project } from '@models/project';
import { Controller } from '@models/controller';
import { NodeConsoleService } from '@services/nodeConsole.service';
import { ThemeService } from '@services/theme.service';
import { XtermContextMenuService } from '@services/xterm-context-menu.service';

@Component({
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  selector: 'app-web-console',
  templateUrl: './web-console.component.html',
  styleUrls: ['../../../../../node_modules/xterm/css/xterm.css', './web-console.component.scss'],
  imports: [CommonModule],
  // TODO: This component has been partially migrated to be zoneless-compatible.
  // After testing, this should be updated to ChangeDetectionStrategy.OnPush.
  changeDetection: ChangeDetectionStrategy.Default,
})
export class WebConsoleComponent implements OnInit, AfterViewInit, OnDestroy {
  readonly controller = input<Controller>(undefined);
  readonly project = input<Project>(undefined);
  readonly node = input<GNS3Node>(undefined);

  public term: Terminal = new Terminal({
    cols: 100,
    rows: 32,
    cursorBlink: true,
    rightClickSelectsWord: true, // Enable right-click to select word
    altClickMovesCursor: true, // Enable Alt+Click to move cursor
  });
  public fitAddon: FitAddon = new FitAddon();
  public isLightThemeEnabled: boolean = false;
  private copiedText: string = '';
  private resizeObserver: ResizeObserver | null = null;
  private contextMenuCleanup: (() => void) | null = null;

  readonly terminal = viewChild<ElementRef>('terminal');

  private consoleService = inject(NodeConsoleService);
  private themeService = inject(ThemeService);
  private cdr = inject(ChangeDetectorRef);
  private contextMenuService = inject(XtermContextMenuService);

  constructor() {}

  ngOnInit() {
    this.themeService.getActualTheme() === 'light'
      ? (this.isLightThemeEnabled = true)
      : (this.isLightThemeEnabled = false);
    this.cdr.markForCheck();

    this.consoleService.consoleResized.subscribe((ev) => {
      let numberOfColumns = Math.floor(ev.width / 9);
      let numberOfRows = Math.floor(ev.height / 17);

      this.consoleService.setNumberOfColumns(numberOfColumns);
      this.consoleService.setNumberOfRows(numberOfRows);

      this.term.resize(numberOfColumns, numberOfRows);
    });

    if (this.consoleService.getNumberOfColumns() && this.consoleService.getNumberOfRows()) {
      this.term.resize(this.consoleService.getNumberOfColumns(), this.consoleService.getNumberOfRows());
    }
  }

  ngAfterViewInit() {
    const terminal = this.terminal();
    this.term.open(terminal.nativeElement);
    if (this.isLightThemeEnabled)
      this.term.setOption('theme', { background: 'white', foreground: 'black', cursor: 'black' });

    const socket = new WebSocket(this.consoleService.getUrl(this.controller(), this.node()));

    socket.onerror = (event) => {
      this.term.write('Connection lost');
    };
    socket.onclose = (event) => {
      this.consoleService.closeConsoleForNode(this.node());
    };

    const attachAddon = new AttachAddon(socket);
    this.term.loadAddon(attachAddon);
    this.term.setOption('cursorBlink', true);
    this.term.loadAddon(this.fitAddon);
    this.fitAddon.activate(this.term);
    this.term.focus();

    this.term.attachCustomKeyEventHandler((key: KeyboardEvent) => {
      // Handle Alt+1-9 shortcuts for tab switching (forward to parent)
      if (key.altKey && key.key >= '1' && key.key <= '9') {
        // Create and dispatch custom event for parent component
        const customEvent = new CustomEvent('consoleTabShortcut', {
          detail: { key: key.key },
          bubbles: true,
        });
        this.term.element.dispatchEvent(customEvent);
        return false; // Prevent xterm from handling this
      }

      // Copy/paste handling
      if (key.code === 'KeyC' || key.code === 'KeyV') {
        if (key.ctrlKey && key.shiftKey) {
          return false;
        }
      }
      return true;
    });

    // Setup ResizeObserver for automatic terminal resizing
    this.setupResizeObserver();

    // Setup context menu for copy/paste
    this.contextMenuCleanup = this.contextMenuService.attachContextMenu(this.term, terminal.nativeElement);
  }

  /**
   * Setup ResizeObserver to automatically resize terminal when container size changes
   */
  private setupResizeObserver(): void {
    const terminal = this.terminal();
    if (!terminal?.nativeElement) return;

    this.resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;

        // Skip if width or height is 0 (element is hidden)
        if (width === 0 || height === 0) continue;

        // Use requestAnimationFrame to ensure DOM is fully rendered
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            try {
              // Fit terminal to container
              this.fitAddon.fit();

              // Also update columns/rows for service
              const cols = this.term.cols;
              const rows = this.term.rows;
              this.consoleService.setNumberOfColumns(cols);
              this.consoleService.setNumberOfRows(rows);
            } catch (e) {
              // Ignore fit errors when element is not visible
            }

            this.cdr.markForCheck();
          });
        });
      }
    });

    this.resizeObserver.observe(terminal.nativeElement);
  }

  /**
   * Public method to focus the terminal
   * Called by parent component when tab is switched
   */
  focusTerminal(): void {
    if (this.term) {
      this.term.focus();
    }
  }

  /**
   * Cleanup on component destroy
   */
  ngOnDestroy(): void {
    // Cleanup ResizeObserver to prevent memory leaks
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }

    // Cleanup context menu event listeners
    if (this.contextMenuCleanup) {
      this.contextMenuCleanup();
      this.contextMenuCleanup = null;
    }

    // Dispose terminal
    this.term.dispose();
  }
}
