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
