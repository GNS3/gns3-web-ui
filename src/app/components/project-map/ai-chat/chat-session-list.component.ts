import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { ChatSession } from '@models/ai-chat.interface';

/**
 * AI Chat Session List Component
 * Displays and manages chat sessions
 */
@Component({
  selector: 'app-chat-session-list',
  template: `
    <div class="chat-session-list">
      <!-- New session button -->
      <div class="session-list-header">
        <button mat-button (click)="createNewSession()" class="new-session-button">
          <mat-icon>add</mat-icon>
          <span>New Chat</span>
        </button>
      </div>

      <!-- Sessions list -->
      <div class="sessions-container">
        <ng-container *ngIf="sessions.length > 0; else noSessions">
          <div
            class="session-item"
            *ngFor="let session of sortedSessions; trackBy: trackBySessionId"
            [class.active]="session.thread_id === currentSessionId"
            (click)="selectSession(session.thread_id)"
          >
            <!-- Pin indicator -->
            <div class="session-pin" *ngIf="session.pinned">
              <mat-icon>push_pin</mat-icon>
            </div>

            <!-- Session content -->
            <div class="session-content">
              <!-- Session title -->
              <div class="session-header" *ngIf="!session.editing">
                <mat-icon class="session-icon">chat_bubble_outline</mat-icon>
                <div class="session-info">
                  <div class="session-title">{{ session.title || 'New chat' }}</div>
                  <div class="session-preview">
                    <span class="session-stats">{{ session.message_count }} messages</span>
                    <span class="session-time">{{ formatTime(session.updated_at) }}</span>
                  </div>
                </div>
              </div>

              <!-- Edit title -->
              <mat-form-field class="session-edit-field" *ngIf="session.editing" (click)="$event.stopPropagation()">
                <mat-icon class="session-icon">edit</mat-icon>
                <input
                  matInput
                  [value]="session.title"
                  (keydown.enter)="finishRename(session)"
                  (keydown.escape)="cancelRename(session)"
                  (blur)="finishRename(session)"
                  #titleInput
                />
              </mat-form-field>
            </div>

            <!-- Session menu button -->
            <button
              mat-icon-button
              class="session-menu-button"
              [matMenuTriggerFor]="sessionMenu"
              (click)="$event.stopPropagation()"
            >
              <mat-icon>more_vert</mat-icon>
            </button>

            <!-- Session menu -->
            <mat-menu #sessionMenu="matMenu" xPosition="before">
              <button mat-menu-item (click)="renameSession(session)">
                <mat-icon>edit</mat-icon>
                <span>Rename</span>
              </button>
              <button mat-menu-item (click)="togglePinSession(session)">
                <mat-icon>{{ session.pinned ? 'push_pin' : 'push_pin' }}</mat-icon>
                <span>{{ session.pinned ? 'Unpin' : 'Pin' }}</span>
              </button>
              <mat-divider></mat-divider>
              <button mat-menu-item (click)="deleteSession(session)" class="delete-action">
                <mat-icon>delete</mat-icon>
                <span>Delete</span>
              </button>
            </mat-menu>
          </div>
        </ng-container>

        <ng-template #noSessions>
          <div class="no-sessions">
            <mat-icon class="no-sessions-icon">forum</mat-icon>
            <p class="no-sessions-text">No sessions</p>
            <p class="no-sessions-hint">Click button above to create new session</p>
          </div>
        </ng-template>
      </div>
    </div>
  `,
  styles: [`
    .chat-session-list {
      display: flex;
      flex-direction: column;
      height: 100%;
      background-color: var(--mat-app-surface-container);
      border-right: 1px solid var(--mat-app-outline-variant);
    }

    .session-list-header {
      padding: 12px;
      border-bottom: 1px solid var(--mat-app-outline-variant);
    }

    .new-session-button {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }

    .sessions-container {
      flex: 1;
      overflow-y: auto;
      padding: 8px;
    }

    .session-item {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 10px;
      border-radius: 8px;
      cursor: pointer;
      transition: background-color 0.2s;
      position: relative;
    }

    .session-item:hover {
      background-color: var(--mat-app-surface-container-high);
    }

    .session-item.active {
      background-color: var(--mat-app-primary-container);
    }

    .session-item.active .session-title {
      color: var(--mat-app-on-primary-container);
    }

    .session-pin {
      position: absolute;
      top: 4px;
      right: 4px;
    }

    .session-pin mat-icon {
      font-size: 12px;
      width: 12px;
      height: 12px;
      color: var(--mat-app-primary);
    }

    .session-content {
      flex: 1;
      min-width: 0;
    }

    .session-header {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .session-icon {
      color: var(--mat-app-on-surface-variant);
      flex-shrink: 0;
    }

    .session-info {
      flex: 1;
      min-width: 0;
    }

    .session-title {
      font-size: 14px;
      font-weight: 500;
      color: var(--mat-app-on-surface);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .session-preview {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 4px;
    }

    .session-stats {
      font-size: 11px;
      color: var(--mat-app-on-surface-variant);
    }

    .session-time {
      font-size: 11px;
      color: var(--mat-app-on-surface-variant);
      opacity: 0.7;
    }

    .session-edit-field {
      width: 100%;
      margin: 0;
    }

    .session-edit-field .mat-mdc-form-field-infix {
      padding: 0;
    }

    .session-edit-field input {
      font-size: 14px;
    }

    .session-menu-button {
      width: 32px;
      height: 32px;
      padding: 0;
      opacity: 0;
      transition: opacity 0.2s;
    }

    .session-item:hover .session-menu-button {
      opacity: 1;
    }

    .no-sessions {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 48px 24px;
      text-align: center;
    }

    .no-sessions-icon {
      width: 48px;
      height: 48px;
      font-size: 48px;
      color: var(--mat-app-outline-variant);
      margin-bottom: 12px;
    }

    .no-sessions-text {
      font-size: 14px;
      font-weight: 500;
      color: var(--mat-app-on-surface);
      margin: 0 0 4px 0;
    }

    .no-sessions-hint {
      font-size: 12px;
      color: var(--mat-app-on-surface-variant);
      margin: 0;
    }

    .delete-action {
      color: var(--mat-app-error);
    }

    /* Scrollbar styles */
    ::-webkit-scrollbar {
      width: 6px;
    }

    ::-webkit-scrollbar-track {
      background: transparent;
    }

    ::-webkit-scrollbar-thumb {
      background: var(--mat-app-outline-variant);
      border-radius: 3px;
    }

    ::-webkit-scrollbar-thumb:hover {
      background: var(--mat-app-outline);
    }
  `],
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatInputModule,
    MatMenuModule,
    MatButtonModule
  ]
})
export class ChatSessionListComponent implements OnInit {
  @Input() sessions: ChatSession[] = [];
  @Input() currentSessionId: string | null = null;

  @Output() sessionSelected = new EventEmitter<string>();
  @Output() sessionCreated = new EventEmitter<void>();
  @Output() sessionRenamed = new EventEmitter<{ sessionId: string; title: string }>();
  @Output() sessionDeleted = new EventEmitter<string>();
  @Output() sessionPinned = new EventEmitter<string>();
  @Output() sessionUnpinned = new EventEmitter<string>();

  /**
   * Sorted sessions list (pinned ones first)
   */
  get sortedSessions(): ChatSession[] {
    const pinned = this.sessions.filter(s => s.pinned);
    const unpinned = this.sessions.filter(s => !s.pinned);

    // Sort by update time descending
    const sortByTime = (a: ChatSession, b: ChatSession) => {
      const timeA = new Date(a.updated_at).getTime();
      const timeB = new Date(b.updated_at).getTime();
      return timeB - timeA;
    };

    return [...pinned.sort(sortByTime), ...unpinned.sort(sortByTime)];
  }

  ngOnInit(): void {
    // Initialization logic
  }

  /**
   * Select session
   * @param sessionId Session ID
   */
  selectSession(sessionId: string): void {
    this.sessionSelected.emit(sessionId);
  }

  /**
   * Create new session
   */
  createNewSession(): void {
    this.sessionCreated.emit();
  }

  /**
   * Rename session
   * @param session Session
   */
  renameSession(session: ChatSession): void {
    // Add editing flag
    (session as any).editing = true;
  }

  /**
   * Finish renaming
   * @param session Session
   */
  finishRename(session: ChatSession): void {
    const input = document.querySelector('.session-edit-field input') as HTMLInputElement;
    if (input && input.value.trim()) {
      this.sessionRenamed.emit({
        sessionId: session.thread_id,
        title: input.value.trim()
      });
    }
    (session as any).editing = false;
  }

  /**
   * Cancel renaming
   * @param session Session
   */
  cancelRename(session: ChatSession): void {
    (session as any).editing = false;
  }

  /**
   * Toggle session pin status
   * @param session Session
   */
  togglePinSession(session: ChatSession): void {
    if (session.pinned) {
      this.sessionUnpinned.emit(session.thread_id);
    } else {
      this.sessionPinned.emit(session.thread_id);
    }
  }

  /**
   * Delete session
   * @param session Session
   */
  deleteSession(session: ChatSession): void {
    if (confirm(`Are you sure you want to delete session "${session.title}"?`)) {
      this.sessionDeleted.emit(session.thread_id);
    }
  }

  /**
   * Format time
   * @param timestamp Timestamp
   * @returns Formatted time
   */
  formatTime(timestamp: string): string {
    if (!timestamp) {
      return '';
    }

    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) {
      return 'Just now';
    } else if (diffMins < 60) {
      return `${diffMins} minutes ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hours ago`;
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
    }
  }

  /**
   * Track session ID (for optimized list rendering)
   * @param index Index
   * @param session Session
   * @returns Session ID
   */
  trackBySessionId(index: number, session: ChatSession): string {
    return session.thread_id;
  }
}
