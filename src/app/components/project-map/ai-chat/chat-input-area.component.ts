import { Component, Output, EventEmitter, Input, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatRippleModule } from '@angular/material/core';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';

/**
 * AI Chat Input Area Component
 * Provides auto-resizing text input and send button
 * Inspired by FlowNet-Lab ChatInput component
 */
@Component({
  selector: 'app-chat-input-area',
  template: `
    <div class="chat-input-area">
      <div class="input-wrapper">
        <textarea
          #messageInput
          [placeholder]="placeholder"
          [disabled]="disabled"
          [(ngModel)]="message"
          (keydown.enter)="handleKeyDown($event)"
          (input)="onInputChange()"
          [rows]="1"
          [maxLength]="maxLength"
          class="chat-textarea"
          [style.height.px]="textareaHeight"
        ></textarea>

        <button
          class="send-button"
          (click)="sendMessage()"
          [disabled]="!canSend || disabled"
          matRipple
        >
          <mat-icon *ngIf="!disabled; else loadingIcon">send</mat-icon>
          <ng-template #loadingIcon>
            <mat-icon class="loading-spinner">refresh</mat-icon>
          </ng-template>
        </button>
      </div>

      <div class="input-footer" *ngIf="showCharCount">
        <span class="char-count" [class.warning]="isNearLimit">{{ message.length }}</span>
        <span class="char-separator"> / </span>
        <span class="char-max">{{ maxLength }}</span>
      </div>
    </div>
  `,
  styles: [`
    .chat-input-area {
      display: flex;
      flex-direction: column;
      padding: 16px;
      background: linear-gradient(to bottom, var(--mat-app-background), var(--mat-app-surface-container-low));
      border-top: 1px solid var(--mat-app-outline-variant);
    }

    .input-wrapper {
      display: flex;
      gap: 12px;
      align-items: flex-end;
      width: 100%;
    }

    .chat-textarea {
      flex: 1;
      min-width: 0;
      min-height: 48px;
      max-height: 200px;
      padding: 12px 16px;
      border: 2px solid var(--mat-app-outline-variant);
      border-radius: 24px;
      background: linear-gradient(to bottom, var(--mat-app-surface), var(--mat-app-surface-container-low));
      color: var(--mat-app-on-surface);
      font-family: inherit;
      font-size: 14px;
      line-height: 1.5;
      resize: none;
      outline: none;
      transition: all 0.2s ease;
      box-sizing: border-box;
      overflow-y: auto;
    }

    .chat-textarea:focus {
      border-color: var(--mat-app-primary);
      box-shadow: 0 0 0 4px rgba(var(--mat-app-primary-rgb), 0.1);
    }

    .chat-textarea:hover {
      border-color: var(--mat-app-outline);
    }

    .chat-textarea::placeholder {
      color: var(--mat-app-on-surface-variant);
      opacity: 0.6;
    }

    .chat-textarea:disabled {
      background-color: var(--mat-app-surface-container-high);
      cursor: not-allowed;
      opacity: 0.6;
    }

    /* Custom scrollbar for textarea */
    .chat-textarea::-webkit-scrollbar {
      width: 4px;
    }

    .chat-textarea::-webkit-scrollbar-track {
      background: transparent;
    }

    .chat-textarea::-webkit-scrollbar-thumb {
      background: var(--mat-app-outline-variant);
      border-radius: 2px;
    }

    .chat-textarea::-webkit-scrollbar-thumb:hover {
      background: var(--mat-app-outline);
    }

    .send-button {
      flex-shrink: 0;
      width: 48px;
      height: 48px;
      border: none;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--mat-app-primary), #7c4dff);
      color: var(--mat-app-on-primary);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s ease;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    .send-button:hover:not(:disabled) {
      transform: scale(1.05);
      box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
    }

    .send-button:active:not(:disabled) {
      transform: scale(0.95);
    }

    .send-button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      transform: none;
    }

    .send-button mat-icon {
      width: 20px;
      height: 20px;
      font-size: 20px;
      color: var(--mat-app-on-primary);
    }

    .loading-spinner {
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      from {
        transform: rotate(0deg);
      }
      to {
        transform: rotate(360deg);
      }
    }

    .input-footer {
      display: flex;
      justify-content: flex-end;
      align-items: center;
      margin-top: 8px;
      padding: 0 4px;
    }

    .char-count {
      font-size: 11px;
      font-weight: 500;
      color: var(--mat-app-on-surface-variant);
      transition: color 0.2s ease;
    }

    .char-count.warning {
      color: var(--mat-app-error);
    }

    .char-separator,
    .char-max {
      font-size: 11px;
      color: var(--mat-app-on-surface-variant);
      opacity: 0.7;
      margin: 0 2px;
    }
  `]
})
export class ChatInputAreaComponent implements OnInit, OnDestroy {
  @Input() placeholder = 'Type your message... (Ctrl+Enter to send)';
  @Input() disabled = false;
  @Input() maxLength = 4000;
  @Input() showCharCount = false;
  @Input() warningThreshold = 0.9; // 90% length triggers warning

  @Output() messageSent = new EventEmitter<string>();
  @Output() inputChanged = new EventEmitter<string>();

  @ViewChild('messageInput', { static: true }) messageInput!: ElementRef<HTMLTextAreaElement>;

  message = '';
  textareaHeight = 48; // Initial height
  private destroy$ = new Subject<void>();
  private previousMessageLength = 0;

  ngOnInit() {
    // Initialize textarea height after view is ready
    setTimeout(() => {
      this.adjustTextareaHeight();
    }, 0);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Check if message can be sent
   */
  get canSend(): boolean {
    return this.message.trim().length > 0 && this.message.length <= this.maxLength;
  }

  /**
   * Check if approaching length limit
   */
  get isNearLimit(): boolean {
    return this.message.length >= this.maxLength * this.warningThreshold;
  }

  /**
   * Handle keyboard event
   * @param event Keyboard event
   */
  handleKeyDown(event: KeyboardEvent): void {
    // Ctrl/Cmd+Enter to send
    if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      if (this.canSend && !this.disabled) {
        this.sendMessage();
      }
    }
  }

  /**
   * Input change event
   */
  onInputChange(): void {
    this.inputChanged.emit(this.message);

    // Defer height adjustment to avoid ExpressionChangedAfterItHasBeenCheckedError
    setTimeout(() => {
      this.adjustTextareaHeight();
    }, 0);
  }

  /**
   * Auto-resize textarea height based on content
   * Inspired by FlowNet-Lab ChatInput implementation
   */
  private adjustTextareaHeight(): void {
    if (!this.messageInput || !this.messageInput.nativeElement) {
      return;
    }

    const textarea = this.messageInput.nativeElement;

    // Reset height to auto to calculate scroll height
    textarea.style.height = 'auto';

    // Calculate new height
    const scrollHeight = textarea.scrollHeight;
    const newHeight = Math.min(Math.max(scrollHeight, 48), 200); // Min 48px, Max 200px

    this.textareaHeight = newHeight;

    // Only set height if it changed or message length changed
    // This prevents unnecessary style updates
    if (this.previousMessageLength !== this.message.length) {
      textarea.style.height = `${newHeight}px`;
      this.previousMessageLength = this.message.length;
    }
  }

  /**
   * Send message
   */
  sendMessage(): void {
    if (!this.canSend || this.disabled) {
      return;
    }

    const message = this.message.trim();
    if (message) {
      this.messageSent.emit(message);
      this.message = '';

      // Reset textarea height after sending
      setTimeout(() => {
        this.adjustTextareaHeight();
      }, 0);
    }
  }

  /**
   * Focus input
   */
  focus(): void {
    if (this.messageInput && this.messageInput.nativeElement) {
      this.messageInput.nativeElement.focus();
    }
  }

  /**
   * Clear input
   */
  clear(): void {
    this.message = '';
    setTimeout(() => {
      this.adjustTextareaHeight();
    }, 0);
  }
}
