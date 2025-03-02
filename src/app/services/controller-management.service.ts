import { Injectable, OnDestroy } from '@angular/core';
import { ElectronService } from 'ngx-electron';
import { Subject } from 'rxjs';
import { Controller } from '@models/controller';

export interface ControllerStateEvent {
  controllerName: string;
  status: 'starting' | 'started' | 'errored' | 'stopped' | 'stderr';
  message: string;
}

@Injectable()
export class ControllerManagementService implements OnDestroy {
  controllerStatusChanged = new Subject<ControllerStateEvent>();

  constructor(private electronService: ElectronService) {
    if (this.electronService.isElectronApp) {
      this.electronService.ipcRenderer.on(this.statusChannel, (event, data) => {
        this.controllerStatusChanged.next(data);
      });
    }
  }

  get statusChannel() {
    return 'local-controller-status-events';
  }

  async start(controller: Controller ) {
    var startingEvent: ControllerStateEvent = {
      controllerName: controller.name,
      status: 'starting',
      message: '',
    };
    this.controllerStatusChanged.next(startingEvent);
    return await this.electronService.remote.require('./local-controller.js').startLocalController(controller);
  }

  async stop(controller: Controller ) {
    return await this.electronService.remote.require('./local-controller.js').stopLocalController(controller);
  }

  async stopAll() {
    return await this.electronService.remote.require('./local-controller.js').stopAllLocalControllers();
  }

  getRunningControllers() {
    if (this.electronService.isElectronApp) {
      return this.electronService.remote.require('./local-controller.js').getRunningControllers();
    }
    return [];
  }

  ngOnDestroy() {
    if (this.electronService.isElectronApp) {
      this.electronService.ipcRenderer.removeAllListeners(this.statusChannel);
    }
  }
}
