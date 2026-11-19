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
import { Link } from '@models/link';
import { Project } from '@models/project';
import { Controller } from '@models/controller';
import { XpraConsoleService } from '@services/xpra-console.service';
import { FloatingWindowChrome } from '../../floating-window/floating-window-chrome';
import { ToasterService } from '@services/toaster.service';
import { WindowManagementService } from '@services/window-management.service';
import { LinkService } from '@services/link.service';

@Component({
  selector: 'app-web-wireshark-inline',
  templateUrl: './web-wireshark-inline.component.html',
  styleUrl: './web-wireshark-inline.component.scss',
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    ResizableDirective,
    FloatingWindowResizeHandlesComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WebWiresharkInlineComponent implements OnInit, OnDestroy {
  // Constants
  private readonly DEFAULT_WIDTH = 800;
  private readonly DEFAULT_HEIGHT = 600;
  private readonly DEFAULT_LEFT = 100;
  private readonly DEFAULT_TOP = 100;
  private readonly MIN_WIDTH = 800;
  private readonly MIN_HEIGHT = 600;
  private readonly MAX_WIDTH = 1920;
  private readonly MAX_HEIGHT = 1080;

  private destroy$ = new Subject<void>();
  readonly link = input.required<Link>();
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
      maxWidth: this.MAX_WIDTH,
      maxHeight: this.MAX_HEIGHT,
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
  private isRestartingSignal = signal(false);
  private isDownloadingSignal = signal(false);

  public readonly isDragging = this.chrome.dragging;
  public readonly isResizing = this.chrome.resizing;
  public readonly isLoading = this.isLoadingSignal.asReadonly();
  public readonly isMinimized = this.isMinimizedSignal.asReadonly();
  public readonly isRestarting = this.isRestartingSignal.asReadonly();
  public readonly isDownloading = this.isDownloadingSignal.asReadonly();

  // Wireshark URL
  public wiresharkUrl: SafeResourceUrl = '';

  private xpraConsoleService = inject(XpraConsoleService);
  private toasterService = inject(ToasterService);
  private cdr = inject(ChangeDetectorRef);
  private renderer = inject(Renderer2);
  private sanitizer = inject(DomSanitizer);
  private windowManagement = inject(WindowManagementService);
  private linkService = inject(LinkService);

  readonly windowWrapper = viewChild<ElementRef>('windowWrapper');

  constructor() {
    // Effect to sync with WindowManagementService minimize state
    effect(() => {
      const link = this.link();
      const minimizedWindows = this.windowManagement.minimizedWindows();
      const windowId = `wireshark-${link?.link_id}`;
      const isInMinimizedList = minimizedWindows.some(w => w.id === windowId);

      if (isInMinimizedList && !this.isMinimizedSignal()) {
        // Window should be minimized
        this.isMinimizedSignal.set(true);
      } else if (!isInMinimizedList && this.isMinimizedSignal()) {
        // Window should be restored
        this.isMinimizedSignal.set(false);
      }
    });
    // The wireshark iframe swallows mouse events — suspend its pointer
    // events while a window gesture is live.
    effect(() => {
      this.setIframePointerEvents(this.chrome.dragging() || this.chrome.resizing() ? 'none' : '');
    });
  }

  ngOnInit() {
    // Build Wireshark URL
    this.wiresharkUrl = this.buildWiresharkUrl();
  }

  /**
   * Get unique window ID for this instance
   */
  private getWindowId(): string {
    return `wireshark-${this.link().link_id}`;
  }

  /**
   * Build Web Wireshark URL from link and controller
   */
  private buildWiresharkUrl(): SafeResourceUrl {
    const link = this.link();
    const controller = this.controller();

    const wsUrl = this.xpraConsoleService.buildXpraWebSocketUrlForWebWireshark(controller, link);
    const pageUrl = this.xpraConsoleService.buildXpraConsolePageUrl(wsUrl);

    // Mark URL as safe for iframe src
    return this.sanitizer.bypassSecurityTrustResourceUrl(pageUrl);
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
    this.windowManagement.toggleMinimize(this.getWindowId(), 'wireshark', this.link().link_id);
    this.cdr.markForCheck();
  }

  /**
   * Restart Web Wireshark capture
   */
  restartWireshark(): void {
    if (this.isRestartingSignal()) {
      return;
    }

    this.isRestartingSignal.set(true);
    this.cdr.markForCheck();

    this.linkService.restartWiresharkCapture(this.controller(), this.link()).subscribe({
      next: (response) => {
        this.isRestartingSignal.set(false);

        // Reload the iframe by triggering a new URL build
        this.wiresharkUrl = this.buildWiresharkUrl();
        this.isLoadingSignal.set(true);
        this.cdr.markForCheck();
      },
      error: (error) => {
        this.isRestartingSignal.set(false);
        this.toasterService.error(`Failed to restart Web Wireshark: ${error.message || error.detail || 'Unknown error'}`);
        this.cdr.markForCheck();
      },
    });
  }

  /**
   * Download pcap file
   */
  downloadPcapFile(): void {
    if (this.isDownloadingSignal()) {
      return;
    }

    this.isDownloadingSignal.set(true);
    this.cdr.markForCheck();

    this.linkService.downloadPcap(this.controller(), this.link()).subscribe({
      next: (blob: Blob) => {
        // Create download link and trigger download
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const fileName = this.link().capture_file_name || 'capture';
        a.download = fileName.endsWith('.pcap') ? fileName : `${fileName}.pcap`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        this.isDownloadingSignal.set(false);
        this.toasterService.success('Pcap file downloaded successfully');
        this.cdr.markForCheck();
      },
      error: (error) => {
        this.isDownloadingSignal.set(false);
        const message = error.error?.message || error.message || 'Failed to download pcap file';
        this.toasterService.error(`Failed to download pcap file: ${message}`);
        this.cdr.markForCheck();
      },
    });
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
