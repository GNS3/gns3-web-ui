import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  HostListener,
  Output,
  OnDestroy,
  OnInit,
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
import { fromEvent, animationFrameScheduler } from 'rxjs';
import { ResizeEvent, ResizableDirective, ResizeHandleDirective } from 'angular-resizable-element';
import { Link } from '@models/link';
import { Project } from '@models/project';
import { Controller } from '@models/controller';
import { WindowBoundaryService, WindowStyle } from '@services/window-boundary.service';
import { XpraConsoleService } from '@services/xpra-console.service';
import { ToasterService } from '@services/toaster.service';

@Component({
  selector: 'app-web-wireshark-inline',
  templateUrl: './web-wireshark-inline.component.html',
  styleUrl: './web-wireshark-inline.component.scss',
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    ResizableDirective,
    ResizeHandleDirective,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WebWiresharkInlineComponent implements OnInit, OnDestroy {
  // Constants
  private readonly DEFAULT_WIDTH = 800;
  private readonly DEFAULT_HEIGHT = 600;
  private readonly DEFAULT_LEFT = '100px';
  private readonly DEFAULT_TOP = '100px';
  private readonly MIN_WIDTH = 400;
  private readonly MIN_HEIGHT = 300;

  private destroy$ = new Subject<void>();
  readonly link = input.required<Link>();
  readonly controller = input.required<Controller>();
  readonly project = input.required<Project>();
  readonly zIndex = input<number>(1000);
  @Output() closeWindow = new EventEmitter<void>();
  @Output() windowFocused = new EventEmitter<void>();

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

  public readonly isDragging = this.isDraggingSignal.asReadonly();
  public readonly isResizing = this.isResizingSignal.asReadonly();
  public readonly isLoading = this.isLoadingSignal.asReadonly();

  // Wireshark URL
  public wiresharkUrl: SafeResourceUrl = '';

  private xpraConsoleService = inject(XpraConsoleService);
  private boundaryService = inject(WindowBoundaryService);
  private toasterService = inject(ToasterService);
  private cdr = inject(ChangeDetectorRef);
  private renderer = inject(Renderer2);
  private sanitizer = inject(DomSanitizer);

  // Drag state
  private dragStartX = 0;
  private dragStartY = 0;
  private dragStartLeft = 0;
  private dragStartTop = 0;

  readonly windowWrapper = viewChild<ElementRef>('windowWrapper');

  constructor() {}

  ngOnInit() {
    // Set top offset to keep window below toolbar
    const toolbarHeight = window.innerWidth <= 768 ? 56 : 64;
    this.boundaryService.setConfig({ topOffset: toolbarHeight });

    // Build Wireshark URL
    this.wiresharkUrl = this.buildWiresharkUrl();

    // Setup drag handling
    this.setupDragHandling();
  }

  /**
   * Build Web Wireshark URL from link and controller
   */
  private buildWiresharkUrl(): SafeResourceUrl {
    const link = this.link();
    const controller = this.controller();

    const wsUrl = this.xpraConsoleService.buildXpraWebSocketUrlForWebWireshark(controller, link);
    const pageUrl = this.xpraConsoleService.buildXpraConsolePageUrl(wsUrl);

    console.log('[WebWiresharkInline] Wireshark URL:', pageUrl);

    // Mark URL as safe for iframe src
    return this.sanitizer.bypassSecurityTrustResourceUrl(pageUrl);
  }

  /**
   * Handle iframe load event
   */
  onIframeLoad(): void {
    console.log('[WebWiresharkInline] Iframe loaded');
    this.isLoadingSignal.set(false);
    this.cdr.markForCheck();
  }

  /**
   * Close window
   */
  close(): void {
    this.closeWindow.emit();
  }

  /**
   * Handle window focus (bring to front)
   */
  onWindowFocus(): void {
    this.windowFocused.emit();
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
    console.log('[WebWiresharkInline] Resize end:', {
      rectangle: event.rectangle
    });

    const constrained = this.boundaryService.constrainResizeSize(
      event.rectangle.width || this.resizedWidth,
      event.rectangle.height || this.resizedHeight,
      event.rectangle.left,
      event.rectangle.top
    );

    console.log('[WebWiresharkInline] Constrained:', constrained);

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

    console.log('[WebWiresharkInline] Style applied:', this.style);

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

    const headerElement = windowElement.querySelector('.web-wireshark-inline-header') as HTMLElement;
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
