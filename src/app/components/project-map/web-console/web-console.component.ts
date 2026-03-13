import { AfterViewInit, Component, ElementRef, Input, OnChanges, OnDestroy, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import { Terminal } from 'ghostty-web';
import { Subscription } from 'rxjs';
import { Node } from '../../../cartography/models/node';
import { Controller } from '@models/controller';
import { ConsoleResizedEvent, NodeConsoleService } from '@services/nodeConsole.service';
import { loadGhostty } from '@services/terminal/ghostty-loader';
import {
  applyGhosttyTheme,
  concatUint8Arrays,
  DEFAULT_CONSOLE_BACKGROUND_COLOR,
  DEFAULT_CONSOLE_FOREGROUND_COLOR,
  fitGhosttyToRenderedCanvas,
  TelnetIacStripper,
} from '@services/terminal/ghostty-console-helpers';

@Component({
  selector: 'app-web-console',
  templateUrl: './web-console.component.html',
  styleUrls: ['./web-console.component.scss'],
})
export class WebConsoleComponent implements OnInit, OnChanges, AfterViewInit, OnDestroy {
  private readonly autoPromptDelayMs = 250;

  @Input() controller!: Controller;
  @Input() node!: Node;
  @Input() foregroundColor: string = DEFAULT_CONSOLE_FOREGROUND_COLOR;
  @Input() backgroundColor: string = DEFAULT_CONSOLE_BACKGROUND_COLOR;

  public term!: Terminal;
  private socket!: WebSocket;
  private resizeSub!: Subscription;
  private resizeObserver!: ResizeObserver;
  private disposed: boolean = false;
  private telnetIacStripper: TelnetIacStripper = new TelnetIacStripper();
  private writeQueue: Uint8Array[] = [];
  private writeFlushPending = false;
  private readonly textEncoder = new TextEncoder();
  private autoPromptTimer: ReturnType<typeof setTimeout> | null = null;
  private hasVisibleOutputSinceConnect = false;
  private hasUserInputSinceConnect = false;

  @ViewChild('terminal') terminalEl!: ElementRef<HTMLElement>;

  constructor(private consoleService: NodeConsoleService) {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes.foregroundColor || changes.backgroundColor) {
      this.applyTerminalTheme();
    }
  }

  ngOnInit() {
    this.resizeSub = this.consoleService.consoleResized.subscribe((ev: ConsoleResizedEvent) => {
      this.safeResize(ev.width, ev.height);
    });
  }

  private safeResize(width?: number, height?: number) {
    if (!this.term || this.disposed) {
      return;
    }

    const terminalElement = this.terminalEl?.nativeElement;
    const targetWidth = width ?? (terminalElement ? terminalElement.clientWidth : 0);
    const targetHeight = height ?? (terminalElement ? terminalElement.clientHeight : 0);
    if (!terminalElement || targetWidth <= 0 || targetHeight <= 0) {
      return;
    }

    let cols = Math.max(2, Math.floor(targetWidth / this.consoleService.getLineWidth()));
    let rows = Math.max(1, Math.floor(targetHeight / this.consoleService.getLineHeight()));

    try {
      this.term.resize(cols, rows);
      ({ cols, rows } = fitGhosttyToRenderedCanvas(this.term, this.terminalEl.nativeElement, targetWidth, targetHeight, cols, rows));
      this.consoleService.setNumberOfColumns(cols);
      this.consoleService.setNumberOfRows(rows);
    } catch {}
  }

  ngAfterViewInit() {
    void this.initializeTerminal();
  }

  private async initializeTerminal() {
    try {
      const ghostty = await loadGhostty();

      if (this.disposed) {
        return;
      }

      this.term = new Terminal({
        ghostty,
        fontSize: 16,
        fontFamily: 'Monaco, Menlo, "Cascadia Mono", "DejaVu Sans Mono", "Courier New", monospace',
        cursorBlink: true,
        theme: {
          background: this.backgroundColor,
          foreground: this.foregroundColor,
          cursor: this.foregroundColor,
          selectionBackground: '#2f67c2',
          selectionForeground: '#ffffff',
        },
      });

      this.term.onResize(({ cols, rows }) => {
        this.consoleService.setNumberOfColumns(cols);
        this.consoleService.setNumberOfRows(rows);
      });

      this.term.open(this.terminalEl.nativeElement);
      this.applyTerminalTheme();

      const savedCols = this.consoleService.getNumberOfColumns();
      const savedRows = this.consoleService.getNumberOfRows();
      if (savedCols && savedRows) {
        try {
          this.term.resize(savedCols, savedRows);
        } catch {}
      }

      if (typeof ResizeObserver !== 'undefined') {
        this.resizeObserver = new ResizeObserver(() => this.safeResize());
        this.resizeObserver.observe(this.terminalEl.nativeElement);

        const parentElement = this.terminalEl.nativeElement.parentElement as HTMLElement;
        if (parentElement) {
          this.resizeObserver.observe(parentElement);
        }
      }

      requestAnimationFrame(() => this.safeResize());
      setTimeout(() => this.safeResize(), 50);

      this.openSocket();

      this.term.focus();
    } catch (error) {
      console.error('Failed to initialize web console terminal', error);
      this.terminalEl.nativeElement.textContent = 'Terminal initialization failed';
    }
  }

  private applyTerminalTheme() {
    applyGhosttyTheme(this.term, this.terminalEl?.nativeElement, {
      foregroundColor: this.foregroundColor,
      backgroundColor: this.backgroundColor,
    });
  }

  private openSocket() {
    this.socket = new WebSocket(this.consoleService.getUrl(this.controller, this.node));
    this.socket.binaryType = 'arraybuffer';

    this.socket.onopen = () => {
      this.hasVisibleOutputSinceConnect = false;
      this.hasUserInputSinceConnect = false;
      this.scheduleAutoPrompt();
    };

    this.socket.onerror = () => {
      if (this.disposed || !this.term) {
        return;
      }
      this.clearAutoPromptTimer();
      this.term.write('Connection lost\r\n');
    };

    this.socket.onclose = () => {
      this.clearAutoPromptTimer();
      if (!this.disposed) {
        this.consoleService.closeConsoleForNode(this.node);
      }
    };

    this.socket.onmessage = (event: MessageEvent<ArrayBuffer | Blob | string>) => {
      if (this.disposed || !this.term) {
        return;
      }

      if (event.data instanceof Blob) {
        void event.data
          .arrayBuffer()
          .then((buffer) => {
            if (this.disposed || !this.term) {
              return;
            }
            this.processIncomingData(new Uint8Array(buffer));
          })
          .catch(() => {});
        return;
      }

      const data =
        event.data instanceof ArrayBuffer
          ? new Uint8Array(event.data)
          : this.textEncoder.encode(String(event.data));

      this.processIncomingData(data);
    };

    this.term.onData((data: string) => {
      this.hasUserInputSinceConnect = true;
      if (!this.disposed && this.socket && this.socket.readyState === WebSocket.OPEN) {
        this.socket.send(data);
      }
    });
  }

  ngOnDestroy() {
    this.disposed = true;
    this.resizeSub?.unsubscribe();
    this.resizeObserver?.disconnect();
    this.closeSocket();
    this.term?.dispose();
  }

  private closeSocket() {
    if (!this.socket) {
      return;
    }

    this.clearAutoPromptTimer();
    this.socket.onmessage = null;
    this.socket.onerror = null;
    this.socket.onclose = null;
    this.socket.onopen = null;
    if (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING) {
      this.socket.close();
    }
  }

  private processIncomingData(data: Uint8Array) {
    const cleanData = this.telnetIacStripper.push(data);
    if (!cleanData.length) {
      return;
    }

    this.hasVisibleOutputSinceConnect = true;
    this.clearAutoPromptTimer();

    this.enqueueWrite(cleanData);
  }

  private scheduleAutoPrompt() {
    this.clearAutoPromptTimer();

    this.autoPromptTimer = setTimeout(() => {
      this.autoPromptTimer = null;

      if (this.disposed || !this.socket || this.socket.readyState !== WebSocket.OPEN) {
        return;
      }

      if (this.hasVisibleOutputSinceConnect || this.hasUserInputSinceConnect) {
        return;
      }

      this.socket.send('\r');
    }, this.autoPromptDelayMs);
  }

  private clearAutoPromptTimer() {
    if (this.autoPromptTimer !== null) {
      clearTimeout(this.autoPromptTimer);
      this.autoPromptTimer = null;
    }
  }

  private enqueueWrite(data: Uint8Array) {
    this.writeQueue.push(data);
    this.scheduleWriteFlush();
  }

  private scheduleWriteFlush() {
    if (this.writeFlushPending) {
      return;
    }

    this.writeFlushPending = true;

    requestAnimationFrame(() => {
      this.writeFlushPending = false;

      if (this.disposed || !this.term || this.writeQueue.length === 0) {
        return;
      }

      const writes = this.writeQueue;
      this.writeQueue = [];
      this.term.write(concatUint8Arrays(writes));
    });
  }
}
