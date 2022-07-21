import { Injectable, OnDestroy } from '@angular/core';
import { ElectronService } from 'ngx-electron';
import { Subject } from 'rxjs';
import{ Controller } from '../models/controller';

export interface ControllerStateEvent {
  serverName: string;
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

  async start(controller:Controller ) {
    var startingEvent: ControllerStateEvent = {
      serverName: controller.name,
      status: 'starting',
      message: '',
    };
    this.controllerStatusChanged.next(startingEvent);
    return await this.electronService.remote.require('./local-server.js').startLocalServer(controller);
  }

  async stop(controller:Controller ) {
    return await this.electronService.remote.require('./local-server.js').stopLocalServer(controller);
  }

  async stopAll() {
    return await this.electronService.remote.require('./local-server.js').stopAllLocalServers();
  }

  getRunningServers() {
    if (this.electronService.isElectronApp) {
      return this.electronService.remote.require('./local-server.js').getRunningServers();
    }
    return [];
  }

  ngOnDestroy() {
    if (this.electronService.isElectronApp) {
      this.electronService.ipcRenderer.removeAllListeners(this.statusChannel);
    }
  }
}
