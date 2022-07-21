import{ Controller } from '../models/controller';

export class MockedServerService {
  public servers:Controller [] = [];

  public create(controller:Controller ) {
    return new Promise((resolve, reject) => {
      this.servers.push(controller);
      resolve(controller);
    });
  }

  public get(controller_id: number) {
    const controller = new Controller  ();
    controller.id = controller_id;
    return Promise.resolve(controller);
  }

  public getLocalServer(hostname: string, port: number) {
    return new Promise((resolve, reject) => {
      const controller = new Controller  ();
      controller.id = 99;
      resolve(controller);
    });
  }

  public findAll() {
    return new Promise((resolve, reject) => {
      resolve(this.servers);
    });
  }

  public getServerUrl(controller:Controller ) {
    return `${controller.host}:${controller.port}`;
  }
}
