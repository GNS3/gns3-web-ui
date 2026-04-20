import { EventEmitter, Injectable } from '@angular/core';
import { environment } from 'environments/environment';
import { Controller } from '@models/controller';
import { Compute } from '@models/compute';

export interface ComputeNotification {
  action: 'compute.created' | 'compute.updated' | 'compute.deleted';
  event: Compute;
}

@Injectable()
export class NotificationService {
  private ws: WebSocket;
  private currentController: Controller;

  // Event emitters for compute notifications
  public computeNotificationEmitter = new EventEmitter<ComputeNotification>();

  // Cache for compute data - stores the latest compute states
  private computeCache: Map<string, Compute> = new Map();

  // EventEmitter for cache updates
  public computeCacheUpdated = new EventEmitter<Compute[]>();

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

  connectToComputeNotifications(controller: Controller) {
    // If already connected to the same controller, skip
    if (this.ws && this.currentController === controller) {
      return;
    }

    // Close existing connection if different controller
    this.disconnect();

    this.currentController = controller;
    this.ws = new WebSocket(this.notificationsPath(controller));

    this.ws.onmessage = (event: MessageEvent) => {
      const message = JSON.parse(event.data);
      this.handleMessage(message);
    };

    this.ws.onerror = () => {
      console.error('Compute notifications WebSocket error');
    };

    this.ws.onclose = () => {
      this.ws = null;
      // Don't clear currentController - keep it for potential reconnection
      // currentController should only be cleared in disconnect() method
    };
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
      this.currentController = null;
      // Clear cache when disconnecting
      this.computeCache.clear();
    }
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
    }
  }
}
