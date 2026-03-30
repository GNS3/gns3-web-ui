import { ChangeDetectionStrategy, Component, Output, EventEmitter, inject, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { ChatSession } from '@models/ai-chat.interface';
import { Controller } from '@models/controller';
import { AiChatService } from '@services/ai-chat.service';
import {
  ConfirmationDialogComponent,
  ConfirmationDialogData,
} from '@components/dialogs/confirmation-dialog/confirmation-dialog.component';

/**
 * AI Chat Session List Component
 * Displays and manages chat sessions
 */
@Component({
  selector: 'app-chat-session-list',
  imports: [
    CommonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatMenuModule,
    MatButtonModule,
    MatDialogModule,
    MatDividerModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="chat-session-list">
      <!-- New session button -->
      <div class="session-list-header">
        <button mat-button (click)="createNewSession()" class="new-session-button">
          <svg class="session-list-icon" xmlns="http://www.w3.org/2000/svg" height="20" width="20" viewBox="0 0 24 24">
            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
          </svg>
          <span>New Chat</span>
        </button>
      </div>

      <!-- Sessions list -->
      <div class="sessions-container">
        @if (sessions().length > 0) { @for (session of sortedSessions; track session.thread_id) {
        <div
          class="session-item"
          [class.active]="session.thread_id === currentSessionId()"
          (click)="selectSession(session.thread_id)"
        >
          <!-- Pin indicator -->
          @if (session.pinned) {
          <svg
            class="session-pin-icon pin-animation"
            xmlns="http://www.w3.org/2000/svg"
            height="16"
            width="16"
            viewBox="0 0 24 24"
          >
            <path d="M16 12V4H17V2H7V4H8V12L6 14V16H11V22H13V16H18V14L16 12Z" />
          </svg>
          }

          <!-- Session text content -->
          <div class="session-text">
            <!-- Session title -->
            @if (!session.editing) {
            <span class="session-title">{{ session.title || 'New chat' }}</span>
            }

            <!-- Edit title -->
            @if (session.editing) {
            <mat-form-field class="session-edit-field" (click)="$event.stopPropagation()">
              <input
                matInput
                [value]="session.title"
                (keydown.enter)="finishRename(session, titleInput.value)"
                (keydown.escape)="cancelRename(session)"
                (blur)="finishRename(session, titleInput.value)"
                #titleInput
              />
            </mat-form-field>
            }

            <!-- Session preview -->
            <span class="session-preview">
              <span class="session-stats">{{ session.message_count }} messages</span>
              <span class="session-time">{{ formatTime(session.updated_at) }}</span>
            </span>
          </div>

          <!-- Session menu button -->
          <button
            mat-icon-button
            class="session-menu-button"
            [matMenuTriggerFor]="sessionMenu"
            (click)="$event.stopPropagation()"
          >
            <svg class="menu-icon" xmlns="http://www.w3.org/2000/svg" height="20" width="20" viewBox="0 0 24 24">
              <path
                d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"
              />
            </svg>
          </button>

          <!-- Session menu -->
          <mat-menu
            #sessionMenu="matMenu"
            xPosition="before"
            panelClass="session-action-menu"
            (opened)="onMenuOpened()"
            (closed)="onMenuClosed()"
          >
            <button mat-menu-item (click)="renameSession(session)">
              <svg class="menu-item-icon" xmlns="http://www.w3.org/2000/svg" height="20" width="20" viewBox="0 0 24 24">
                <path
                  d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"
                />
              </svg>
              <span>Rename</span>
            </button>
            <button mat-menu-item (click)="togglePinSession(session)">
              <svg class="menu-item-icon" xmlns="http://www.w3.org/2000/svg" height="20" width="20" viewBox="0 0 24 24">
                <path d="M16 12V4H17V2H7V4H8V12L6 14V16H11V22H13V16H18V14L16 12Z" />
              </svg>
              <span>{{ session.pinned ? 'Unpin' : 'Pin' }}</span>
            </button>
            <mat-divider></mat-divider>
            <button mat-menu-item (click)="deleteSession(session, $event)" class="delete-action">
              <svg
                class="menu-item-icon delete-icon"
                xmlns="http://www.w3.org/2000/svg"
                height="20"
                width="20"
                viewBox="0 0 24 24"
              >
                <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
              </svg>
              <span>Delete</span>
            </button>
          </mat-menu>
        </div>
        } } @else {
        <div class="no-sessions">
          <svg class="no-sessions-icon" xmlns="http://www.w3.org/2000/svg" height="48" width="48" viewBox="0 0 24 24">
            <path
              d="M21 6h-2v9H6v2c0 .55.45 1 1 1h11l4 4V7c0-.55-.45-1-1-1zm-4 6V3c0-.55-.45-1-1-1H3c-.55 0-1 .45-1 1v14l4-4h10c.55 0 1-.45 1-1z"
            />
          </svg>
          <p class="no-sessions-text">No sessions</p>
          <p class="no-sessions-hint">Click button above to create new session</p>
        </div>
        }
      </div>
    </div>
  `,
  styles: [
    `
      .chat-session-list {
        display: flex;
        flex-direction: column;
        height: 100%;
        background-color: var(--mat-sys-surface-container);
        border-right: 1px solid var(--mat-sys-outline-variant);
      }

      .session-list-header {
        padding: 12px;
        border-bottom: 1px solid var(--mat-sys-outline-variant);
      }

      .new-session-button {
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
      }

      .session-list-icon {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }

      /* Session list header icon (New Chat + icon) */
      .session-list-icon {
        fill: var(--mat-sys-on-surface);
        transition: fill 0.2s ease;
      }

      .new-session-button:hover .session-list-icon {
        fill: var(--mat-sys-primary);
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
        background-color: var(--mat-sys-surface-container-high);
      }

      .session-item.active {
        background-color: var(--mat-sys-primary-container);
        border-left: 4px solid var(--mat-sys-primary);
        box-shadow: 0 4px 12px rgba(0, 151, 167, 0.3), inset 0 0 0 1px rgba(0, 151, 167, 0.1);
        transform: translateX(2px);
      }

      .session-item.active .session-title {
        color: var(--mat-sys-on-primary-container);
        font-weight: 700;
      }

      .session-item.active .session-stats,
      .session-item.active .session-time {
        color: var(--mat-sys-on-primary-container);
        opacity: 0.9;
      }

      .session-item.active .menu-icon {
        fill: var(--mat-sys-on-primary-container);
      }

      .session-pin {
        position: absolute;
        top: 4px;
        right: 4px;
      }

      /* Pin icon */
      .pin-icon {
        fill: var(--mat-sys-primary);
        filter: drop-shadow(0 2px 4px rgba(0, 151, 167, 0.4));
      }

      /* Pin bounce animation */
      .pin-animation {
        animation: pinBounce 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
      }

      @keyframes pinBounce {
        0% {
          transform: scale(0);
          opacity: 0;
        }
        50% {
          transform: scale(1.35);
        }
        100% {
          transform: scale(1);
          opacity: 1;
        }
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

      /* Session icon (chat bubble) */
      .session-icon {
        fill: var(--mat-sys-on-surface-variant);
        flex-shrink: 0;
        transition: fill 0.2s ease;
      }

      .session-item:hover .session-icon {
        fill: var(--mat-sys-on-surface);
      }

      .session-item.active .session-icon {
        fill: var(--mat-sys-on-primary-container);
      }

      .session-info {
        flex: 1;
        min-width: 0;
      }

      .session-title {
        font-size: 14px;
        font-weight: 500;
        color: var(--mat-sys-on-surface);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .session-preview {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .session-text {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 4px;
        min-width: 0;
      }

      .session-stats {
        font-size: 11px;
        color: var(--mat-sys-on-surface-variant);
      }

      .session-time {
        font-size: 11px;
        color: var(--mat-sys-on-surface-variant);
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

      /* Menu icon (three dots) */
      .menu-icon {
        fill: var(--mat-sys-on-surface-variant);
        transition: fill 0.2s ease;
      }

      .session-menu-button:hover .menu-icon {
        fill: var(--mat-sys-on-surface);
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
        fill: var(--mat-sys-outline-variant);
        margin-bottom: 12px;
      }

      .no-sessions-text {
        font-size: 14px;
        font-weight: 500;
        color: var(--mat-sys-on-surface);
        margin: 0 0 4px 0;
      }

      .no-sessions-hint {
        font-size: 12px;
        color: var(--mat-sys-on-surface-variant);
        margin: 0;
      }

      .delete-action {
        color: var(--mat-sys-error);
      }

      /* Menu item icons should align with text */
      .menu-item-icon {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        margin-right: 12px;
        flex-shrink: 0;
      }

      /* Menu item alignment handled by global styles in _dialogs.scss */
    `,
  ],
})
export class ChatSessionListComponent {
  private dialog = inject(MatDialog);
  private aiChatService = inject(AiChatService);

  readonly sessions = input<ChatSession[]>([]);
  readonly currentSessionId = input<string | null>(null);
  readonly controller = input<Controller>(undefined);
  readonly projectId = input<string>(undefined);

  @Output() sessionSelected = new EventEmitter<string>();
  @Output() sessionCreated = new EventEmitter<void>();
  @Output() sessionRenamed = new EventEmitter<{ sessionId: string; title: string }>();
  @Output() sessionDeleted = new EventEmitter<string>();
  @Output() sessionPinned = new EventEmitter<string>();
  @Output() sessionUnpinned = new EventEmitter<string>();

  constructor() {}

  /**
   * Handle menu opened event
   */
  onMenuOpened(): void {
    // Menu z-index handled by CSS
  }

  /**
   * Handle menu closed event
   */
  onMenuClosed(): void {
    // Cleanup if needed
  }

  /**
   * Sorted sessions list (pinned ones first)
   */
  get sortedSessions(): ChatSession[] {
    const pinned = this.sessions().filter((s) => s.pinned);
    const unpinned = this.sessions().filter((s) => !s.pinned);

    // Sort by update time descending
    const sortByTime = (a: ChatSession, b: ChatSession) => {
      const timeA = new Date(a.updated_at).getTime();
      const timeB = new Date(b.updated_at).getTime();
      return timeB - timeA;
    };

    return [...pinned.sort(sortByTime), ...unpinned.sort(sortByTime)];
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
   * @param value Input value
   */
  finishRename(session: ChatSession, value: string): void {
    const trimmedValue = value.trim();
    if (trimmedValue) {
      this.sessionRenamed.emit({
        sessionId: session.thread_id,
        title: trimmedValue,
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
   * Delete session with confirmation dialog
   * @param session Session
   * @param event MouseEvent to calculate dialog position
   */
  deleteSession(session: ChatSession, event?: MouseEvent): void {
    const message = `Are you sure you want to delete "${session.title || 'New chat'}"?`;

    // Calculate dialog position centered on click
    let position: { top?: string; left?: string; right?: string; bottom?: string } = {};

    if (event) {
      // Get click coordinates
      const clickX = event.clientX;
      const clickY = event.clientY;

      // Dialog dimensions (estimated)
      const dialogWidth = 360;
      const dialogHeight = 180;

      // Calculate centered position
      let left = clickX - dialogWidth / 2;
      let top = clickY - dialogHeight / 2;

      // Get viewport dimensions
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      // Ensure dialog doesn't go off-screen horizontally
      if (left < 10) {
        left = 10;
      }
      if (left + dialogWidth > viewportWidth - 10) {
        left = viewportWidth - dialogWidth - 10;
      }

      // Ensure dialog doesn't go off-screen vertically
      if (top < 10) {
        top = 10;
      }
      if (top + dialogHeight > viewportHeight - 10) {
        top = viewportHeight - dialogHeight - 10;
      }

      position = {
        top: `${top}px`,
        left: `${left}px`,
      };
    }

    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: { message },
      width: '360px',
      position,
      autoFocus: false,
      restoreFocus: false,
      backdropClass: 'delete-dialog-backdrop',
      panelClass: 'confirmation-dialog-panel',
    });

    dialogRef.afterClosed().subscribe((result: boolean) => {
      if (result) {
        this.delete(session);
      }
    });
  }

  /**
   * Delete session
   * @param session Session
   */
  delete(session: ChatSession): void {
    this.aiChatService.deleteSession(this.controller(), this.projectId(), session.thread_id).subscribe({
      next: () => {
        // Emit event to notify parent to remove from store
        this.sessionDeleted.emit(session.thread_id);
      },
      error: (error) => {
        console.error('[ChatSessionList] Delete failed:', error);
      },
    });
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

    // Fix: Treat timestamp as UTC if no timezone suffix
    // Backend returns UTC time without 'Z' suffix (e.g., "2026-03-06T16:31:36.547762")
    // Check for timezone suffix: 'Z' or '+08:00' or '-05:00' (at the end of string)
    const hasTimezone = /[Z+-]\d{2}:?\d{2}$/.test(timestamp);
    const normalizedTimestamp = hasTimezone ? timestamp : timestamp + 'Z';

    const date = new Date(normalizedTimestamp);
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
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
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
