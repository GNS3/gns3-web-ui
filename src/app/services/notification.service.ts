import { EventEmitter, Injectable } from '@angular/core';
import { environment } from 'environments/environment';
import { Controller } from '@models/controller';
import { Compute } from '@models/compute';
import { Project } from '@models/project';
import { ComputeService } from '@services/compute.service';

export interface ComputeNotification {
  action: 'compute.created' | 'compute.updated' | 'compute.deleted';
  event: Compute;
}

export interface ProjectNotification {
  action: 'project.created' | 'project.opened' | 'project.closed' | 'project.updated' | 'project.deleted';
  event: Project;
}

@Injectable()
export class NotificationService {
  // The backend pushes a ping on the notification stream every ~5s, so a
  // healthy connection always has inbound traffic. If nothing arrives for
  // WS_LIVENESS_TIMEOUT_MS the TCP connection is presumed half-open (onclose
  // would never fire on its own), so it is force-closed to enter the normal
  // reconnect path. Mirrors the project WS liveness check in project-map.
  private readonly WS_LIVENESS_TIMEOUT_MS = 15000;
  private readonly WS_LIVENESS_CHECK_MS = 5000;

  private ws: WebSocket | null = null;
  private currentController: Controller | null = null;
  private intentionalClose = false;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectAttempt = 0;
  private livenessTimer: ReturnType<typeof setInterval> | null = null;
  private lastWsMessageAt = 0;

  // Event emitters for compute notifications
  public computeNotificationEmitter = new EventEmitter<ComputeNotification>();

  // Cache for compute data - stores the latest compute states
  private computeCache: Map<string, Compute> = new Map();

  // Event emitter for project notifications
  public projectNotificationEmitter = new EventEmitter<ProjectNotification>();

  // EventEmitter for cache updates
  public computeCacheUpdated = new EventEmitter<Compute[]>();

  constructor(private computeService: ComputeService) {}

  notificationsPath(controller: Controller): string {
    let protocol: string = 'ws';
    if (controller.protocol === 'https:') {
      protocol = 'wss';
    }

    return `${protocol}://${controller.host}:${controller.port}/${environment.current_version}/notifications/ws?token=${controller.authToken}`;
  }

  projectNotificationsPath(controller: Controller, project_id: string): string {
    let protocol: string = 'ws';
    if (controller.protocol === 'https:') {
      protocol = 'wss';
    }

    return `${protocol}://${controller.host}:${controller.port}/${environment.current_version}/projects/${project_id}/notifications/ws?token=${controller.authToken}`;
  }

  markerNotificationsPath(controller: Controller, project_id: string): string {
    let protocol: string = 'ws';
    if (controller.protocol === 'https:') {
      protocol = 'wss';
    }

    return `${protocol}://${controller.host}:${controller.port}/${environment.current_version}/projects/${project_id}/notifications/markers/ws?token=${controller.authToken}`;
  }

  connectToComputeNotifications(controller: Controller) {
    // If already connected to the same controller, skip
    if (this.ws && this.currentController === controller) {
      return;
    }

    // Close existing connection if different controller
    this.disconnect();

    this.currentController = controller;
    this.openComputeNotificationsWs();
  }

  /**
   * Open (or reopen) the controller notifications WebSocket. On an unexpected
   * close the connection is silently reconnected with exponential backoff; on
   * a successful reconnect the compute list is re-fetched into the cache —
   * the notification stream does not replay events missed while disconnected.
   */
  private openComputeNotificationsWs() {
    if (!this.currentController) {
      return;
    }

    this.intentionalClose = false;
    this.ws = new WebSocket(this.notificationsPath(this.currentController));

    this.ws.onopen = () => {
      // Reconnect (attempt > 0): resync the compute cache to cover missed
      // events. First connect (attempt 0): consumers fetch the initial list.
      const isReconnect = this.reconnectAttempt > 0;
      this.reconnectAttempt = 0;
      this.startLivenessCheck();
      if (isReconnect) {
        this.resyncComputesAfterReconnect();
      }
    };

    this.ws.onmessage = (event: MessageEvent) => {
      // Any inbound frame (incl. the periodic ping) proves the connection is
      // alive — stamp it for the liveness check before dispatching.
      this.lastWsMessageAt = Date.now();
      const message = JSON.parse(event.data);
      this.handleMessage(message);
    };

    this.ws.onerror = () => {
      console.error('Compute notifications WebSocket error');
    };

    this.ws.onclose = () => {
      this.ws = null;
      this.stopLivenessCheck();
      // Don't clear currentController - keep it for potential reconnection
      // currentController should only be cleared in disconnect() method
      if (this.intentionalClose) {
        return;
      }
      this.scheduleReconnect();
    };
  }

  private scheduleReconnect() {
    if (this.intentionalClose || !this.currentController) {
      return;
    }
    const attempt = this.reconnectAttempt++;
    // Exponential backoff capped at 30s, +up to 25% jitter to avoid reconnect
    // storms when many clients drop simultaneously.
    const base = Math.min(30000, 1000 * 2 ** attempt);
    const delay = Math.round(base + Math.random() * 0.25 * base);
    this.reconnectTimer = setTimeout(() => this.openComputeNotificationsWs(), delay);
  }

  /**
   * Re-fetch the authoritative compute list after a reconnect and push it
   * through the cache (setInitialComputes emits computeCacheUpdated) so every
   * consumer resyncs — missed WS events are not replayed by the server.
   */
  private resyncComputesAfterReconnect() {
    if (!this.currentController) {
      return;
    }
    this.computeService.getComputes(this.currentController).subscribe({
      next: (computes) => this.setInitialComputes(computes),
      error: (err) => console.warn('Compute resync after WS reconnect failed', err),
    });
  }

  private startLivenessCheck() {
    this.stopLivenessCheck();
    this.lastWsMessageAt = Date.now();
    this.livenessTimer = setInterval(() => {
      if (Date.now() - this.lastWsMessageAt > this.WS_LIVENESS_TIMEOUT_MS) {
        console.warn('Compute notifications WS liveness timeout — no message received, forcing reconnect');
        this.stopLivenessCheck();
        this.ws?.close(); // onclose drives the normal reconnect path
      }
    }, this.WS_LIVENESS_CHECK_MS);
  }

  private stopLivenessCheck() {
    if (this.livenessTimer) {
      clearInterval(this.livenessTimer);
      this.livenessTimer = null;
    }
  }

  disconnect() {
    this.intentionalClose = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.stopLivenessCheck();
    this.reconnectAttempt = 0;
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.currentController = null;
    this.computeCache.clear();
  }

  /**
   * Get cached compute data
   * Returns an array of all cached computes
   */
  getCachedComputes(): Compute[] {
    return Array.from(this.computeCache.values());
  }

  /**
   * Check if cache has data
   */
  hasCachedData(): boolean {
    return this.computeCache.size > 0;
  }

  /**
   * Set initial compute data (usually from HTTP response)
   * This initializes the cache with data loaded via HTTP
   */
  setInitialComputes(computes: Compute[]) {
    this.computeCache.clear();
    computes.forEach(compute => {
      this.computeCache.set(compute.compute_id, compute);
    });
    this.computeCacheUpdated.emit(this.getCachedComputes());
  }

  private handleMessage(message: { action: string; event: any }) {
    switch (message.action) {
      case 'compute.created':
        // Add to cache
        this.computeCache.set(message.event.compute_id, message.event);
        this.computeNotificationEmitter.emit(message as ComputeNotification);
        this.computeCacheUpdated.emit(this.getCachedComputes());
        break;
      case 'compute.updated':
        // Update cache
        this.computeCache.set(message.event.compute_id, message.event);
        this.computeNotificationEmitter.emit(message as ComputeNotification);
        this.computeCacheUpdated.emit(this.getCachedComputes());
        break;
      case 'compute.deleted':
        // Remove from cache
        this.computeCache.delete(message.event.compute_id);
        this.computeNotificationEmitter.emit(message as ComputeNotification);
        this.computeCacheUpdated.emit(this.getCachedComputes());
        break;
      case 'project.created':
      case 'project.opened':
      case 'project.closed':
      case 'project.updated':
      case 'project.deleted':
        this.projectNotificationEmitter.emit(message as ProjectNotification);
        break;
    }
  }
}
