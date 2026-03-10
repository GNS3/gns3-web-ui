import { AfterViewInit, Component, ElementRef, Input, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { Terminal } from 'xterm';
import { AttachAddon } from 'xterm-addon-attach';
import { FitAddon } from 'xterm-addon-fit';
import { Node } from '../../../cartography/models/node';
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
export class WebConsoleComponent implements OnInit, AfterViewInit {
  @Input() controller: Controller;
  @Input() project: Project;
  @Input() node: Node;

  public term: Terminal = new Terminal();
  public fitAddon: FitAddon = new FitAddon();
  public isLightThemeEnabled: boolean = false;
  private copiedText: string = '';

  @ViewChild('terminal') terminal: ElementRef;

  constructor(private consoleService: NodeConsoleService, private themeService: ThemeService) {}

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
}
