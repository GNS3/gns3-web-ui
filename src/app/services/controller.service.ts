import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import {Controller , ServerProtocol } from '../models/controller';
import { HttpController } from './http-controller.service';

@Injectable()
export class ControllerService {
  private controllerIds: string[] = [];
  public serviceInitialized: Subject<boolean> = new Subject<boolean>();
  public isServiceInitialized: boolean;

  constructor(private httpController: HttpController) {
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

  public get(id: number): Promise<Controller> {
    let controller:Controller  = JSON.parse(localStorage.getItem(`controller-${id}`));
    let promise = new Promise<Controller>((resolve) => {
      resolve(controller);
    });
    return promise;
  }

  public create(controller:Controller ) {
    controller.id = this.controllerIds.length + 1;
    localStorage.setItem(`controller-${controller.id}`, JSON.stringify(controller));

    this.controllerIds.push(`controller-${controller.id}`);
    this.updatecontrollerIds();

    let promise = new Promise<Controller>((resolve) => {
      resolve(controller);
    });
    return promise;
  }

  public update(controller:Controller ) {
    localStorage.removeItem(`controller-${controller.id}`);
    localStorage.setItem(`controller-${controller.id}`, JSON.stringify(controller));

    let promise = new Promise<Controller>((resolve) => {
      resolve(controller);
    });
    return promise;
  }

  public findAll() {
    let promise = new Promise<Controller[]>((resolve) => {
      let controllers:Controller [] = [];
      this.controllerIds.forEach((n) => {
        let controller:Controller  = JSON.parse(localStorage.getItem(n));
        controllers.push(controller);
      });
      resolve(controllers);
    });
    return promise;
  }

  public delete(controller:Controller ) {
    localStorage.removeItem(`controller-${controller.id}`);
    this.controllerIds = this.controllerIds.filter((n) => n !== `controller-${controller.id}`);
    this.updatecontrollerIds();

    let promise = new Promise((resolve) => {
      resolve(controller.id);
    });
    return promise;
  }

  public getServerUrl(controller:Controller ) {
    return `${controller.protocol}//${controller.host}:${controller.port}/`;
  }

  public checkServerVersion(controller:Controller ): Observable<any> {
    return this.httpController.get(controller, '/version');
  }

  public getLocalController(host: string, port: number) {
    const promise = new Promise((resolve, reject) => {
      this.findAll().then((controllers:Controller []) => {
        const local = controllers.find((controller) => controller.location === 'bundled');
        if (local) {
          local.host = host;
          local.port = port;
          local.protocol = location.protocol as ServerProtocol;
          this.update(local).then((updated) => {
            resolve(updated);
          }, reject);
        } else {
          const controller = new Controller ();
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
