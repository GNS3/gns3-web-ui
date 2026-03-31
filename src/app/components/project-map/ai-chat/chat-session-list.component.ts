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
  templateUrl: './chat-session-list.component.html',
  styleUrls: ['./chat-session-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
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
