import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, OnChanges, SimpleChanges, ViewChild, ElementRef, HostListener, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatRippleModule } from '@angular/material/core';
import { ToolCall } from '@models/ai-chat.interface';
import { JsonViewerComponent } from './json-viewer.component';

/**
 * Draggable Dialog Component
 * Displays tool call or tool result details in a draggable floating panel
 * Inspired by FlowNet-Lab implementation
 */
@Component({
  selector: 'app-draggable-tool-dialog',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatRippleModule, JsonViewerComponent],
  template: `
    <div
      *ngIf="isOpen"
      class="draggable-dialog-overlay"
      [style.transform]="transform"
      [style.width.px]="size.width"
      [style.zIndex]="9999"
    >
      <div
        class="draggable-dialog"
        [class.is-dragging]="isDragging"
        [style.cursor]="isDragging ? 'grabbing' : 'default'"
      >
        <!-- Header - Draggable -->
        <div
          class="dialog-header"
          (mousedown)="startDrag($event)"
          title="Drag to move"
        >
          <div class="header-content">
            <button
              class="icon-button"
              (click)="close.emit()"
              matRipple
              title="Close"
            >
              <mat-icon>close</mat-icon>
            </button>
            <span class="header-title">{{ title }}</span>
            <span class="header-hint">(Drag header to move)</span>
          </div>
          <button
            class="icon-button"
            (click)="close.emit()"
            matRipple
            title="Close"
          >
            <mat-icon>close</mat-icon>
          </button>
        </div>

        <!-- Content -->
        <div class="dialog-content">
          <!-- Tool Call Content -->
          <ng-container *ngIf="type === 'tool_call' && toolCall">
            <div class="info-section">
              <div class="info-label">Function:</div>
              <div class="info-value">{{ toolCall.function.name }}</div>
            </div>
            <div class="info-section">
              <div class="info-label">Arguments:</div>
              <div class="json-container">
                <app-json-viewer [data]="parsedArguments"></app-json-viewer>
              </div>
            </div>
          </ng-container>

          <!-- Tool Result Content -->
          <ng-container *ngIf="type === 'tool_result'">
            <div class="info-section">
              <div class="info-label">Tool:</div>
              <div class="info-value">{{ toolName }}</div>
            </div>
            <div class="info-section">
              <div class="info-label">Output:</div>
              <div class="json-container">
                <app-json-viewer [data]="parsedOutput"></app-json-viewer>
              </div>
            </div>
          </ng-container>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .draggable-dialog-overlay {
      position: fixed;
      top: 0;
      left: 0;
      will-change: transform;
    }

    .draggable-dialog {
      background: var(--mat-app-surface);
      border: 1px solid var(--mat-app-outline-variant);
      border-radius: 12px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
      overflow: hidden;
      transition: box-shadow 0.2s ease;
    }

    .draggable-dialog:hover {
      box-shadow: 0 15px 50px rgba(0, 0, 0, 0.25);
    }

    .draggable-dialog.is-dragging {
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    }

    .dialog-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      background: linear-gradient(to bottom, var(--mat-app-surface), var(--mat-app-surface-container-low));
      border-bottom: 1px solid var(--mat-app-outline-variant);
      cursor: grab;
      user-select: none;
    }

    .dialog-header:active {
      cursor: grabbing;
    }

    .header-content {
      display: flex;
      align-items: center;
      gap: 8px;
      flex: 1;
    }

    .header-title {
      font-size: 14px;
      font-weight: 500;
      color: var(--mat-app-on-surface);
    }

    .header-hint {
      font-size: 11px;
      color: var(--mat-app-on-surface-variant);
      opacity: 0.7;
      margin-left: 8px;
    }

    .icon-button {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      border: none;
      background: transparent;
      border-radius: 8px;
      cursor: pointer;
      color: var(--mat-app-on-surface-variant);
      transition: all 0.2s ease;
      padding: 0;
    }

    .icon-button:hover {
      background: var(--mat-app-surface-container-high);
      color: var(--mat-app-on-surface);
    }

    .icon-button mat-icon {
      width: 18px;
      height: 18px;
      font-size: 18px;
    }

    .dialog-content {
      padding: 16px;
      max-height: 400px;
      overflow-y: auto;
      background: var(--mat-app-background);
    }

    /* Custom scrollbar for dialog content */
    .dialog-content::-webkit-scrollbar {
      width: 8px;
    }

    .dialog-content::-webkit-scrollbar-track {
      background: transparent;
    }

    .dialog-content::-webkit-scrollbar-thumb {
      background: var(--mat-app-outline-variant);
      border-radius: 4px;
    }

    .dialog-content::-webkit-scrollbar-thumb:hover {
      background: var(--mat-app-outline);
    }

    .info-section {
      margin-bottom: 16px;
    }

    .info-section:last-child {
      margin-bottom: 0;
    }

    .info-label {
      font-size: 11px;
      font-weight: 500;
      color: var(--mat-app-on-surface-variant);
      margin-bottom: 6px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .info-value {
      font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
      font-size: 13px;
      color: var(--mat-app-on-surface);
      background: var(--mat-app-surface-container-low);
      padding: 8px 12px;
      border-radius: 6px;
      word-break: break-all;
    }

    .code-block {
      background: var(--mat-app-surface-container-low);
      border-radius: 6px;
      padding: 12px;
      overflow-x: auto;
    }

    .code-block pre {
      margin: 0;
      font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
      font-size: 12px;
      line-height: 1.6;
      color: var(--mat-app-on-surface);
      white-space: pre-wrap;
      word-break: break-all;
    }

    .json-container {
      background: var(--mat-app-surface-container-low);
      border-radius: 6px;
      padding: 12px;
      overflow-x: auto;
      max-height: 400px;
      overflow-y: auto;
    }

    /* Syntax highlighting for JSON */
    .code-block pre .key {
      color: #0451a5;
    }

    .code-block pre .string {
      color: #a31515;
    }

    .code-block pre .number {
      color: #098658;
    }

    .code-block pre .boolean {
      color: #0000ff;
    }

    .code-block pre .null {
      color: #808080;
    }
  `]
})
export class DraggableToolDialogComponent implements OnInit, OnDestroy, OnChanges {
  @Input() isOpen = false;
  @Input() type: 'tool_call' | 'tool_result' = 'tool_call';
  @Input() toolCall?: ToolCall;
  @Input() toolName?: string;
  @Input() toolOutput?: any;
  @Input() initialPosition = { top: 100, left: 100 };

  @Output() close = new EventEmitter<void>();

  position = { top: 100, left: 100 };
  size = { width: 700 };

  isDragging = false;
  dragOffset = { x: 0, y: 0 };
  animationFrameId: number | null = null;

  parsedArguments: any = null;
  parsedOutput: any = null;

  get title(): string {
    return this.type === 'tool_call' ? 'Tool Call Details' : 'Execution Result Details';
  }

  get transform(): string {
    return `translate3d(${this.position.left}px, ${this.position.top}px, 0)`;
  }

  constructor(private ngZone: NgZone) {}

  ngOnInit() {
    this.position = { ...this.initialPosition };
    this.parseJsonData();
  }

  ngOnChanges() {
    this.parseJsonData();
  }

  private parseJsonData() {
    // Parse tool call arguments
    if (this.toolCall?.function?.arguments) {
      try {
        const args = this.toolCall.function.arguments;

        // Handle both string and object formats
        if (typeof args === 'string') {
          // String format - parse it
          this.parsedArguments = JSON.parse(args);
        } else if (args.tool_input && typeof args.tool_input === 'string') {
          // Object format with tool_input wrapper - parse the inner string
          this.parsedArguments = JSON.parse(args.tool_input);
        } else {
          // Object format without wrapper - use as-is
          this.parsedArguments = args;
        }
      } catch (e) {
        // If all parsing fails, keep the original value
        this.parsedArguments = this.toolCall.function.arguments;
      }
    }

    // Parse tool output
    if (this.toolOutput) {
      if (typeof this.toolOutput === 'string') {
        try {
          this.parsedOutput = JSON.parse(this.toolOutput);
        } catch (e) {
          this.parsedOutput = this.toolOutput;
        }
      } else {
        this.parsedOutput = this.toolOutput;
      }
    }
  }

  ngOnDestroy() {
    this.cleanupDragListeners();
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }

  startDrag(event: MouseEvent) {
    // Only start drag if clicking on header (not on buttons)
    if ((event.target as HTMLElement).closest('.icon-button')) {
      return;
    }

    this.isDragging = true;
    this.dragOffset = {
      x: event.clientX - this.position.left,
      y: event.clientY - this.position.top
    };

    // Add global listeners outside Angular zone for better performance
    this.ngZone.runOutsideAngular(() => {
      document.addEventListener('mousemove', this.onDrag);
      document.addEventListener('mouseup', this.stopDrag);
    });
  }

  private onDrag = (event: MouseEvent) => {
    if (!this.isDragging) return;

    event.preventDefault();

    // Cancel any pending animation frame
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }

    // Use requestAnimationFrame for smooth updates
    this.animationFrameId = requestAnimationFrame(() => {
      let newX = event.clientX - this.dragOffset.x;
      let newY = event.clientY - this.dragOffset.y;

      // Relax viewport constraints - allow more freedom
      // Only keep at least 50px visible to prevent losing the dialog
      const maxX = window.innerWidth - 50;
      const maxY = window.innerHeight - 50;

      // Allow negative values to move dialog partially off-screen
      newX = Math.min(newX, maxX);
      newY = Math.min(newY, maxY);

      // Update position (will trigger change detection once per frame)
      this.ngZone.run(() => {
        this.position = { left: newX, top: newY };
      });
    });
  };

  private stopDrag = () => {
    this.isDragging = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    this.cleanupDragListeners();
  };

  private cleanupDragListeners() {
    this.ngZone.runOutsideAngular(() => {
      document.removeEventListener('mousemove', this.onDrag);
      document.removeEventListener('mouseup', this.stopDrag);
    });
  }
}
