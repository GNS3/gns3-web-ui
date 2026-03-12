import { Component, ElementRef, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
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

@Component({
  encapsulation: ViewEncapsulation.None,
  selector: 'app-web-console-full-window',
  templateUrl: './web-console-full-window.component.html',
  styleUrls: ['../../../../node_modules/xterm/css/xterm.css', './web-console-full-window.component.scss'],
})
export class WebConsoleFullWindowComponent implements OnInit {
  private controllerId: string;
  private projectId: string;
  private nodeId: string;
  private subscriptions: Subscription = new Subscription();
  private controller: Controller;
  private node: GNS3Node;

  public term: Terminal = new Terminal({
    rightClickSelectsWord: true,  // Enable right-click to select word
    altClickMovesCursor: true,    // Enable Alt+Click to move cursor
  });
  public fitAddon: FitAddon = new FitAddon();

  @ViewChild('terminal') terminal: ElementRef;

  constructor(
    private consoleService: NodeConsoleService,
    private controllerService: ControllerService,
    private route: ActivatedRoute,
    private title: Title,
    private nodeService: NodeService,
    private themeService: ThemeService
  ) {}

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

    this.controllerService.get(+this.controllerId).then((controller: Controller ) => {
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
      this.term.open(this.terminal.nativeElement);
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
      this.setupContextMenu();

      let numberOfColumns = Math.round(window.innerWidth / this.consoleService.getLineWidth());
      let numberOfRows = Math.round(window.innerHeight / this.consoleService.getLineHeight());
      this.term.resize(numberOfColumns, numberOfRows);
    }, 0);
  }

  /**
   * Setup context menu for copy/paste operations
   */
  private setupContextMenu(): void {
    const terminalElement = this.terminal?.nativeElement;
    if (!terminalElement) return;

    // Handle context menu event
    terminalElement.addEventListener('contextmenu', (event: MouseEvent) => {
      event.preventDefault();

      const selection = this.term.getSelection();
      const hasSelection = selection && selection.length > 0;

      // Get current theme
      const currentTheme = this.themeService.getActualTheme();
      const themeClass = currentTheme === 'light' ? 'light-theme' : 'dark-theme';

      // Create context menu
      const contextMenu = document.createElement('div');
      contextMenu.className = `xterm-context-menu ${themeClass}`;
      contextMenu.style.position = 'absolute';
      contextMenu.style.left = `${event.clientX}px`;
      contextMenu.style.top = `${event.clientY}px`;
      contextMenu.style.zIndex = '10000';

      // Copy menu item
      if (hasSelection) {
        const copyItem = document.createElement('div');
        copyItem.className = 'xterm-context-menu-item';
        copyItem.textContent = 'Copy';
        copyItem.addEventListener('click', () => {
          navigator.clipboard.writeText(selection).then(() => {
            // Successfully copied - no terminal output needed
            this.term.focus();
          });
          contextMenu.remove();
        });
        contextMenu.appendChild(copyItem);
      }

      // Paste menu item
      const pasteItem = document.createElement('div');
      pasteItem.className = 'xterm-context-menu-item';
      pasteItem.textContent = 'Paste';
      pasteItem.addEventListener('click', () => {
        navigator.clipboard.readText().then((text) => {
          this.term.paste(text);
        });
        contextMenu.remove();
      });
      contextMenu.appendChild(pasteItem);

      // Select all menu item
      const selectAllItem = document.createElement('div');
      selectAllItem.className = 'xterm-context-menu-item';
      selectAllItem.textContent = 'Select All';
      selectAllItem.addEventListener('click', () => {
        this.term.selectAll();
        contextMenu.remove();
      });
      contextMenu.appendChild(selectAllItem);

      // Clear selection menu item
      if (hasSelection) {
        const clearSelectionItem = document.createElement('div');
        clearSelectionItem.className = 'xterm-context-menu-item';
        clearSelectionItem.textContent = 'Clear Selection';
        clearSelectionItem.addEventListener('click', () => {
          this.term.clearSelection();
          contextMenu.remove();
        });
        contextMenu.appendChild(clearSelectionItem);
      }

      // Add to document
      document.body.appendChild(contextMenu);

      // Remove menu on click outside
      const removeMenu = (e: MouseEvent) => {
        if (!contextMenu.contains(e.target as globalThis.Node)) {
          contextMenu.remove();
          document.removeEventListener('click', removeMenu);
          document.removeEventListener('keydown', handleEscape);
          this.term.focus();
        }
      };

      // Remove menu on Escape key
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          contextMenu.remove();
          document.removeEventListener('click', removeMenu);
          document.removeEventListener('keydown', handleEscape);
          this.term.focus();
        }
      };

      setTimeout(() => {
        document.addEventListener('click', removeMenu);
        document.addEventListener('keydown', handleEscape);
      }, 0);
    });
  }
}
