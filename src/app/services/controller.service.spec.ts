import { Subject, of } from 'rxjs';
import { Controller } from '@models/controller';

export class MockedControllerService {
  public controllers: Controller[] = [];
  public isServiceInitialized = true;
  public serviceInitialized = of(true);

  public create(controller: Controller) {
    return new Promise((resolve, reject) => {
      this.controllers.push(controller);
      resolve(controller);
    });
  }

  public get(controller_id: number) {
    const controller = new Controller();
    controller.id = controller_id;
    return Promise.resolve(controller);
  }

  public getLocalController(hostname: string, port: number) {
    return new Promise((resolve, reject) => {
      const controller = new Controller();
      controller.id = 99;
      resolve(controller);
    });
  }

  public findAll() {
    return new Promise((resolve, reject) => {
      resolve(this.controllers);
    });
  }

  public getControllerUrl(controller: Controller) {
    return `${controller.host}:${controller.port}`;
  }
}
