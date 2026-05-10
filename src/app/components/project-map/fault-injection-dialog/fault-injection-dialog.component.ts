import {
  Component,
  Inject,
  OnDestroy,
  OnInit,
  ChangeDetectionStrategy,
  inject,
  model,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { Observable, Subject, takeUntil } from 'rxjs';

import { Controller } from '@models/controller';
import { Project } from '@models/project';
import { AiChatService } from '@services/ai-chat.service';
import { ChatEvent } from '@models/ai-chat.interface';

export interface FaultInjectionDialogData {
  controller: Controller;
  project: Project;
}

export interface FaultEvent {
  id: string;
  type: 'info' | 'tool_call' | 'success' | 'error';
  message: string;
  details?: string;
  timestamp?: string;
}

@Component({
  selector: 'app-fault-injection-dialog',
  templateUrl: './fault-injection-dialog.component.html',
  styleUrls: ['./fault-injection-dialog.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatButtonToggleModule,
  ],
})
export class FaultInjectionDialogComponent implements OnInit, OnDestroy {
  private dialogRef = inject(MatDialogRef<FaultInjectionDialogComponent>);
  private data = inject<FaultInjectionDialogData>(MAT_DIALOG_DATA);
  private aiChatService = inject(AiChatService);

  controller = this.data.controller;
  project = this.data.project;

  readonly isInjecting = signal(false);
  readonly completed = signal(false);
  readonly showConfirm = signal(false);
  readonly faultType = model<1 | 2 | 3 | 'random'>(1);
  readonly faceState = signal<'idle' | 'injecting' | 'success' | 'error' | 'aborted'>('idle');
  readonly completionStatus = signal<'success' | 'error' | 'aborted'>('success');
  readonly completionTitle = signal('');
  readonly currentStep = signal('');

  // Performance: Only keep last 3 events (that's all we display)
  private eventsBuffer: FaultEvent[] = [];
  readonly displayedEvents = signal<FaultEvent[]>([]);
  private firstToolCallProcessed = false; // Track if first tool_call was processed

  private destroy$ = new Subject<void>();
  private static readonly MAX_DISPLAYED_EVENTS = 3;

  ngOnInit(): void {
    // Initialize with idle state
    this.faceState.set('idle');
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Show confirmation step before injecting
   */
  onInject(): void {
    this.showConfirm.set(true);
  }

  /**
   * Cancel confirmation and go back
   */
  onCancelConfirm(): void {
    this.showConfirm.set(false);
  }

  /**
   * Confirmed - start fault injection
   */
  onConfirmInject(): void {
    if (this.isInjecting()) {
      return;
    }

    this.showConfirm.set(false);
    this.isInjecting.set(true);
    this.completed.set(false);
    this.faceState.set('injecting');
    this.eventsBuffer = [];
    this.displayedEvents.set([]);
    this.firstToolCallProcessed = false; // Reset for new injection

    // Call the inject fault API with SSE stream
    const faultCountStr = this.faultType() === 'random' ? 'random' : String(this.faultType());
    const injectMessage = `Inject ${faultCountStr} network fault(s) for troubleshooting practice`;

    this.aiChatService
      .injectFault(
        this.controller,
        this.project.project_id,
        injectMessage
      )
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (event: ChatEvent) => {
          this.handleFaultEvent(event);
        },
        error: (error) => {
          this.handleError(error);
        },
        complete: () => {
          // Stream completed - no action needed as signals are reactive
        },
      });
  }

  /**
   * Handle fault injection SSE event
   */
  private handleFaultEvent(event: ChatEvent): void {
    console.log('Fault injection event:', event);

    // Filter out unwanted events early
    if (event.type === 'heartbeat' || event.type === 'content') {
      return; // Skip heartbeat and AI thinking content
    }

    switch (event.type) {
      case 'tool_call':
        // LLM decided to call a tool - ONLY UPDATE ON FIRST tool_call
        if (event.tool_call && !this.firstToolCallProcessed) {
          const toolName = event.tool_call.function.name;
          this.currentStep.set(`Preparing: ${toolName}`);
          this.addEvent({
            type: 'tool_call',
            message: `Preparing: ${toolName}`,
          });
          this.firstToolCallProcessed = true; // Mark as processed
        }
        break;

      case 'tool_start':
        // Tool execution started - ALWAYS UPDATE
        if (event.tool_name) {
          this.currentStep.set(`Executing: ${event.tool_name}`);
          this.addEvent({
            type: 'info',
            message: `Executing: ${event.tool_name}`,
          });
        }
        break;

      case 'tool_end':
        // Tool execution completed - ALWAYS UPDATE
        if (event.tool_name) {
          this.addEvent({
            type: 'success',
            message: `Completed: ${event.tool_name}`,
          });
        }
        break;

      case 'error':
        this.handleError(event);
        break;

      case 'done':
        // Stream completed successfully
        this.isInjecting.set(false);
        this.completed.set(true);
        this.faceState.set('success');
        this.completionStatus.set('success');
        this.completionTitle.set('Fault injected successfully!');
        this.currentStep.set('');
        break;
    }
  }

  /**
   * Handle error
   */
  private handleError(error: any): void {
    console.error('Fault injection error:', error);

    const errorMessage = error?.error?.message || error?.message || error?.error || 'Failed to inject fault';

    this.addEvent({
      type: 'error',
      message: 'Error injecting fault',
      details: errorMessage,
    });

    this.isInjecting.set(false);
    this.completed.set(true);
    this.faceState.set('error');
    this.completionStatus.set('error');
    this.completionTitle.set('Failed to inject fault');
    this.currentStep.set('');
  }

  /**
   * Add event to the events list (performance optimized)
   * Only keeps last N events that are actually displayed
   */
  private addEvent(event: Omit<FaultEvent, 'id' | 'timestamp'>): void {
    const newEvent: FaultEvent = {
      id: `event_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      timestamp: new Date().toISOString(),
      ...event,
    };

    // Add to buffer
    this.eventsBuffer.push(newEvent);

    // Only keep last N events (what we actually display)
    if (this.eventsBuffer.length > FaultInjectionDialogComponent.MAX_DISPLAYED_EVENTS) {
      this.eventsBuffer.shift(); // Remove oldest (O(1) operation)
    }

    // Update signal with new array reference (triggers change detection)
    this.displayedEvents.set([...this.eventsBuffer]);
  }

  /**
   * Get icon for event type
   */
  getEventIcon(type: string): string {
    switch (type) {
      case 'info':
        return 'info';
      case 'tool_call':
        return 'build';
      case 'success':
        return 'check_circle';
      case 'error':
        return 'error';
      default:
        return 'info';
    }
  }

  /**
   * Abort fault injection
   */
  onAbort(): void {
    this.isInjecting.set(false);
    this.completed.set(true);
    this.faceState.set('aborted');
    this.completionStatus.set('aborted');
    this.completionTitle.set('Fault injection aborted');
    this.currentStep.set('');
    this.destroy$.next(); // This will unsubscribe from the stream
    this.addEvent({
      type: 'info',
      message: 'Fault injection aborted by user',
    });
  }

  /**
   * View details in AI Chat
   */
  onViewDetails(): void {
    // Close dialog and notify parent to open AI Chat
    this.dialogRef.close({
      success: this.completionStatus() === 'success',
      openAIChat: true,
    });
  }

  /**
   * Cancel dialog
   */
  onCancel(): void {
    if (this.isInjecting()) {
      // Warn user if injection is in progress
      return;
    }
    this.dialogRef.close(null);
  }

  /**
   * Close dialog with result
   */
  onClose(): void {
    this.dialogRef.close({
      success: this.completionStatus() === 'success',
      events: this.displayedEvents(),
    });
  }

  /**
   * Track event by ID for optimized list rendering
   */
  trackByEventId(index: number, event: FaultEvent): string {
    return event.id;
  }
}
