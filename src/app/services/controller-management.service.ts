import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { Controller } from '@models/controller';

export interface ControllerStateEvent {
  controllerName: string;
  status: 'starting' | 'started' | 'errored' | 'stopped' | 'stderr';
  message: string;
}

@Injectable()
export class ControllerManagementService {
  controllerStatusChanged = new Subject<ControllerStateEvent>();

  constructor() {
    // Web application - no local controller support
  }

  get statusChannel() {
    return 'local-controller-status-events';
  }

  async start(controller: Controller) {
    // Web application - controller management is handled by the server
    var startingEvent: ControllerStateEvent = {
      controllerName: controller.name,
      status: 'starting',
      message: '',
    };
    this.controllerStatusChanged.next(startingEvent);
    return Promise.resolve();
  }

  async stop(controller: Controller) {
    // Web application - controller management is handled by the server
    return Promise.resolve();
  }

  async stopAll() {
    // Web application - controller management is handled by the server
    return Promise.resolve();
  }

  getRunningControllers() {
    // Web application - no local controllers
    return [];
  }
}
