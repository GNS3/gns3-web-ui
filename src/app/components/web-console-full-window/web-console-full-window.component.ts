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
import { Subscription } from 'rxjs';
import { Terminal } from 'xterm';
import { AttachAddon } from 'xterm-addon-attach';
import { FitAddon } from 'xterm-addon-fit';
import { Node as GNS3Node } from '../../cartography/models/node';
import { Controller } from '@models/controller';
import { NodeService } from '@services/node.service';
import { NodeConsoleService } from '@services/nodeConsole.service';
import { ControllerService } from '@services/controller.service';
import { ThemeService } from '@services/theme.service';
import { XtermContextMenuService } from '@services/xterm-context-menu.service';
import { XtermService } from '@services/xterm.service';

@Component({
  selector: 'app-web-console-full-window',
  templateUrl: './web-console-full-window.component.html',
  styleUrls: ['./web-console-full-window.component.scss'],
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WebConsoleFullWindowComponent implements OnInit, OnDestroy {
  private controllerId: string;
  private projectId: string;
  private nodeId: string;
  private subscriptions: Subscription = new Subscription();
  private controller: Controller;
  private node: GNS3Node;
  private contextMenuCleanup: (() => void) | null = null;
  private themeSubscription: Subscription | null = null;

  public term: Terminal = new Terminal({
    cursorBlink: true,
    cursorStyle: 'block',
    fontSize: 15,
    fontFamily: 'courier-new, courier, monospace',
    rightClickSelectsWord: true, // Enable right-click to select word
    altClickMovesCursor: true, // Enable Alt+Click to move cursor
    scrollback: 1000,
  });
  public fitAddon: FitAddon = new FitAddon();

  readonly terminal = viewChild<ElementRef>('terminal');

  private consoleService = inject(NodeConsoleService);
  private controllerService = inject(ControllerService);
  private route = inject(ActivatedRoute);
  private title = inject(Title);
  private nodeService = inject(NodeService);
  private themeService = inject(ThemeService);
  private contextMenuService = inject(XtermContextMenuService);
  private cdr = inject(ChangeDetectorRef);
  private xtermService = inject(XtermService);

  constructor() {}

  ngOnInit() {
    // Subscribe to theme changes
    this.themeSubscription = this.themeService.themeChanged.subscribe(() => {
      this.xtermService.updateTerminalTheme(this.term, this.cdr);
    });

    if (this.controllerService.isServiceInitialized) {
      this.getData();
    } else {
      this.subscriptions.add(
        this.controllerService.serviceInitialized.subscribe((val) => {
          if (val) this.getData();
        })
      );
    }
  }

  getData() {
    this.controllerId = this.route.snapshot.paramMap.get('controller_id');
    this.projectId = this.route.snapshot.paramMap.get('project_id');
    this.nodeId = this.route.snapshot.paramMap.get('node_id');

    this.consoleService.consoleResized.subscribe((ev) => {
      this.fitAddon.fit();
    });

    this.controllerService.get(+this.controllerId).then((controller: Controller) => {
      this.controller = controller;
      this.nodeService.getNodeById(this.controller, this.projectId, this.nodeId).subscribe((node: GNS3Node) => {
        this.node = node;
        this.title.setTitle(this.node.name);
        this.openTerminal();
      });
    });
  }

  openTerminal() {
    setTimeout(() => {
      const terminal = this.terminal();
      this.term.open(terminal.nativeElement);

      // Set theme based on current Material Design 3 theme
      this.xtermService.updateTerminalTheme(this.term, this.cdr);

      const socket = new WebSocket(this.consoleService.getUrl(this.controller, this.node));

      socket.onerror = (event) => {
        console.error('[WebConsoleFullWindow] Socket connection error');
        this.term.write('\r\n\x1b[31mConnection lost. Please check if the node is still running.\x1b[0m\r\n');
      };
      socket.onclose = (event) => {
        console.log('[WebConsoleFullWindow] Socket closed:', event.code, event.reason);
        this.term.write('\r\n\x1b[33mConnection closed.\x1b[0m\r\n');
      };

      const attachAddon = new AttachAddon(socket);
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
    // Cleanup theme subscription
    if (this.themeSubscription) {
      this.themeSubscription.unsubscribe();
      this.themeSubscription = null;
    }

    // Cleanup subscriptions
    if (this.subscriptions) {
      this.subscriptions.unsubscribe();
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
