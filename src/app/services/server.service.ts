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
    this.controllerIds = this.getcontrollerIds();
    this.isServiceInitialized = true;
    this.serviceInitialized.next(this.isServiceInitialized);
  }

  getcontrollerIds() : string[]{
    let str = localStorage.getItem("controllerIds");
    if (str?.length > 0) {
      return str.split(",");
    }
    return [];
  }

  updatecontrollerIds() {
    localStorage.removeItem("controllerIds");
    localStorage.setItem("controllerIds", this.controllerIds.toString());
  }

  public get(id: number): Promise<Server> {
    let controller: Server = JSON.parse(localStorage.getItem(`controller-${id}`));
    let promise = new Promise<Server>((resolve) => {
      resolve(controller);
    });
    return promise;
  }

  public create(controller: Server) {
    controller.id = this.controllerIds.length + 1;
    localStorage.setItem(`controller-${controller.id}`, JSON.stringify(controller));

    this.controllerIds.push(`controller-${controller.id}`);
    this.updatecontrollerIds();

    let promise = new Promise<Server>((resolve) => {
      resolve(controller);
    });
    return promise;
  }

  public update(controller: Server) {
    localStorage.removeItem(`controller-${controller.id}`);
    localStorage.setItem(`controller-${controller.id}`, JSON.stringify(controller));

    let promise = new Promise<Server>((resolve) => {
      resolve(controller);
    });
    return promise;
  }

  public findAll() {
    let promise = new Promise<Server[]>((resolve) => {
      let servers: Server[] = [];
      this.controllerIds.forEach((n) => {
        let controller: Server = JSON.parse(localStorage.getItem(n));
        servers.push(controller);
      });
      resolve(servers);
    });
    return promise;
  }

  public delete(controller: Server) {
    localStorage.removeItem(`controller-${controller.id}`);
    this.controllerIds = this.controllerIds.filter((n) => n !== `controller-${controller.id}`);
    this.updatecontrollerIds();

    let promise = new Promise((resolve) => {
      resolve(controller.id);
    });
    return promise;
  }

  public getServerUrl(controller: Server) {
    return `${controller.protocol}//${controller.host}:${controller.port}/`;
  }

  public checkServerVersion(controller: Server): Observable<any> {
    return this.httpServer.get(controller, '/version');
  }

  public getLocalServer(host: string, port: number) {
    const promise = new Promise((resolve, reject) => {
      this.findAll().then((servers: Server[]) => {
        const local = servers.find((controller) => controller.location === 'bundled');
        if (local) {
          local.host = host;
          local.port = port;
          local.protocol = location.protocol as ServerProtocol;
          this.update(local).then((updated) => {
            resolve(updated);
          }, reject);
        } else {
          const controller = new Server();
          controller.name = 'local';
          controller.host = host;
          controller.port = port;
          controller.location = 'bundled';
          controller.protocol = location.protocol as ServerProtocol;
          this.create(controller).then((created) => {
            resolve(created);
          }, reject);
        }
      }, reject);
    });

    return promise;
  }
}
