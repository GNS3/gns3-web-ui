import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Controller } from '@models/controller';

@Injectable()
export class ControllerDatabase {
  dataChange: BehaviorSubject<Controller[]> = new BehaviorSubject<Controller[]>([]);

  constructor() {}

  get data(): Controller[] {
    return this.dataChange.value;
  }

  public addController(controller: Controller) {
    const controllers = this.data.slice();
    controllers.push(controller);
    this.dataChange.next(controllers);
  }

  public addControllers(controllers: Controller[]) {
    this.dataChange.next(controllers);
  }

  public remove(controller: Controller) {
    const index = this.data.indexOf(controller);
    if (index >= 0) {
      this.data.splice(index, 1);
      this.dataChange.next(this.data.slice());
    }
  }

  public find(controllerName: string) {
    return this.data.find((controller) => controller.name === controllerName);
  }

  public findById(controllerId: number) {
    return this.data.find((controller) => controller.id === controllerId);
  }

  public findIndex(controllerName: string) {
    return this.data.findIndex((controller) => controller.name === controllerName);
  }

  public findIndexById(controllerId: number) {
    return this.data.findIndex((controller) => controller.id === controllerId);
  }

  public update(controller: Controller) {
    // Use id to find the controller, since name might be changed
    const index = this.findIndexById(controller.id);
    if (index >= 0) {
      this.data[index] = controller;
      this.dataChange.next(this.data.slice());
    }
  }
}
