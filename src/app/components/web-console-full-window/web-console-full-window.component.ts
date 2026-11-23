import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnInit,
  OnDestroy,
  inject,
  viewChild,
  ChangeDetectorRef,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { Subject, takeUntil } from 'rxjs';
import { Terminal } from '@xterm/xterm';
import { AttachAddon } from '@xterm/addon-attach';
import { FitAddon } from '@xterm/addon-fit';
import { Node as GNS3Node } from '../../cartography/models/node';
import { Controller } from '@models/controller';
import { NodeService } from '@services/node.service';
import { NodeConsoleService } from '@services/nodeConsole.service';
import { ControllerService } from '@services/controller.service';
import { ThemeService } from '@services/theme.service';
import { XtermContextMenuService } from '@services/xterm-context-menu.service';
import { XtermService } from '@services/xterm.service';
import { ToasterService } from '@services/toaster.service';
import { TerminalSettingsPanelComponent } from '../terminal-settings-panel/terminal-settings-panel.component';

@Component({
  selector: 'app-web-console-full-window',
  templateUrl: './web-console-full-window.component.html',
  styleUrl: './web-console-full-window.component.scss',
  imports: [CommonModule, MatIconModule, TerminalSettingsPanelComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WebConsoleFullWindowComponent implements OnInit, OnDestroy {
  private controllerId: string;
  private projectId: string;
  private nodeId: string;
  private destroy$ = new Subject<void>();
  private controller: Controller;
  private node: GNS3Node;
  private contextMenuCleanup: (() => void) | null = null;
  private socket: WebSocket | null = null;
  private resizeObserver: ResizeObserver | null = null;

  // Settings panel state
  private showSettingsPanelSignal = signal(false);
  public readonly showSettingsPanel = this.showSettingsPanelSignal.asReadonly();

  // Inject services first
  private consoleService = inject(NodeConsoleService);
  private controllerService = inject(ControllerService);
  private route = inject(ActivatedRoute);
  private title = inject(Title);
  private nodeService = inject(NodeService);
  private themeService = inject(ThemeService);
  private contextMenuService = inject(XtermContextMenuService);
  private cdr = inject(ChangeDetectorRef);
  private xtermService = inject(XtermService);
  private toasterService = inject(ToasterService);

  // Now can use xtermService for terminal initialization
  public term: Terminal = new Terminal({
    ...this.xtermService.getDefaultTerminalOptions(),
  });
  public fitAddon: FitAddon = new FitAddon();

  readonly terminal = viewChild<ElementRef>('terminal');

  constructor() {}

  ngOnInit() {
    // Subscribe to theme changes
    this.themeService.themeChanged.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.xtermService.updateTerminalTheme(this.term, this.cdr);
    });

    if (this.controllerService.isServiceInitialized) {
      this.getData();
    } else {
      this.controllerService.serviceInitialized.pipe(takeUntil(this.destroy$)).subscribe((val) => {
        if (val) this.getData();
      });
    }
  }

  getData() {
    this.controllerId = this.route.snapshot.paramMap.get('controller_id');
    this.projectId = this.route.snapshot.paramMap.get('project_id');
    this.nodeId = this.route.snapshot.paramMap.get('node_id');

    this.consoleService.consoleResized.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.fitAddon.fit();
    });

    this.controllerService.get(+this.controllerId).then(
      (controller: Controller) => {
        this.controller = controller;
        this.nodeService
          .getNodeById(this.controller, this.projectId, this.nodeId)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (node: GNS3Node) => {
              this.node = node;
              this.title.setTitle(this.node.name);
              this.openTerminal();
            },
            error: (err) => {
              const message = err.error?.message || err.message || 'Failed to load node';
              this.toasterService.error(message);
              this.cdr.markForCheck();
            },
          });
      },
      (err) => {
        const message = err.error?.message || err.message || 'Failed to load controller';
        this.toasterService.error(message);
        this.cdr.markForCheck();
      }
    );
  }

  openTerminal() {
    setTimeout(() => {
      const terminal = this.terminal();
      this.term.open(terminal.nativeElement);

      // Set theme based on current Material Design 3 theme
      this.xtermService.updateTerminalTheme(this.term, this.cdr);

      this.socket = new WebSocket(this.consoleService.getUrl(this.controller, this.node));

      this.socket.onerror = () => {
        console.error('[WebConsoleFullWindow] Socket connection error');
        this.term.write('\r\n\x1b[31mConnection lost. Please check if the node is still running.\x1b[0m\r\n');
      };
      this.socket.onclose = () => {
        console.log('[WebConsoleFullWindow] Socket closed');
        this.term.write('\r\n\x1b[33mConnection closed.\x1b[0m\r\n');
      };

      this.socket.onopen = () => {
        this.consoleService.sendTerminalSize(this.socket, this.term.cols, this.term.rows);
      };
      // fires whenever FitAddon.fit()/term.resize() changes the geometry
      this.term.onResize(({ cols, rows }) => {
        this.consoleService.sendTerminalSize(this.socket, cols, rows);
      });

      const attachAddon = new AttachAddon(this.socket);
      this.term.loadAddon(attachAddon);
      this.xtermService.initTerminal(this.term, this.fitAddon);
      this.fitAddon.fit();
      this.term.focus();

      this.term.attachCustomKeyEventHandler((key: KeyboardEvent) => {
        if (key.code === 'KeyC' || key.code === 'KeyV') {
          if (key.ctrlKey && key.shiftKey) {
            return false;
          }
        }
        return true;
      });

      // Apply appearance settings whenever they change
      this.xtermService.settingsChanged$.pipe(takeUntil(this.destroy$)).subscribe(() => {
        this.xtermService.applySettingsToTerminal(this.term, this.fitAddon, this.cdr);
      });

      // Setup context menu for copy/paste
      this.contextMenuCleanup = this.contextMenuService.attachContextMenu(this.term, terminal.nativeElement);

      // Watch the container so the terminal re-fits when the browser window resizes.
      // Unlike the in-app console, this standalone page never receives
      // consoleResized events from the console wrapper.
      this.setupResizeObserver();
    }, 0);
  }

  /**
   * Setup ResizeObserver to automatically resize terminal when the container
   * (i.e. the browser window in this standalone page) changes size.
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
            this.fitAddon.fit();
          } catch (e) {
            // Ignore fit errors when element is not visible
          }
        });
      }
    });

    this.resizeObserver.observe(terminal.nativeElement);
  }

  // ─── Terminal appearance settings ───────────────────────────────────────────

  toggleSettingsPanel(): void {
    this.showSettingsPanelSignal.update((v) => !v);
    this.cdr.markForCheck();
  }

  closeSettingsPanel(): void {
    this.showSettingsPanelSignal.set(false);
    this.cdr.markForCheck();
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

    // Cleanup context menu event listeners
    if (this.contextMenuCleanup) {
      this.contextMenuCleanup();
      this.contextMenuCleanup = null;
    }

    // Cleanup ResizeObserver to prevent memory leaks
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }

    // Dispose terminal
    if (this.term) {
      this.term.dispose();
    }
  }
}
