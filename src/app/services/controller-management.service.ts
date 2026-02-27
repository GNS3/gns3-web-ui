import { Injectable, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { Controller } from '@models/controller';

export interface ControllerStateEvent {
  controllerName: string;
  status: 'starting' | 'started' | 'errored' | 'stopped' | 'stderr';
  message: string;
}

/**
 * Controller management service for remote controllers only.
 * Local controller management has been removed as part of Electron removal.
 */
@Injectable()
export class ControllerManagementService implements OnDestroy {
  controllerStatusChanged = new Subject<ControllerStateEvent>();

  constructor() {}

  get statusChannel() {
    return 'local-controller-status-events';
  }

  /**
   * Local controller management is not supported in web-only mode.
   * Use the GNS3 CLI or traditional GNS3 GUI for local controller management.
   */
  async start(controller: Controller): Promise<void> {
    throw new Error('Local controller management is not supported in web-only mode. Please use the GNS3 CLI or traditional GNS3 GUI for local controller management.');
  }

  /**
   * Local controller management is not supported in web-only mode.
   * Use the GNS3 CLI or traditional GNS3 GUI for local controller management.
   */
  async stop(controller: Controller): Promise<void> {
    throw new Error('Local controller management is not supported in web-only mode. Please use the GNS3 CLI or traditional GNS3 GUI for local controller management.');
  }

  /**
   * Local controller management is not supported in web-only mode.
   * Use the GNS3 CLI or traditional GNS3 GUI for local controller management.
   */
  async stopAll(): Promise<void> {
    throw new Error('Local controller management is not supported in web-only mode. Please use the GNS3 CLI or traditional GNS3 GUI for local controller management.');
  }

  /**
   * Returns empty array as local controllers are not supported in web-only mode.
   */
  getRunningControllers(): Controller[] {
    return [];
  }

  ngOnDestroy() {}
}
