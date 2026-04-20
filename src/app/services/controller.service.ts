import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { Controller, ControllerProtocol } from '@models/controller';
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

  getcontrollerIds(): string[] {
    let str = localStorage.getItem('controllerIds');
    if (str?.length > 0) {
      const ids = str.split(',');
      // Remove duplicates and empty strings
      return [...new Set(ids)].filter((n) => n && n.trim().length > 0);
    }
    return [];
  }

  updatecontrollerIds() {
    localStorage.removeItem('controllerIds');
    localStorage.setItem('controllerIds', this.controllerIds.toString());
  }

  public get(id: number): Promise<Controller> {
    let controller: Controller = JSON.parse(localStorage.getItem(`controller-${id}`));
    let promise = new Promise<Controller>((resolve) => {
      resolve(controller);
    });
    return promise;
  }

  public create(controller: Controller) {
    // Check for duplicate name
    const existingControllers = this.findAllSync();
    if (existingControllers.some((c) => c.name === controller.name)) {
      return Promise.reject(new Error(`Controller with name "${controller.name}" already exists`));
    }

    // Generate unique ID by finding the maximum existing ID and adding 1
    const existingIds = this.controllerIds
      .map((n) => parseInt(n.replace('controller-', ''), 10))
      .filter((id) => !isNaN(id));
    const maxId = existingIds.length > 0 ? Math.max(...existingIds) : 0;
    controller.id = maxId + 1;

    localStorage.setItem(`controller-${controller.id}`, JSON.stringify(controller));

    this.controllerIds.push(`controller-${controller.id}`);
    this.updatecontrollerIds();

    let promise = new Promise<Controller>((resolve) => {
      resolve(controller);
    });
    return promise;
  }

  private findAllSync(): Controller[] {
    const controllers: Controller[] = [];
    this.controllerIds.forEach((n) => {
      const data = localStorage.getItem(n);
      if (data) {
        controllers.push(JSON.parse(data));
      }
    });
    return controllers;
  }

  public isControllerNameTaken(name: string): boolean {
    const existingControllers = this.findAllSync();
    return existingControllers.some((c) => c.name === name);
  }

  public update(controller: Controller) {
    localStorage.removeItem(`controller-${controller.id}`);
    localStorage.setItem(`controller-${controller.id}`, JSON.stringify(controller));

    let promise = new Promise<Controller>((resolve) => {
      resolve(controller);
    });
    return promise;
  }

  public findAll() {
    let promise = new Promise<Controller[]>((resolve) => {
      let controllers: Controller[] = [];
      this.controllerIds.forEach((n) => {
        const data = localStorage.getItem(n);
        if (data) {
          const controller: Controller = JSON.parse(data);
          controllers.push(controller);
        }
      });
      resolve(controllers);
    });
    return promise;
  }

  public delete(controller: Controller) {
    localStorage.removeItem(`controller-${controller.id}`);
    this.controllerIds = this.controllerIds.filter((n) => n !== `controller-${controller.id}`);
    this.updatecontrollerIds();

    let promise = new Promise((resolve) => {
      resolve(controller.id);
    });
    return promise;
  }

  public getControllerUrl(controller: Controller) {
    return `${controller.protocol}//${controller.host}:${controller.port}/`;
  }

  public checkControllerVersion(controller: Controller): Observable<any> {
    return this.httpController.get(controller, '/version');
  }

  public getLocalController(host: string, port: number) {
    const promise = new Promise((resolve, reject) => {
      this.findAll().then((controllers: Controller[]) => {
        const local = controllers.find((controller) => controller.location === 'bundled');
        if (local) {
          local.host = host;
          local.port = port;
          local.protocol = location.protocol as ControllerProtocol;
          this.update(local).then((updated) => {
            resolve(updated);
          }, reject);
        } else {
          const controller = new Controller();
          controller.name = 'local';
          controller.host = host;
          controller.port = port;
          controller.location = 'bundled';
          controller.protocol = location.protocol as ControllerProtocol;
          this.create(controller).then((created) => {
            resolve(created);
          }, reject);
        }
      }, reject);
    });

    return promise;
  }
}
