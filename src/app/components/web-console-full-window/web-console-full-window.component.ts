import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnInit,
  OnDestroy,
  inject,
  viewChild,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
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

@Component({
  selector: 'app-web-console-full-window',
  templateUrl: './web-console-full-window.component.html',
  styleUrl: './web-console-full-window.component.scss',
  imports: [CommonModule],
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

      // Setup context menu for copy/paste
      this.contextMenuCleanup = this.contextMenuService.attachContextMenu(this.term, terminal.nativeElement);
    }, 0);
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

    // Dispose terminal
    if (this.term) {
      this.term.dispose();
    }
  }
}
