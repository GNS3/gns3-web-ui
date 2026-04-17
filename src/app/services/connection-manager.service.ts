import { Injectable } from '@angular/core';
import { Controller } from '@models/controller';
import { NotificationService } from '@services/notification.service';

/**
 * ConnectionManagerService - Manages application-level WebSocket connections
 *
 * Responsibilities:
 * - Establishes WebSocket connection after successful login
 * - Maintains single connection throughout application lifecycle
 * - Disconnects only on logout or controller switch
 * - Prevents duplicate connections to the same controller
 */
@Injectable()
export class ConnectionManagerService {
  private currentController: Controller | null = null;

  constructor(private notificationService: NotificationService) {}

  /**
   * Establish WebSocket connection for the specified controller
   * Called after successful login or when switching controllers
   */
  establishConnection(controller: Controller): void {
    // Skip if already connected to the same controller
    if (this.currentController && this.currentController.id === controller.id) {
      return;
    }

    // Disconnect existing connection if switching controllers
    if (this.currentController) {
      this.disconnect();
    }

    // Establish new connection
    this.notificationService.connectToComputeNotifications(controller);
    this.currentController = controller;
  }

  /**
   * Disconnect WebSocket connection
   * Called on logout or explicit controller switch
   */
  disconnect(): void {
    this.notificationService.disconnect();
    this.currentController = null;
  }

  /**
   * Get the currently connected controller
   */
  getCurrentController(): Controller {
    return this.currentController;
  }

  /**
   * Check if connected to a specific controller
   */
  isConnectedTo(controller: Controller): boolean {
    return this.currentController && this.currentController.id === controller.id;
  }
}
