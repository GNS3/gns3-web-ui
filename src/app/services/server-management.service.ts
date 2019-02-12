import { Injectable, OnDestroy } from '@angular/core';
import { Server } from '../models/server';
import { ElectronService } from 'ngx-electron';
import { Subject } from 'rxjs';

export interface ServerStateEvent {
  serverName: string;
  status: "started" | "errored" | "stopped";
  message: string;
}

@Injectable()
export class ServerManagementService implements OnDestroy {

  serverStatusChanged = new Subject<ServerStateEvent>();

  constructor(
    private electronService: ElectronService
  ) {
    if(this.electronService.isElectronApp) {
      this.electronService.ipcRenderer.on(this.statusChannel, (event, data) => {
        this.serverStatusChanged.next(data);
      });
    }
  }

  get statusChannel() {
    return 'local-server-status-events';
  }

  async start(server: Server) {
    await this.electronService.remote.require('./local-server.js').startLocalServer(server);
  }

  async stop(server: Server) {
    await this.electronService.remote.require('./local-server.js').stopLocalServer(server);
  }

  ngOnDestroy() {
    if(this.electronService.isElectronApp) {
      this.electronService.ipcRenderer.removeAllListeners(this.statusChannel);
    }
  }
}
