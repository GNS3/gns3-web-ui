import { Injectable, OnDestroy } from '@angular/core';
import { Server } from '../models/server';
import { ElectronService } from 'ngx-electron';
import { Subject } from 'rxjs';

export interface ServerStateEvent {
  serverName: string;
  status: 'starting' | 'started' | 'errored' | 'stopped' | 'stderr';
  message: string;
}

@Injectable()
export class ServerManagementService implements OnDestroy {
  serverStatusChanged = new Subject<ServerStateEvent>();

  constructor(private electronService: ElectronService) {
    if (this.electronService.isElectronApp) {
      this.electronService.ipcRenderer.on(this.statusChannel, (event, data) => {
        this.serverStatusChanged.next(data);
      });
    }
  }

  get statusChannel() {
    return 'local-server-status-events';
  }

  async start(server: Server) {
    var startingEvent: ServerStateEvent = {
      serverName: server.name,
      status: 'starting',
      message: '',
    };
    this.serverStatusChanged.next(startingEvent);
    return await this.electronService.remote.require('./local-server.js').startLocalServer(server);
  }

  async stop(server: Server) {
    return await this.electronService.remote.require('./local-server.js').stopLocalServer(server);
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
