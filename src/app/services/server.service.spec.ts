import { Server } from '../models/server';

export class MockedServerService {
  public servers: Server[] = [];

  public create(server: Server) {
    return new Promise((resolve, reject) => {
      this.servers.push(server);
      resolve(server);
    });
  }

  public get(server_id: number) {
    const server = new Server();
    server.id = server_id;
    return Promise.resolve(server);
  }

  public getLocalServer(hostname: string, port: number) {
    return new Promise((resolve, reject) => {
      const server = new Server();
      server.id = 99;
      resolve(server);
    });
  }

  public findAll() {
    return new Promise((resolve, reject) => {
      resolve(this.servers);
    });
  }

  public getServerUrl(server: Server) {
    return `${server.host}:${server.port}`;
  }
}
