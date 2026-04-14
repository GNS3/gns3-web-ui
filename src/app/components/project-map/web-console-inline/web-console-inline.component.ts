import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  HostListener,
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
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Subject } from 'rxjs';
import { takeUntil, tap, switchMap } from 'rxjs/operators';
import { fromEvent } from 'rxjs';
import { ResizeEvent, ResizableDirective, ResizeHandleDirective } from 'angular-resizable-element';
import { Node } from '../../../cartography/models/node';
import { Project } from '@models/project';
import { Controller } from '@models/controller';
import { WindowBoundaryService, WindowStyle } from '@services/window-boundary.service';
import { ToasterService } from '@services/toaster.service';
import { WindowManagementService } from '@services/window-management.service';

@Component({
  selector: 'app-web-console-inline',
  templateUrl: './web-console-inline.component.html',
  styleUrl: './web-console-inline.component.scss',
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    ResizableDirective,
    ResizeHandleDirective,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WebConsoleInlineComponent implements OnInit, OnDestroy {
  // Constants
  private readonly DEFAULT_WIDTH = 800;
  private readonly DEFAULT_HEIGHT = 600;
  private readonly DEFAULT_LEFT = '100px';
  private readonly DEFAULT_TOP = '100px';
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

  // Window state
  public style: WindowStyle = {
    position: 'fixed',
    left: this.DEFAULT_LEFT,
    top: this.DEFAULT_TOP,
    width: `${this.DEFAULT_WIDTH}px`,
    height: `${this.DEFAULT_HEIGHT}px`,
  };

  public resizedWidth: number = this.DEFAULT_WIDTH;
  public resizedHeight: number = this.DEFAULT_HEIGHT;

  // UI state
  private isDraggingSignal = signal(false);
  private isResizingSignal = signal(false);
  private isLoadingSignal = signal(true);
  private isMinimizedSignal = signal(false);

  public readonly isDragging = this.isDraggingSignal.asReadonly();
  public readonly isResizing = this.isResizingSignal.asReadonly();
  public readonly isLoading = this.isLoadingSignal.asReadonly();
  public readonly isMinimized = this.isMinimizedSignal.asReadonly();

  // Console URL
  public consoleUrl: SafeResourceUrl = '';

  private boundaryService = inject(WindowBoundaryService);
  private toasterService = inject(ToasterService);
  private cdr = inject(ChangeDetectorRef);
  private renderer = inject(Renderer2);
  private sanitizer = inject(DomSanitizer);
  private windowManagement = inject(WindowManagementService);

  // Drag state
  private dragStartX = 0;
  private dragStartY = 0;
  private dragStartLeft = 0;
  private dragStartTop = 0;

  readonly windowWrapper = viewChild<ElementRef>('windowWrapper');

  constructor() {
    // Effect to sync with WindowManagementService minimize state
    effect(() => {
      const node = this.node();
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
  }

  ngOnInit() {
    // Set top offset to keep window below toolbar
    const toolbarHeight = window.innerWidth <= 768 ? 56 : 64;
    this.boundaryService.setConfig({ topOffset: toolbarHeight });

    // Build console URL
    this.consoleUrl = this.buildConsoleUrl();

    // Setup drag handling
    this.setupDragHandling();
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
    return `/assets/vnc-console/index.html?${params.toString()}`;
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
   * Validate resize constraints
   */
  validate(event: ResizeEvent): boolean {
    if (
      event.rectangle.width &&
      event.rectangle.height &&
      (event.rectangle.width < this.MIN_WIDTH || event.rectangle.height < this.MIN_HEIGHT)
    ) {
      return false;
    }
    return true;
  }

  /**
   * Handle resize start
   */
  onResizeStart(): void {
    this.isResizingSignal.set(true);
    // Disable iframe pointer events during resize
    this.setIframePointerEvents('none');
    this.cdr.markForCheck();
  }

  /**
   * Handle resize end
   */
  onResizeEnd(event: ResizeEvent): void {
    const constrained = this.boundaryService.constrainResizeSize(
      event.rectangle.width || this.resizedWidth,
      event.rectangle.height || this.resizedHeight,
      event.rectangle.left,
      event.rectangle.top
    );

    this.style = {
      position: 'fixed',
      left: `${constrained.left}px`,
      top: `${constrained.top}px`,
      width: `${constrained.width}px`,
      height: `${constrained.height}px`,
    };

    this.resizedWidth = constrained.width;
    this.resizedHeight = constrained.height;

    this.applyStyleToElement();

    // Restore iframe pointer events and clear resizing state
    this.isResizingSignal.set(false);
    this.setIframePointerEvents('');
    this.cdr.markForCheck();
  }

  /**
   * Apply style directly to DOM element
   */
  private applyStyleToElement(): void {
    const element = this.windowWrapper()?.nativeElement;
    if (!element) return;

    if (this.style.position) {
      this.renderer.setStyle(element, 'position', this.style.position);
    }
    if (this.style.left) {
      this.renderer.setStyle(element, 'left', this.style.left);
    }
    if (this.style.top) {
      this.renderer.setStyle(element, 'top', this.style.top);
    }
    if (this.style.width) {
      this.renderer.setStyle(element, 'width', this.style.width);
    }
    if (this.style.height) {
      this.renderer.setStyle(element, 'height', this.style.height);
    }
  }

  /**
   * Setup drag handling using RxJS
   */
  private setupDragHandling(): void {
    const windowElement = this.windowWrapper()?.nativeElement;
    if (!windowElement) return;

    const headerElement = windowElement.querySelector('.web-console-inline-header') as HTMLElement;
    if (!headerElement) return;

    const mouseDown$ = fromEvent<MouseEvent>(headerElement, 'mousedown');
    const mouseMove$ = fromEvent<MouseEvent>(document, 'mousemove');
    const mouseUp$ = fromEvent<MouseEvent>(document, 'mouseup');

    mouseDown$
      .pipe(
        tap((e) => {
          e.preventDefault();
          this.isDraggingSignal.set(true);
          this.cdr.markForCheck();

          this.dragStartX = e.clientX;
          this.dragStartY = e.clientY;
          this.dragStartLeft = Number(this.style.left?.split('px')[0]) || 0;
          this.dragStartTop = Number(this.style.top?.split('px')[0]) || 0;

          // Disable iframe pointer events during drag
          this.setIframePointerEvents('none');
        }),
        switchMap(() =>
          mouseMove$.pipe(
            takeUntil(
              mouseUp$.pipe(
                tap(() => {
                  this.onDragEnd();
                })
              )
            )
          )
        ),
        takeUntil(this.destroy$)
      )
      .subscribe((e) => {
        const deltaX = e.clientX - this.dragStartX;
        const deltaY = e.clientY - this.dragStartY;

        let newLeft = this.dragStartLeft + deltaX;
        let newTop = this.dragStartTop + deltaY;

        // Constrain to viewport
        const width = this.resizedWidth;
        const height = this.resizedHeight;
        const maxLeft = window.innerWidth - width;
        const topOffset = this.boundaryService.getConfigValue().topOffset || 0;
        const maxTop = window.innerHeight - height - topOffset;

        newLeft = Math.max(0, Math.min(maxLeft, newLeft));
        newTop = Math.max(topOffset, Math.min(maxTop, newTop));

        // Apply directly to DOM
        this.renderer.setStyle(windowElement, 'left', `${newLeft}px`);
        this.renderer.setStyle(windowElement, 'top', `${newTop}px`);

        // Keep state in sync
        this.style.left = `${newLeft}px`;
        this.style.top = `${newTop}px`;
      });
  }

  /**
   * Handle drag end
   */
  private onDragEnd(): void {
    this.isDraggingSignal.set(false);
    this.setIframePointerEvents('');
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

  /**
   * Handle window resize events
   */
  @HostListener('window:resize')
  onWindowResize(): void {
    // Re-constrain window position to stay within viewport
    this.style = this.boundaryService.constrainWindowPosition(this.style);
    this.applyStyleToElement();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
