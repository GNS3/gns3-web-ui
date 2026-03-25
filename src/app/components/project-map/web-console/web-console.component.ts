import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnInit,
  OnDestroy,
  ChangeDetectorRef,
  inject,
  input,
  viewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Terminal } from 'xterm';
import { AttachAddon } from 'xterm-addon-attach';
import { FitAddon } from 'xterm-addon-fit';
import { Subscription } from 'rxjs';
import { Node as GNS3Node } from '../../../cartography/models/node';
import { Project } from '@models/project';
import { Controller } from '@models/controller';
import { NodeConsoleService } from '@services/nodeConsole.service';
import { ThemeService } from '@services/theme.service';
import { XtermContextMenuService } from '@services/xterm-context-menu.service';
import { XtermService } from '@services/xterm.service';

@Component({
  selector: 'app-web-console',
  templateUrl: './web-console.component.html',
  styleUrls: ['../../../../../node_modules/xterm/css/xterm.css', './web-console.component.scss'],
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WebConsoleComponent implements OnInit, AfterViewInit, OnDestroy {
  readonly controller = input<Controller>(undefined);
  readonly project = input<Project>(undefined);
  readonly node = input<GNS3Node>(undefined);

  public term: Terminal = new Terminal({
    cols: 100,
    rows: 32,
    cursorBlink: true,
    cursorStyle: 'block',
    fontSize: 15,
    fontFamily: 'courier-new, courier, monospace',
    rightClickSelectsWord: true, // Enable right-click to select word
    altClickMovesCursor: true, // Enable Alt+Click to move cursor
    scrollback: 1000,
  });
  public fitAddon: FitAddon = new FitAddon();
  public isLightThemeEnabled: boolean = false;
  private resizeObserver: ResizeObserver | null = null;
  private contextMenuCleanup: (() => void) | null = null;
  private themeSubscription: Subscription | null = null;

  readonly terminal = viewChild<ElementRef>('terminal');

  private consoleService = inject(NodeConsoleService);
  private themeService = inject(ThemeService);
  private cdr = inject(ChangeDetectorRef);
  private contextMenuService = inject(XtermContextMenuService);
  private xtermService = inject(XtermService);

  constructor() {}

  ngOnInit() {
    this.isLightThemeEnabled = this.themeService.getActualTheme() === 'light';
    this.cdr.markForCheck();

    // Subscribe to theme changes
    this.themeSubscription = this.themeService.themeChanged.subscribe(() => {
      this.xtermService.updateTerminalTheme(this.term, this.cdr);
      this.isLightThemeEnabled = this.themeService.getActualTheme() === 'light';
    });

    this.consoleService.consoleResized.subscribe((ev) => {
      // Use FitAddon to calculate proper dimensions instead of hardcoded pixels
      this.fitAddon.fit();
      const cols = this.term.cols;
      const rows = this.term.rows;

      this.consoleService.setNumberOfColumns(cols);
      this.consoleService.setNumberOfRows(rows);

      this.term.resize(cols, rows);
    });

    if (this.consoleService.getNumberOfColumns() && this.consoleService.getNumberOfRows()) {
      this.term.resize(this.consoleService.getNumberOfColumns(), this.consoleService.getNumberOfRows());
    }
  }

  ngAfterViewInit() {
    const terminal = this.terminal();
    this.term.open(terminal.nativeElement);

    // Set theme based on current Material Design 3 theme
    this.xtermService.updateTerminalTheme(this.term, this.cdr);

    const socket = new WebSocket(this.consoleService.getUrl(this.controller(), this.node()));

    socket.onerror = (event) => {
      console.error('[WebConsole] Socket connection error');
      this.term.write('\r\n\x1b[31mConnection lost. Please check if the node is still running.\x1b[0m\r\n');
    };
    socket.onclose = (event) => {
      console.log('[WebConsole] Socket closed:', event.code, event.reason);
      this.term.write('\r\n\x1b[33mConnection closed.\x1b[0m\r\n');
      this.consoleService.closeConsoleForNode(this.node());
    };

    const attachAddon = new AttachAddon(socket);
    this.term.loadAddon(attachAddon);
    this.term.options.cursorBlink = true;
    this.xtermService.initTerminal(this.term, this.fitAddon);
    this.fitAddon.fit();
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
          try {
            // Fit terminal to container
            this.fitAddon.fit();

            // Also update columns/rows for service
            const cols = this.term.cols;
            const rows = this.term.rows;
            this.consoleService.setNumberOfColumns(cols);
            this.consoleService.setNumberOfRows(rows);
          } catch (e) {
            // Ignore fit errors when element is not visible, but log for debugging
            console.debug('[WebConsole] FitAddon.fit() failed:', e);
          }

          this.cdr.markForCheck();
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
    // Cleanup theme subscription
    if (this.themeSubscription) {
      this.themeSubscription.unsubscribe();
      this.themeSubscription = null;
    }

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
