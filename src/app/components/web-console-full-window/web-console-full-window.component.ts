import { ChangeDetectionStrategy, Component, ElementRef, OnInit, OnDestroy, ViewEncapsulation, inject, viewChild } from '@angular/core';
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

@Component({
  encapsulation: ViewEncapsulation.None,
  selector: 'app-web-console-full-window',
  templateUrl: './web-console-full-window.component.html',
  styleUrls: ['../../../../node_modules/xterm/css/xterm.css', './web-console-full-window.component.scss'],
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

  public term: Terminal = new Terminal({
    rightClickSelectsWord: true, // Enable right-click to select word
    altClickMovesCursor: true, // Enable Alt+Click to move cursor
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

  constructor() {}

  ngOnInit() {
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
      const socket = new WebSocket(this.consoleService.getUrl(this.controller, this.node));

      socket.onerror = (event) => {
        this.term.write('Connection lost' + '\r\n');
      };
      socket.onclose = (event) => {
        this.term.write('Connection closed' + '\r\n');
      };

      const attachAddon = new AttachAddon(socket);
      this.term.loadAddon(attachAddon);
      this.term.setOption('cursorBlink', true);
      this.term.loadAddon(this.fitAddon);
      this.fitAddon.activate(this.term);
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

      let numberOfColumns = Math.round(window.innerWidth / this.consoleService.getLineWidth());
      let numberOfRows = Math.round(window.innerHeight / this.consoleService.getLineHeight());
      this.term.resize(numberOfColumns, numberOfRows);
    }, 0);
  }

  /**
   * Cleanup on component destroy
   */
  ngOnDestroy(): void {
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
