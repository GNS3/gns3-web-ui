import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Output,
  effect,
  inject,
  input,
  signal,
  viewChild,
  DestroyRef,
} from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { ResizableDirective } from 'angular-resizable-element';
import { FloatingWindowResizeHandlesComponent } from '../../floating-window/floating-window-resize-handles.component';
import { Node } from '../../../cartography/models/node';
import { Controller } from '@models/controller';
import { NodeFileManagerPageComponent } from '../node-file-manager-page/node-file-manager-page.component';
import { WindowManagementService } from '@services/window-management.service';
import { FloatingWindowChrome } from '../../floating-window/floating-window-chrome';

@Component({
  standalone: true,
  selector: 'app-node-file-manager-inline',
  templateUrl: './node-file-manager-inline.component.html',
  styleUrl: './node-file-manager-inline.component.scss',
  imports: [CommonModule, MatIconModule, MatButtonModule, ResizableDirective, FloatingWindowResizeHandlesComponent, NodeFileManagerPageComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NodeFileManagerInlineComponent {
  private readonly DEFAULT_WIDTH = 900;
  private readonly DEFAULT_HEIGHT = 600;
  private readonly DEFAULT_LEFT = 120;
  private readonly DEFAULT_TOP = 80;
  private readonly MIN_WIDTH = 600;
  private readonly MIN_HEIGHT = 400;

  readonly node = input<Node>();
  readonly controller = input<Controller>();
  readonly zIndex = input<number>(1000);

  @Output() closeWindow = new EventEmitter<void>();
  @Output() windowFocused = new EventEmitter<void>();

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

  private isMinimizedSignal = signal(false);

  public readonly isDragging = this.chrome.dragging;
  public readonly isResizing = this.chrome.resizing;
  public readonly isMinimized = this.isMinimizedSignal.asReadonly();

  private windowManagement = inject(WindowManagementService);
  private cdr = inject(ChangeDetectorRef);
  private router = inject(Router);

  readonly windowWrapper = viewChild<ElementRef>('windowWrapper');

  constructor() {
    effect(() => {
      const node = this.node();
      if (!node) return;
      const id = this.getWindowId();
      const minimized = this.windowManagement.minimizedWindows();
      if (minimized.some(w => w.id === id) && !this.isMinimizedSignal()) {
        this.isMinimizedSignal.set(true);
      } else if (!minimized.some(w => w.id === id) && this.isMinimizedSignal()) {
        this.isMinimizedSignal.set(false);
      }
    });
    // Suspend the embedded page's pointer events while a window gesture is
    // live so its controls never steal the mouse mid-drag/mid-resize.
    effect(() => {
      this.setContentPointerEvents(this.chrome.dragging() || this.chrome.resizing() ? 'none' : '');
    });
  }

  private getWindowId(): string {
    return `filemgr-${this.node()?.node_id}`;
  }

  close(): void {
    this.windowManagement.restoreWindow(this.getWindowId());
    this.closeWindow.emit();
  }

  toggleMinimize(): void {
    const node = this.node();
    if (!node) return;
    this.windowManagement.toggleMinimize(this.getWindowId(), 'filemgr');
    this.cdr.markForCheck();
  }

  onWindowFocus(): void {
    if (this.isMinimizedSignal()) {
      this.toggleMinimize();
      return;
    }
    this.windowFocused.emit();
    this.cdr.markForCheck();
  }

  private setContentPointerEvents(value: string): void {
    const windowElement = this.windowWrapper()?.nativeElement;
    if (!windowElement) return;
    const page = windowElement.querySelector('app-node-file-manager-page') as HTMLElement;
    if (page) {
      page.style.pointerEvents = value;
    }
  }

  openInNewTab(): void {
    const node = this.node();
    const controller = this.controller();
    if (!node || !controller) return;

    const url = this.router.createUrlTree([
      '/controller',
      controller.id,
      'project',
      node.project_id,
      'nodes',
      node.node_id,
      'files'
    ], {
      queryParams: {
        name: node.name
      }
    });

    const fullUrl = window.location.origin + this.router.serializeUrl(url);
    window.open(fullUrl, '_blank');
  }
}
