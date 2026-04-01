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
import { Terminal } from '@xterm/xterm';
import { AttachAddon } from '@xterm/addon-attach';
import { FitAddon } from '@xterm/addon-fit';
import { Subject, takeUntil } from 'rxjs';
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
  styleUrl: './web-console.component.scss',
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WebConsoleComponent implements OnInit, AfterViewInit, OnDestroy {
  readonly controller = input<Controller>(undefined);
  readonly project = input<Project>(undefined);
  readonly node = input<GNS3Node>(undefined);

  // Inject services first
  private consoleService = inject(NodeConsoleService);
  private themeService = inject(ThemeService);
  private cdr = inject(ChangeDetectorRef);
  private contextMenuService = inject(XtermContextMenuService);
  private xtermService = inject(XtermService);

  // Now can use xtermService for terminal initialization
  public term: Terminal = new Terminal({
    cols: 100,
    rows: 32,
    ...this.xtermService.getDefaultTerminalOptions(),
  });
  public fitAddon: FitAddon = new FitAddon();
  private socket: WebSocket | null = null;
  public isLightThemeEnabled: boolean = false;
  private resizeObserver: ResizeObserver | null = null;
  private contextMenuCleanup: (() => void) | null = null;
  private destroy$ = new Subject<void>();

  readonly terminal = viewChild<ElementRef>('terminal');

  constructor() {}

  ngOnInit() {
    this.isLightThemeEnabled = this.themeService.getActualTheme() === 'light';
    this.cdr.markForCheck();

    // Subscribe to theme changes
    this.themeService.themeChanged.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.xtermService.updateTerminalTheme(this.term, this.cdr);
      this.isLightThemeEnabled = this.themeService.getActualTheme() === 'light';
    });

    this.consoleService.consoleResized.pipe(takeUntil(this.destroy$)).subscribe(() => {
      // Delay to ensure DOM has been updated with new dimensions
      setTimeout(() => {
        this.fitTerminal();
      }, 50);
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

    this.socket = new WebSocket(this.consoleService.getUrl(this.controller(), this.node()));

    this.socket.onerror = () => {
      console.error('[WebConsole] Socket connection error');
      this.term.write('\r\n\x1b[31mConnection lost. Please check if the node is still running.\x1b[0m\r\n');
    };
    this.socket.onclose = () => {
      console.log('[WebConsole] Socket closed');
      this.term.write('\r\n\x1b[33mConnection closed.\x1b[0m\r\n');
      const currentNode = this.node();
      if (currentNode) {
        this.consoleService.closeConsoleForNode(currentNode);
      }
    };

    const attachAddon = new AttachAddon(this.socket);
    this.term.loadAddon(attachAddon);
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
            this.fitTerminal();
          } catch (e) {
            // Ignore fit errors when element is not visible
          }
        });
      }
    });

    this.resizeObserver.observe(terminal.nativeElement);
  }

  /**
   * Fit terminal to container and update service state
   */
  private fitTerminal(): void {
    this.fitAddon.fit();
    const cols = this.term.cols;
    const rows = this.term.rows;
    this.consoleService.setNumberOfColumns(cols);
    this.consoleService.setNumberOfRows(rows);
    this.term.resize(cols, rows);
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
    // Complete destroy$ to unsubscribe all takeUntil subscriptions
    this.destroy$.next();
    this.destroy$.complete();

    // Close WebSocket connection
    if (this.socket) {
      this.socket.close();
      this.socket = null;
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
