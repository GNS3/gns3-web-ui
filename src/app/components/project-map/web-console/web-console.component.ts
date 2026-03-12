import { AfterViewInit, Component, ElementRef, Input, OnInit, OnDestroy, ViewChild, ViewEncapsulation, ChangeDetectorRef } from '@angular/core';
import { Terminal } from 'xterm';
import { AttachAddon } from 'xterm-addon-attach';
import { FitAddon } from 'xterm-addon-fit';
import { Node as GNS3Node } from '../../../cartography/models/node';
import { Project } from '@models/project';
import { Controller } from '@models/controller';
import { NodeConsoleService } from '@services/nodeConsole.service';
import { ThemeService } from '@services/theme.service';

@Component({
  encapsulation: ViewEncapsulation.None,
  selector: 'app-web-console',
  templateUrl: './web-console.component.html',
  styleUrls: ['../../../../../node_modules/xterm/css/xterm.css', './web-console.component.scss'],
})
export class WebConsoleComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() controller: Controller;
  @Input() project: Project;
  @Input() node: GNS3Node;

  public term: Terminal = new Terminal({
    cols: 100,
    rows: 32,
    cursorBlink: true,
    rightClickSelectsWord: true,  // Enable right-click to select word
    altClickMovesCursor: true,    // Enable Alt+Click to move cursor
  });
  public fitAddon: FitAddon = new FitAddon();
  public isLightThemeEnabled: boolean = false;
  private copiedText: string = '';
  private resizeObserver: ResizeObserver | null = null;

  @ViewChild('terminal') terminal: ElementRef;

  constructor(
    private consoleService: NodeConsoleService,
    private themeService: ThemeService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.themeService.getActualTheme() === 'light'
      ? (this.isLightThemeEnabled = true)
      : (this.isLightThemeEnabled = false);

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
    this.term.open(this.terminal.nativeElement);
    if (this.isLightThemeEnabled)
      this.term.setOption('theme', { background: 'white', foreground: 'black', cursor: 'black' });

    const socket = new WebSocket(this.consoleService.getUrl(this.controller, this.node));

    socket.onerror = (event) => {
      this.term.write('Connection lost');
    };
    socket.onclose = (event) => {
      this.consoleService.closeConsoleForNode(this.node);
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
          bubbles: true
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
    this.setupContextMenu();
  }

  /**
   * Setup ResizeObserver to automatically resize terminal when container size changes
   */
  private setupResizeObserver(): void {
    if (!this.terminal?.nativeElement) return;

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

    this.resizeObserver.observe(this.terminal.nativeElement);
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

      // Focus back to terminal after menu interaction
      const focusTerminal = () => {
        this.term.focus();
      };

      // Remove menu on click outside
      const removeMenu = (e: MouseEvent) => {
        if (!contextMenu.contains(e.target as globalThis.Node)) {
          contextMenu.remove();
          document.removeEventListener('click', removeMenu);
          document.removeEventListener('keydown', handleEscape);
          focusTerminal();
        }
      };

      // Remove menu on Escape key
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          contextMenu.remove();
          document.removeEventListener('click', removeMenu);
          document.removeEventListener('keydown', handleEscape);
          focusTerminal();
        }
      };

      setTimeout(() => {
        document.addEventListener('click', removeMenu);
        document.addEventListener('keydown', handleEscape);
      }, 0);
    });
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

    // Dispose terminal
    this.term.dispose();
  }
}
