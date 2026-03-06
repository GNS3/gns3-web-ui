import { Component, Output, EventEmitter, Input, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';

/**
 * AI Chat Input Area Component
 * Provides text input and send button
 */
@Component({
  selector: 'app-chat-input-area',
  template: `
    <div class="chat-input-area">
      <textarea
        matInput
        [placeholder]="placeholder"
        [disabled]="disabled"
        [(ngModel)]="message"
        (keydown.enter)="handleKeyDown($event)"
        (input)="onInputChange()"
        [rows]="rows"
        [maxRows]="maxRows"
        #messageInput
        class="chat-textarea"
        cdkAutosize
        cdkTextareaAutosize
      ></textarea>

      <div class="chat-input-actions">
        <div class="chat-input-info">
          <span class="char-count" [class.warning]="isNearLimit">{{ message.length }}</span>
          <span class="char-limit"> / {{ maxLength }}</span>
        </div>

        <button
          mat-button
          color="primary"
          (click)="sendMessage()"
          [disabled]="!canSend || disabled"
          class="send-button"
        >
          <mat-icon>send</mat-icon>
          <span>Send</span>
        </button>
      </div>
    </div>
  `,
  styles: [`
    .chat-input-area {
      display: flex;
      flex-direction: column;
      padding: 12px;
      background-color: var(--mat-app-background);
      border-top: 1px solid var(--mat-app-divider-color);
    }

    .chat-textarea {
      width: 100%;
      min-height: 60px;
      max-height: 200px;
      padding: 8px;
      border: 1px solid var(--mat-app-outline-color);
      border-radius: 4px;
      background-color: var(--mat-app-surface);
      color: var(--mat-app-on-surface);
      font-family: inherit;
      font-size: 14px;
      line-height: 1.5;
      resize: none;
      outline: none;
      transition: border-color 0.2s;
    }

    .chat-textarea:focus {
      border-color: var(--mat-app-primary);
    }

    .chat-textarea:disabled {
      background-color: var(--mat-app-surface-variant);
      cursor: not-allowed;
      opacity: 0.6;
    }

    .chat-input-actions {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 8px;
    }

    .chat-input-info {
      display: flex;
      align-items: center;
      font-size: 12px;
      color: var(--mat-app-on-surface-variant);
    }

    .char-count {
      font-weight: 500;
    }

    .char-count.warning {
      color: var(--mat-app-error);
    }

    .char-limit {
      margin-left: 4px;
      opacity: 0.7;
    }

    .send-button {
      display: flex;
      align-items: center;
      gap: 4px;
      min-width: 80px;
    }

    .send-button mat-icon {
      width: 18px;
      height: 18px;
    }
  `]
})
export class ChatInputAreaComponent implements OnInit, OnDestroy {
  @Input() placeholder = 'Type a message...';
  @Input() disabled = false;
  @Input() maxLength = 4000;
  @Input() rows = 1;
  @Input() maxRows = 8;
  @Input() warningThreshold = 0.9; // 90% length triggers warning

  @Output() messageSent = new EventEmitter<string>();
  @Output() inputChanged = new EventEmitter<string>();

  message = '';
  private destroy$ = new Subject<void>();

  ngOnInit() {
    // Can add input debounce logic here
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
    // Enter to send, Shift+Enter for new line
    if (event.key === 'Enter' && !event.shiftKey) {
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
    }
  }

  /**
   * Focus input
   */
  focus(): void {
    // Can add focus logic when needed
  }

  /**
   * Clear input
   */
  clear(): void {
    this.message = '';
  }
}
