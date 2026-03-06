import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { ToolCall } from '@models/ai-chat.interface';

/**
 * AI Chat Tool Call Display Component
 * Displays tool call information and parameters
 */
@Component({
  selector: 'app-tool-call-display',
  template: `
    <div class="tool-call-display" [class.executing]="isExecuting" [class.completed]="isCompleted">
      <div class="tool-call-header" (click)="toggleExpanded()">
        <mat-icon class="tool-icon">build</mat-icon>
        <span class="tool-name">{{ toolCall.function.name }}</span>
        <span class="tool-status" [class.status-accumulating]="isAccumulating" [class.status-ready]="isReady" [class.status-executing]="isExecuting" [class.status-completed]="isCompleted">
          <ng-container [ngSwitch]="status">
            <span *ngSwitchCase="'accumulating'">Accumulating...</span>
            <span *ngSwitchCase="'ready'">Ready</span>
            <span *ngSwitchCase="'executing'">Executing...</span>
            <span *ngSwitchCase="'completed'">Completed</span>
          </ng-container>
        </span>
        <button mat-icon-button class="toggle-button" (click)="toggleExpanded($event)">
          <mat-icon [class.rotated]="expanded">expand_more</mat-icon>
        </button>
      </div>

      <div class="tool-call-body" *ngIf="expanded" [@expandAnimation]>
        <div class="tool-arguments">
          <div class="arguments-header">
            <span class="arguments-label">Parameters:</span>
            <span class="arguments-status" *ngIf="isAccumulating">{{ accumulatedPercentage }}%</span>
          </div>
          <pre class="arguments-content" [class.loading]="isAccumulating"><code>{{ formattedArguments }}</code></pre>
          <mat-progress-bar *ngIf="isAccumulating" mode="indeterminate" class="arguments-progress"></mat-progress-bar>
        </div>

        <div class="tool-result" *ngIf="toolOutput">
          <div class="result-header">
            <mat-icon class="result-icon">check_circle</mat-icon>
            <span class="result-label">Result:</span>
          </div>
          <pre class="result-content"><code>{{ formattedToolOutput }}</code></pre>
        </div>

        <div class="tool-error" *ngIf="error">
          <div class="error-header">
            <mat-icon class="error-icon">error</mat-icon>
            <span class="error-label">Error:</span>
          </div>
          <div class="error-message">{{ error }}</div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .tool-call-display {
      margin: 8px 0;
      border: 1px solid var(--mat-app-outline-color);
      border-radius: 8px;
      background-color: var(--mat-app-surface-container-low);
      overflow: hidden;
      transition: all 0.3s ease;
    }

    .tool-call-header {
      display: flex;
      align-items: center;
      padding: 12px;
      cursor: pointer;
      user-select: none;
      background-color: var(--mat-app-surface-container);
      transition: background-color 0.2s;
    }

    .tool-call-header:hover {
      background-color: var(--mat-app-surface-container-high);
    }

    .tool-icon {
      margin-right: 8px;
      color: var(--mat-app-primary);
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .tool-name {
      flex: 1;
      font-weight: 500;
      font-size: 14px;
      color: var(--mat-app-on-surface);
      font-family: monospace;
    }

    .tool-status {
      margin-right: 12px;
      padding: 4px 8px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 500;
    }

    .tool-status.status-accumulating {
      background-color: var(--mat-app-tertiary-container);
      color: var(--mat-app-on-tertiary-container);
    }

    .tool-status.status-ready {
      background-color: var(--mat-app-primary-container);
      color: var(--mat-app-on-primary-container);
    }

    .tool-status.status-executing {
      background-color: var(--mat-app-secondary-container);
      color: var(--mat-app-on-secondary-container);
      animation: pulse 1.5s ease-in-out infinite;
    }

    .tool-status.status-completed {
      background-color: var(--mat-app-success-background, #e8f5e9);
      color: var(--mat-app-success-on-background, #2e7d32);
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.7; }
    }

    .toggle-button {
      width: 32px;
      height: 32px;
      padding: 0;
    }

    .toggle-button mat-icon {
      transition: transform 0.3s ease;
    }

    .toggle-button mat-icon.rotated {
      transform: rotate(180deg);
    }

    .tool-call-body {
      padding: 12px;
      border-top: 1px solid var(--mat-app-outline-variant);
    }

    .tool-arguments {
      margin-bottom: 12px;
    }

    .arguments-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }

    .arguments-label {
      font-size: 12px;
      font-weight: 500;
      color: var(--mat-app-on-surface-variant);
    }

    .arguments-status {
      font-size: 11px;
      color: var(--mat-app-primary);
      font-weight: 500;
    }

    .arguments-content {
      margin: 0;
      padding: 8px;
      background-color: var(--mat-app-surface-container-high);
      border-radius: 4px;
      font-size: 12px;
      line-height: 1.5;
      overflow-x: auto;
      max-height: 200px;
      overflow-y: auto;
    }

    .arguments-content.loading {
      opacity: 0.7;
    }

    .arguments-content code {
      font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
      color: var(--mat-app-on-surface);
    }

    .arguments-progress {
      margin-top: 8px;
    }

    .tool-result {
      padding: 8px;
      background-color: var(--mat-app-success-container, #e8f5e9);
      border-radius: 4px;
    }

    .result-header {
      display: flex;
      align-items: center;
      margin-bottom: 8px;
    }

    .result-icon {
      margin-right: 6px;
      color: var(--mat-app-success-on-container, #2e7d32);
      font-size: 16px;
      width: 16px;
      height: 16px;
    }

    .result-label {
      font-size: 12px;
      font-weight: 500;
      color: var(--mat-app-success-on-container, #2e7d32);
    }

    .result-content {
      margin: 0;
      padding: 8px;
      background-color: var(--mat-app-surface);
      border-radius: 4px;
      font-size: 12px;
      line-height: 1.5;
      overflow-x: auto;
      max-height: 200px;
      overflow-y: auto;
    }

    .result-content code {
      font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
      color: var(--mat-app-on-surface);
      white-space: pre-wrap;
      word-break: break-all;
    }

    .tool-error {
      padding: 8px;
      background-color: var(--mat-app-error-container, #ffebee);
      border-radius: 4px;
    }

    .error-header {
      display: flex;
      align-items: center;
      margin-bottom: 8px;
    }

    .error-icon {
      margin-right: 6px;
      color: var(--mat-app-error-on-container, #c62828);
      font-size: 16px;
      width: 16px;
      height: 16px;
    }

    .error-label {
      font-size: 12px;
      font-weight: 500;
      color: var(--mat-app-error-on-container, #c62828);
    }

    .error-message {
      padding: 8px;
      background-color: var(--mat-app-surface);
      border-radius: 4px;
      font-size: 12px;
      color: var(--mat-app-error-on-container, #c62828);
      line-height: 1.5;
    }

    /* Scrollbar styles */
    ::-webkit-scrollbar {
      width: 8px;
      height: 8px;
    }

    ::-webkit-scrollbar-track {
      background: var(--mat-app-surface-container);
    }

    ::-webkit-scrollbar-thumb {
      background: var(--mat-app-outline-variant);
      border-radius: 4px;
    }

    ::-webkit-scrollbar-thumb:hover {
      background: var(--mat-app-outline);
    }
  `]
})
export class ToolCallDisplayComponent implements OnChanges {
  @Input() toolCall: ToolCall;
  @Input() toolOutput?: string;
  @Input() error?: string;
  @Input() isExecuting = false;

  expanded = true;
  accumulatedPercentage = 0;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.toolCall) {
      this.calculateAccumulatedPercentage();
    }
  }

  /**
   * Get tool status
   */
  get status(): 'accumulating' | 'ready' | 'executing' | 'completed' {
    if (this.isExecuting) {
      return 'executing';
    }
    if (this.toolOutput || this.error) {
      return 'completed';
    }
    if (this.toolCall?.function?.complete) {
      return 'ready';
    }
    return 'accumulating';
  }

  /**
   * Check if parameters are accumulating
   */
  get isAccumulating(): boolean {
    return !this.toolCall?.function?.complete;
  }

  /**
   * Check if parameters are complete
   */
  get isReady(): boolean {
    return this.toolCall?.function?.complete && !this.isExecuting && !this.toolOutput && !this.error;
  }

  /**
   * Check if completed
   */
  get isCompleted(): boolean {
    return !!(this.toolOutput || this.error);
  }

  /**
   * Formatted parameters string
   */
  get formattedArguments(): string {
    if (!this.toolCall?.function?.arguments) {
      return '// Waiting for parameters...';
    }

    try {
      const args = this.toolCall.function.arguments;
      // Try to format as JSON
      if (args.startsWith('{') || args.startsWith('[')) {
        return JSON.stringify(JSON.parse(args), null, 2);
      }
      return args;
    } catch (e) {
      return this.toolCall.function.arguments;
    }
  }

  /**
   * Formatted tool output
   */
  get formattedToolOutput(): string {
    if (!this.toolOutput) {
      return '';
    }

    try {
      // Try to format as JSON
      if (this.toolOutput.startsWith('{') || this.toolOutput.startsWith('[')) {
        return JSON.stringify(JSON.parse(this.toolOutput), null, 2);
      }
      return this.toolOutput;
    } catch (e) {
      return this.toolOutput;
    }
  }

  /**
   * Toggle expanded/collapsed state
   * @param event Event object
   */
  toggleExpanded(event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.expanded = !this.expanded;
  }

  /**
   * Calculate parameters accumulation percentage (estimated)
   */
  private calculateAccumulatedPercentage(): void {
    if (!this.toolCall?.function?.arguments) {
      this.accumulatedPercentage = 0;
      return;
    }

    // This is a rough estimate based on parameter length
    // Actual percentage may need adjustment based on specific cases
    const argsLength = this.toolCall.function.arguments.length;

    if (argsLength < 50) {
      this.accumulatedPercentage = 20;
    } else if (argsLength < 100) {
      this.accumulatedPercentage = 40;
    } else if (argsLength < 200) {
      this.accumulatedPercentage = 60;
    } else if (argsLength < 500) {
      this.accumulatedPercentage = 80;
    } else {
      this.accumulatedPercentage = 95;
    }

    if (this.toolCall.function.complete) {
      this.accumulatedPercentage = 100;
    }
  }
}
