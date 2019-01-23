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
}
