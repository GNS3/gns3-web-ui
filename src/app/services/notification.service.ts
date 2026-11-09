import { EventEmitter, Injectable } from '@angular/core';
import { environment } from 'environments/environment';
import { Controller } from '@models/controller';
import { Compute } from '@models/compute';
import { Project } from '@models/project';
import { SettingsUpdatedEvent } from '@models/server-settings/server-settings';
import { ComputeService } from '@services/compute.service';
import { PermissionService } from '@services/permission.service';
import { DockerImageDeletedNotification, DockerImagePullNotification } from '@models/docker/docker-image';

export interface ComputeNotification {
  action: 'compute.created' | 'compute.updated' | 'compute.deleted';
  event: Compute;
}

export interface ProjectNotification {
  action: 'project.created' | 'project.opened' | 'project.closed' | 'project.updated' | 'project.deleted';
  event: Project;
}

export interface ServerSettingsNotification {
  action: 'settings.updated';
  event: SettingsUpdatedEvent;
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
  /** Close code the server uses when the stream privilege is missing or revoked. */
  private readonly WS_POLICY_VIOLATION_CLOSE_CODE = 1008;
  /** The global stream requires this privilege (superadmins hold every privilege). */
  private readonly NOTIFICATION_STREAM_PRIVILEGE = 'Notification.Audit';
  private readonly COMPUTE_POLL_INTERVAL_MS = 10000;

  private ws: WebSocket | null = null;
  private currentController: Controller | null = null;
  private intentionalClose = false;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectAttempt = 0;
  private livenessTimer: ReturnType<typeof setInterval> | null = null;
  private lastWsMessageAt = 0;
  private pollTimer: ReturnType<typeof setInterval> | null = null;

  // Event emitters for compute notifications
  public computeNotificationEmitter = new EventEmitter<ComputeNotification>();

  // Cache for compute data - stores the latest compute states
  private computeCache: Map<string, Compute> = new Map();

  // Event emitter for project notifications
  public projectNotificationEmitter = new EventEmitter<ProjectNotification>();

  // Event emitter for server settings notifications
  public serverSettingsNotificationEmitter = new EventEmitter<ServerSettingsNotification>();

  // Event emitter for Docker image pull progress (global stream, filtered by
  // progress_id at the consumer).
  public dockerImagePullEmitter = new EventEmitter<DockerImagePullNotification>();

  // Emitted after any client deleted a Docker image, so open sessions refresh.
  public dockerImageDeletedEmitter = new EventEmitter<DockerImageDeletedNotification>();

  // Emitted after an unexpected WS reconnect: the notification stream does not
  // replay events missed while disconnected, so consumers resync over HTTP.
  public wsReconnected = new EventEmitter<void>();

  // EventEmitter for cache updates
  public computeCacheUpdated = new EventEmitter<Compute[]>();

  constructor(
    private computeService: ComputeService,
    private permissionService: PermissionService,
  ) {}

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
    // The stream requires the Notification.Audit privilege and the server
    // closes unauthorized sockets with code 1008. Decide from the cached
    // privileges when they are already available (the common case once the
    // layout has activated the controller); fetch them otherwise.
    const cached = this.permissionService.cachedPrivileges(controller.id);
    if (cached !== null) {
      this.openStreamOrPoll(controller, cached);
      return;
    }
    void this.permissionService
      .ready(controller.id)
      .then((privileges) => this.openStreamOrPoll(controller, privileges))
      .catch(() => {
        // Privilege lookup failed (e.g. transient network error): open the
        // stream anyway and let the server decide — the 1008 close handler
        // degrades to polling if it is denied. The server stays the authority.
        if (this.currentController === controller) {
          this.openComputeNotificationsWs();
        }
      });
  }

  /**
   * Open the notification stream when the user holds the stream privilege,
   * or fall back to polling the compute list otherwise (the list endpoint
   * carries the runtime state — connected, last error, usage — and the local
   * compute, so polling it replaces the stream for every cache consumer).
   */
  private openStreamOrPoll(controller: Controller, privileges: ReadonlySet<string>) {
    if (this.currentController !== controller) {
      return; // controller switched while the privileges were resolving
    }
    if (privileges.has(this.NOTIFICATION_STREAM_PRIVILEGE)) {
      this.openComputeNotificationsWs();
    } else {
      this.startComputePolling();
    }
  }

  /**
   * Poll the compute list on an interval and push it through the cache, so
   * consumers keep receiving updates when the notification stream cannot be
   * opened (no Notification.Audit privilege, or the server closed the socket
   * with the policy-violation code).
   */
  private startComputePolling() {
    if (this.pollTimer || !this.currentController) {
      return;
    }
    this.fetchComputesIntoCache();
    this.pollTimer = setInterval(() => this.fetchComputesIntoCache(), this.COMPUTE_POLL_INTERVAL_MS);
  }

  private stopComputePolling() {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
  }

  private fetchComputesIntoCache() {
    const controller = this.currentController;
    if (!controller) {
      return;
    }
    this.computeService.getComputes(controller).subscribe({
      next: (computes) => this.setInitialComputes(computes),
      // Keep polling across failures: a transient error must not silently
      // freeze the compute state for users without the stream.
      error: (error) => console.warn('Compute list polling failed', error),
    });
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
        this.wsReconnected.emit();
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

    this.ws.onclose = (event: CloseEvent) => {
      this.ws = null;
      this.stopLivenessCheck();
      // Don't clear currentController - keep it for potential reconnection
      // currentController should only be cleared in disconnect() method
      if (this.intentionalClose) {
        return;
      }
      if (event.code === this.WS_POLICY_VIOLATION_CLOSE_CODE) {
        // The server denied the stream privilege — either at connect time or
        // after a revocation while the stream was open (the server re-checks
        // on every ping tick and closes with this code). Don't fight it with
        // reconnects: degrade to polling the compute list instead.
        this.startComputePolling();
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
    this.stopComputePolling();
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
      case 'settings.updated':
        this.serverSettingsNotificationEmitter.emit(message as ServerSettingsNotification);
        break;
      case 'docker.image.pull':
        this.dockerImagePullEmitter.emit(message as DockerImagePullNotification);
        break;
      case 'docker.image.deleted':
        this.dockerImageDeletedEmitter.emit(message as DockerImageDeletedNotification);
        break;
    }
  }
}
