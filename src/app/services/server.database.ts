import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Server } from '../models/server';

@Injectable()
export class ServerDatabase {
  dataChange: BehaviorSubject<Server[]> = new BehaviorSubject<Server[]>([]);

  constructor() {}

  get data(): Server[] {
    return this.dataChange.value;
  }

  public addServer(server: Server) {
    const servers = this.data.slice();
    servers.push(server);
    this.dataChange.next(servers);
  }

  public addServers(servers: Server[]) {
    this.dataChange.next(servers);
  }

  public remove(server: Server) {
    const index = this.data.indexOf(server);
    if (index >= 0) {
      this.data.splice(index, 1);
      this.dataChange.next(this.data.slice());
    }
  }

  public find(serverName: string) {
    return this.data.find((server) => server.name === serverName);
  }

  public findIndex(serverName: string) {
    return this.data.findIndex((server) => server.name === serverName);
  }

  public update(server: Server) {
    const index = this.findIndex(server.name);
    if (index >= 0) {
      this.data[index] = server;
      this.dataChange.next(this.data.slice());
    }
  }
}
