import { Server } from '../models/server';

export class MockedServerService {
  public servers: Server[] = [];

  public create(controller: Server) {
    return new Promise((resolve, reject) => {
      this.servers.push(controller);
      resolve(controller);
    });
  }

  public get(controller_id: number) {
    const controller = new Server();
    controller.id = controller_id;
    return Promise.resolve(controller);
  }

  public getLocalServer(hostname: string, port: number) {
    return new Promise((resolve, reject) => {
      const controller = new Server();
      controller.id = 99;
      resolve(controller);
    });
  }

  public findAll() {
    return new Promise((resolve, reject) => {
      resolve(this.servers);
    });
  }

  public getServerUrl(controller: Server) {
    return `${controller.host}:${controller.port}`;
  }
}
