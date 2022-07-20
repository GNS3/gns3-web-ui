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

  public addServer(controller: Server) {
    const servers = this.data.slice();
    servers.push(controller);
    this.dataChange.next(servers);
  }

  public addServers(servers: Server[]) {
    this.dataChange.next(servers);
  }

  public remove(controller: Server) {
    const index = this.data.indexOf(controller);
    if (index >= 0) {
      this.data.splice(index, 1);
      this.dataChange.next(this.data.slice());
    }
  }

  public find(serverName: string) {
    return this.data.find((controller) => controller.name === serverName);
  }

  public findIndex(serverName: string) {
    return this.data.findIndex((controller) => controller.name === serverName);
  }

  public update(controller: Server) {
    const index = this.findIndex(controller.name);
    if (index >= 0) {
      this.data[index] = controller;
      this.dataChange.next(this.data.slice());
    }
  }
}
