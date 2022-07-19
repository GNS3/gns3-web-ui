import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { Server, ServerProtocol } from '../models/server';
import { HttpServer } from './http-server.service';

@Injectable()
export class ServerService {
  private controllerIds: string[] = [];
  public serviceInitialized: Subject<boolean> = new Subject<boolean>();
  public isServiceInitialized: boolean;

  constructor(private httpServer: HttpServer) {
    this.controllerIds = this.getServerIds();
    this.isServiceInitialized = true;
    this.serviceInitialized.next(this.isServiceInitialized);
  }

  getServerIds() : string[]{
    let str = localStorage.getItem("controllerIds");
    if (str?.length > 0) {
      return str.split(",");
    }
    return [];
  }

  updateServerIds() {
    localStorage.removeItem("controllerIds");
    localStorage.setItem("controllerIds", this.controllerIds.toString());
  }

  public get(id: number): Promise<Server> {
    let server: Server = JSON.parse(localStorage.getItem(`controller-${id}`));
    let promise = new Promise<Server>((resolve) => {
      resolve(server);
    });
    return promise;
  }

  public create(server: Server) {
    server.id = this.controllerIds.length + 1;
    localStorage.setItem(`controller-${server.id}`, JSON.stringify(server));

    this.controllerIds.push(`controller-${server.id}`);
    this.updateServerIds();

    let promise = new Promise<Server>((resolve) => {
      resolve(server);
    });
    return promise;
  }

  public update(server: Server) {
    localStorage.removeItem(`controller-${server.id}`);
    localStorage.setItem(`controller-${server.id}`, JSON.stringify(server));

    let promise = new Promise<Server>((resolve) => {
      resolve(server);
    });
    return promise;
  }

  public findAll() {
    let promise = new Promise<Server[]>((resolve) => {
      let servers: Server[] = [];
      this.controllerIds.forEach((n) => {
        let server: Server = JSON.parse(localStorage.getItem(n));
        servers.push(server);
      });
      resolve(servers);
    });
    return promise;
  }

  public delete(server: Server) {
    localStorage.removeItem(`controller-${server.id}`);
    this.controllerIds = this.controllerIds.filter((n) => n !== `controller-${server.id}`);
    this.updateServerIds();

    let promise = new Promise((resolve) => {
      resolve(server.id);
    });
    return promise;
  }

  public getServerUrl(server: Server) {
    return `${server.protocol}//${server.host}:${server.port}/`;
  }

  public checkServerVersion(server: Server): Observable<any> {
    return this.httpServer.get(server, '/version');
  }

  public getLocalServer(host: string, port: number) {
    const promise = new Promise((resolve, reject) => {
      this.findAll().then((servers: Server[]) => {
        const local = servers.find((server) => server.location === 'bundled');
        if (local) {
          local.host = host;
          local.port = port;
          local.protocol = location.protocol as ServerProtocol;
          this.update(local).then((updated) => {
            resolve(updated);
          }, reject);
        } else {
          const server = new Server();
          server.name = 'local';
          server.host = host;
          server.port = port;
          server.location = 'bundled';
          server.protocol = location.protocol as ServerProtocol;
          this.create(server).then((created) => {
            resolve(created);
          }, reject);
        }
      }, reject);
    });

    return promise;
  }
}
