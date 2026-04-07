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
      console.log('[NotificationService] Already connected to controller, skipping');
      return;
    }

    // Close existing connection if different controller
    this.disconnect();

    this.currentController = controller;
    const wsUrl = this.notificationsPath(controller);
    console.log('[NotificationService] Connecting to WebSocket:', wsUrl);
    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      console.log('[NotificationService] WebSocket connected successfully');
    };

    this.ws.onmessage = (event: MessageEvent) => {
      const message = JSON.parse(event.data);
      console.log('[NotificationService] WebSocket message received:', message);
      this.handleMessage(message);
    };

    this.ws.onerror = (error) => {
      console.error('[NotificationService] WebSocket error:', error);
    };

    this.ws.onclose = () => {
      console.log('[NotificationService] WebSocket closed');
      this.ws = null;
      this.currentController = null;
    };
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
      this.currentController = null;
    }
  }

  private handleMessage(message: { action: string; event: any }) {
    switch (message.action) {
      case 'compute.created':
      case 'compute.updated':
      case 'compute.deleted':
        this.computeNotificationEmitter.emit(message as ComputeNotification);
        break;
    }
  }
}
