import { Component, ElementRef, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { Terminal } from 'ghostty-web';
import { Node } from '../../cartography/models/node';
import { Controller } from '@models/controller';
import { NodeService } from '@services/node.service';
import { NodeConsoleService } from '@services/nodeConsole.service';
import { ControllerService } from '@services/controller.service';
import { loadGhostty } from '@services/terminal/ghostty-loader';
import {
  applyGhosttyTheme,
  concatUint8Arrays,
  CONSOLE_COLORS_STORAGE_KEY,
  DEFAULT_CONSOLE_BACKGROUND_COLOR,
  DEFAULT_CONSOLE_FOREGROUND_COLOR,
  fitGhosttyToRenderedCanvas,
  loadConsoleColors,
  TelnetIacStripper,
} from '@services/terminal/ghostty-console-helpers';

@Component({
  encapsulation: ViewEncapsulation.None,
  selector: 'app-web-console-full-window',
  templateUrl: './web-console-full-window.component.html',
})
export class WebConsoleFullWindowComponent implements OnInit, OnDestroy {
  private readonly autoPromptDelayMs = 250;

  private controllerId!: string;
  private projectId!: string;
  private nodeId!: string;
  private subscriptions: Subscription = new Subscription();
  private controller!: Controller;
  private node!: Node;
  private socket!: WebSocket;
  private resizeObserver!: ResizeObserver;
  private isDestroying: boolean = false;
  private telnetIacStripper: TelnetIacStripper = new TelnetIacStripper();
  private writeQueue: Uint8Array[] = [];
  private writeFlushPending = false;
  private readonly textEncoder = new TextEncoder();
  private autoPromptTimer: ReturnType<typeof setTimeout> | null = null;
  private hasVisibleOutputSinceConnect = false;
  private hasUserInputSinceConnect = false;
  public foregroundColor: string = DEFAULT_CONSOLE_FOREGROUND_COLOR;
  public backgroundColor: string = DEFAULT_CONSOLE_BACKGROUND_COLOR;
  private readonly onStorageChanged = (event: StorageEvent) => {
    if (event.key !== CONSOLE_COLORS_STORAGE_KEY) {
      return;
    }

    const colors = loadConsoleColors();
    this.foregroundColor = colors.foregroundColor;
    this.backgroundColor = colors.backgroundColor;
    this.applyTerminalTheme();
  };

  public term!: Terminal;

  @ViewChild('terminal') terminal!: ElementRef<HTMLElement>;

  constructor(
    private consoleService: NodeConsoleService,
    private controllerService: ControllerService,
    private route: ActivatedRoute,
    private title: Title,
    private nodeService: NodeService
  ) {}

  ngOnInit() {
    const colors = loadConsoleColors();
    this.foregroundColor = colors.foregroundColor;
    this.backgroundColor = colors.backgroundColor;
    window.addEventListener('storage', this.onStorageChanged);

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

  ngOnDestroy() {
    this.isDestroying = true;
    window.removeEventListener('storage', this.onStorageChanged);
    this.subscriptions.unsubscribe();
    this.resizeObserver?.disconnect();
    this.closeSocket();
    this.term?.dispose();
  }

  getData() {
    this.controllerId = this.route.snapshot.paramMap.get('controller_id');
    this.projectId = this.route.snapshot.paramMap.get('project_id');
    this.nodeId = this.route.snapshot.paramMap.get('node_id');

    this.controllerService.get(+this.controllerId).then((controller: Controller) => {
      this.controller = controller;
      this.subscriptions.add(
        this.nodeService.getNodeById(this.controller, this.projectId, this.nodeId).subscribe((node: Node) => {
          this.node = node;
          this.title.setTitle(this.node.name);
          this.openTerminal();
        })
      );
    });
  }

  openTerminal() {
    setTimeout(() => {
      void this.initializeTerminal();
    }, 0);
  }

  private async initializeTerminal() {
    try {
      if (this.term) {
        return;
      }

      const ghostty = await loadGhostty();

      if (this.isDestroying) {
        return;
      }

      this.term = new Terminal({
        ghostty,
        cursorBlink: true,
        fontSize: 16,
        fontFamily: 'Monaco, Menlo, "Cascadia Mono", "DejaVu Sans Mono", "Courier New", monospace',
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

      this.term.open(this.terminal.nativeElement);
      this.applyTerminalTheme();

      if (typeof ResizeObserver !== 'undefined') {
        this.resizeObserver = new ResizeObserver(() => this.safeResize());
        this.resizeObserver.observe(this.terminal.nativeElement);

        const parentElement = this.terminal.nativeElement.parentElement as HTMLElement;
        if (parentElement) {
          this.resizeObserver.observe(parentElement);
        }
      }

      requestAnimationFrame(() => this.safeResize());
      setTimeout(() => this.safeResize(), 50);

      this.socket = new WebSocket(this.consoleService.getUrl(this.controller, this.node));
      this.socket.binaryType = 'arraybuffer';

      this.socket.onopen = () => {
        this.hasVisibleOutputSinceConnect = false;
        this.hasUserInputSinceConnect = false;
        this.scheduleAutoPrompt();
      };

      this.socket.onerror = () => {
        if (!this.isDestroying && this.term) {
          this.clearAutoPromptTimer();
          this.term.write('Connection lost\r\n');
        }
      };

      this.socket.onclose = () => {
        this.clearAutoPromptTimer();
        if (!this.isDestroying && this.term) {
          this.term.write('Connection closed\r\n');
        }
      };

      this.socket.onmessage = (event: MessageEvent<ArrayBuffer | Blob | string>) => {
        if (this.isDestroying || !this.term) {
          return;
        }

        if (event.data instanceof Blob) {
          void event.data
            .arrayBuffer()
            .then((buffer) => {
              if (this.isDestroying || !this.term) {
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
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
          this.socket.send(data);
        }
      });

      this.term.focus();
    } catch (error) {
      console.error('Failed to initialize full-window terminal', error);
      this.terminal.nativeElement.textContent = 'Terminal initialization failed';
    }
  }

  private applyTerminalTheme() {
    applyGhosttyTheme(this.term, this.terminal?.nativeElement, {
      foregroundColor: this.foregroundColor,
      backgroundColor: this.backgroundColor,
    });
  }

  private safeResize(width?: number, height?: number) {
    if (!this.term || this.isDestroying) {
      return;
    }

    const terminalElement = this.terminal?.nativeElement;
    const targetWidth = width ?? (terminalElement ? terminalElement.clientWidth : 0);
    const targetHeight = height ?? (terminalElement ? terminalElement.clientHeight : 0);
    if (!terminalElement || targetWidth <= 0 || targetHeight <= 0) {
      return;
    }

    let cols = Math.max(2, Math.floor(targetWidth / this.consoleService.getLineWidth()));
    let rows = Math.max(1, Math.floor(targetHeight / this.consoleService.getLineHeight()));

    try {
      this.term.resize(cols, rows);
      ({ cols, rows } = fitGhosttyToRenderedCanvas(this.term, this.terminal.nativeElement, targetWidth, targetHeight, cols, rows));
    } catch {}
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

      if (this.isDestroying || !this.socket || this.socket.readyState !== WebSocket.OPEN) {
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

      if (this.isDestroying || !this.term || this.writeQueue.length === 0) {
        return;
      }

      const writes = this.writeQueue;
      this.writeQueue = [];
      this.term.write(concatUint8Arrays(writes));
    });
  }
}
