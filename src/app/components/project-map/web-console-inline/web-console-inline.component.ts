import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  OnDestroy,
  OnInit,
  Output,
  effect,
  inject,
  input,
  viewChild,
  ElementRef,
  Renderer2,
  signal,
  DestroyRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ResizableDirective } from 'angular-resizable-element';
import { FloatingWindowResizeHandlesComponent } from '../../floating-window/floating-window-resize-handles.component';
import { Node } from '../../../cartography/models/node';
import { Project } from '@models/project';
import { Controller } from '@models/controller';
import { ToasterService } from '@services/toaster.service';
import { WindowManagementService } from '@services/window-management.service';
import { FloatingWindowChrome } from '../../floating-window/floating-window-chrome';

@Component({
  selector: 'app-web-console-inline',
  templateUrl: './web-console-inline.component.html',
  styleUrl: './web-console-inline.component.scss',
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    ResizableDirective,
    FloatingWindowResizeHandlesComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WebConsoleInlineComponent implements OnInit, OnDestroy {
  // Constants
  private readonly DEFAULT_WIDTH = 1024;
  private readonly DEFAULT_HEIGHT = 768;
  private readonly DEFAULT_LEFT = 100;
  private readonly DEFAULT_TOP = 100;
  private readonly MIN_WIDTH = 400;
  private readonly MIN_HEIGHT = 300;

  private destroy$ = new Subject<void>();
  readonly node = input.required<Node>();
  readonly controller = input.required<Controller>();
  readonly project = input.required<Project>();
  readonly zIndex = input<number>(1000);

  @Output() closeWindow = new EventEmitter<void>();
  @Output() windowFocused = new EventEmitter<void>();
  @Output() windowMinimized = new EventEmitter<boolean>(); // true = minimized, false = restored

  // ---- floating-window chrome (the shared standard controller) ----

  readonly chrome = new FloatingWindowChrome(
    {
      minWidth: this.MIN_WIDTH,
      minHeight: this.MIN_HEIGHT,
      defaultRect: { left: this.DEFAULT_LEFT, top: this.DEFAULT_TOP, width: this.DEFAULT_WIDTH, height: this.DEFAULT_HEIGHT },
      // Project-toolbar clearance; live-responsive (narrow viewports get the
      // compact toolbar).
      topOffset: () => (typeof window === 'undefined' ? 0 : window.innerWidth <= 768 ? 56 : 64),
    },
    inject(DestroyRef)
  );

  // UI state
  private isLoadingSignal = signal(true);
  private isMinimizedSignal = signal(false);

  public readonly isDragging = this.chrome.dragging;
  public readonly isResizing = this.chrome.resizing;
  public readonly isLoading = this.isLoadingSignal.asReadonly();
  public readonly isMinimized = this.isMinimizedSignal.asReadonly();

  // Console URL
  public consoleUrl: SafeResourceUrl = '';

  private toasterService = inject(ToasterService);
  private cdr = inject(ChangeDetectorRef);
  private renderer = inject(Renderer2);
  private sanitizer = inject(DomSanitizer);
  private windowManagement = inject(WindowManagementService);

  readonly windowWrapper = viewChild<ElementRef>('windowWrapper');

  constructor() {
    effect(() => {
      const minimizedWindows = this.windowManagement.minimizedWindows();
      const windowId = this.getWindowId();
      const isInMinimizedList = minimizedWindows.some(w => w.id === windowId);

      if (isInMinimizedList && !this.isMinimizedSignal()) {
        // Window should be minimized
        this.isMinimizedSignal.set(true);
      } else if (!isInMinimizedList && this.isMinimizedSignal()) {
        // Window should be restored
        this.isMinimizedSignal.set(false);
      }
    });
    // The console iframe swallows mouse events — suspend its pointer events
    // while a window gesture is live.
    effect(() => {
      this.setIframePointerEvents(this.chrome.dragging() || this.chrome.resizing() ? 'none' : '');
    });
  }

  ngOnInit() {
    // Adjust window size based on node's console_resolution
    this.adjustWindowSizeFromConsoleResolution();

    // Build console URL
    this.consoleUrl = this.buildConsoleUrl();
  }

  /**
   * Adjust window size based on node's console_resolution property
   * Follows the same pattern as VncConsoleService.openVncConsole()
   */
  private adjustWindowSizeFromConsoleResolution(): void {
    const node = this.node();

    // Add padding for browser chrome (title bar, borders, etc.)
    const windowPadding = 10;
    let windowWidth = this.DEFAULT_WIDTH;
    let windowHeight = this.DEFAULT_HEIGHT;

    if (node.properties) {
      const props = node.properties as any;
      if (props.console_resolution) {
        const resolution = props.console_resolution;
        const parts = resolution.split('x');
        if (parts.length === 2) {
          const width = parseInt(parts[0], 10);
          const height = parseInt(parts[1], 10);

          if (!isNaN(width) && !isNaN(height)) {
            windowWidth = width + windowPadding;
            windowHeight = height + windowPadding;
            this.chrome.place({
              left: this.DEFAULT_LEFT,
              top: this.DEFAULT_TOP,
              width: windowWidth,
              height: windowHeight,
            });
          }
        }
      }
    }
  }

  /**
   * Get unique window ID for this instance
   */
  private getWindowId(): string {
    return `console-${this.node().node_id}`;
  }

  /**
   * Build console URL from node and controller
   */
  private buildConsoleUrl(): SafeResourceUrl {
    const node = this.node();
    const controller = this.controller();

    if (node.console_type === 'vnc') {
      // VNC console: use standalone HTML page
      const wsUrl = this.buildVncWebSocketUrl(controller, node);
      const pageUrl = this.buildVncConsolePageUrl(wsUrl, node);
      return this.sanitizer.bypassSecurityTrustResourceUrl(pageUrl);
    } else if (node.console_type && node.console_type.startsWith('http')) {
      // HTTP/HTTPS console: direct URL
      let host = node.console_host;
      if (host === '0.0.0.0' || host === '0:0:0:0:0:0:0:0' || host === '::') {
        host = controller.host;
      }
      const uri = `${node.console_type}://${host}:${node.console}`;
      return this.sanitizer.bypassSecurityTrustResourceUrl(uri);
    }

    // Telnet and other types not supported in inline mode
    this.toasterService.error(`Console type '${node.console_type}' is not supported in inline mode.`);
    return '';
  }

  /**
   * Build WebSocket URL for VNC console
   */
  private buildVncWebSocketUrl(controller: Controller, node: Node): string {
    const protocol = controller.protocol === 'https:' ? 'wss' : 'ws';
    return `${protocol}://${controller.host}:${controller.port}/v3/projects/${node.project_id}/nodes/${node.node_id}/console/vnc?token=${controller.authToken}`;
  }

  /**
   * Build URL for standalone VNC console HTML page
   */
  private buildVncConsolePageUrl(wsUrl: string, node: Node): string {
    const params = new URLSearchParams({
      ws_url: wsUrl,
      node_name: node.name,
      node_id: node.node_id,
      project_id: node.project_id,
      autoconnect: '1',
    });
    return `assets/vnc-console/index.html?${params.toString()}`;
  }

  /**
   * Handle iframe load event
   */
  onIframeLoad(): void {
    this.isLoadingSignal.set(false);
    this.cdr.markForCheck();
  }

  /**
   * Close window
   */
  close(): void {
    // Remove from minimized list if present
    this.windowManagement.restoreWindow(this.getWindowId());
    this.closeWindow.emit();
  }

  /**
   * Toggle minimize state
   */
  toggleMinimize(): void {
    this.windowManagement.toggleMinimize(this.getWindowId(), 'console', this.node().node_id);
    this.cdr.markForCheck();
  }

  /**
   * Handle window focus (bring to front)
   */
  onWindowFocus(): void {
    // If minimized, restore on focus
    if (this.isMinimizedSignal()) {
      this.toggleMinimize();
      return;
    }
    this.windowFocused.emit();
    this.cdr.markForCheck();
  }

  /**
   * Set pointer events on iframes
   */
  private setIframePointerEvents(value: 'none' | ''): void {
    const windowElement = this.windowWrapper()?.nativeElement;
    if (!windowElement) return;

    windowElement.querySelectorAll('iframe').forEach((iframe: HTMLElement) => {
      this.renderer.setStyle(iframe, 'pointer-events', value);
    });
  }


  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
