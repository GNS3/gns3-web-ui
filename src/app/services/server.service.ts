import { Injectable } from '@angular/core';
import { IndexedDbService } from './indexed-db.service';
import { Server } from '../models/server';
import { Observable } from 'rxjs';
import { HttpServer } from './http-server.service';
import { ToasterService } from './toaster.service';

@Injectable()
export class ServerService {
  private tablename = 'servers';
  private ready: Promise<any>;
  private isIncognitoMode: boolean = false;
  private serverIdsInIncognitoMode: string[] = [];

  constructor(
    private indexedDbService: IndexedDbService,
    private httpServer: HttpServer,
    private toasterService: ToasterService
  ) {
    this.ready = indexedDbService.get().openDatabase(1, evt => {
      evt.currentTarget.result.createObjectStore(this.tablename, { keyPath: 'id', autoIncrement: true });
    });

    this.ready.then(() => {}).catch(() => {
      this.isIncognitoMode = true;
    })
  }

  public get(id: number): Promise<Server> {
    if (this.isIncognitoMode) {
      let server: Server = JSON.parse(localStorage.getItem(`server-${id}`));
      let promise = new Promise<Server>(resolve => {
        return server;
      });
      return promise;
    }

    return this.onReady(() => this.indexedDbService.get().getByKey(this.tablename, id)) as Promise<Server>;
  }

  public create(server: Server) {
    if (this.isIncognitoMode) {
      server.id = this.serverIdsInIncognitoMode.length + 1;
      localStorage.setItem(`server-${server.id}`, JSON.stringify(server));
      let promise = new Promise<Server>(resolve => {
        return server;
      });
      return promise;
    }

    return this.onReady(() => {
      const promise = new Promise((resolve, reject) => {
        this.indexedDbService
          .get()
          .add(this.tablename, server)
          .then(added => {
            server.id = added.key;
            resolve(server);
          }, reject);
      });
      return promise;
    });
  }

  public update(server: Server) {
    if (this.isIncognitoMode) {
      let promise = new Promise<Server>(resolve => {
        return [];
      });
      return promise;
    }

    return this.onReady(() => {
      const promise = new Promise((resolve, reject) => {
        this.indexedDbService
          .get()
          .update(this.tablename, server)
          .then(updated => {
            resolve(server);
          }, reject);
      });
      return promise;
    });
  }

  public findAll() {
    if (this.isIncognitoMode) {
      let promise = new Promise<Server[]>(resolve => {
        return [];
      });
      return promise;
    }

    return this.onReady(() => this.indexedDbService.get().getAll(this.tablename)) as Promise<Server[]>;
  }

  public delete(server: Server) {
    if (this.isIncognitoMode) {
      let promise = new Promise(resolve => {
        return [];
      });
      return promise;
    }

    return this.onReady(() => this.indexedDbService.get().delete(this.tablename, server.id));
  }

  public getServerUrl(server: Server) {
    return `http://${server.host}:${server.port}/`;
  }

  public checkServerVersion(server: Server): Observable<any> {
    return this.httpServer.get(server, '/version');
  }

  public getLocalServer(host: string, port: number) {
    if (this.isIncognitoMode) {
      let promise = new Promise(resolve => {
        return [];
      });
      return promise;
    }

    const promise = new Promise((resolve, reject) => {
      this.findAll().then((servers: Server[]) => {
        const local = servers.find(server => server.location === 'bundled');
        if (local) {
          local.host = host;
          local.port = port;
          this.update(local).then(updated => {
            resolve(updated);
          }, reject);
        } else {
          const server = new Server();
          server.name = 'local';
          server.host = host;
          server.port = port;
          server.location = 'bundled';
          this.create(server).then(created => {
            resolve(created);
          }, reject);
        }
      }, reject);
    });

    return promise;
  }

  protected onReady(query) {
    const promise = new Promise((resolve, reject) => {
      this.ready.then(
        () => {
          query().then(
            result => {
              resolve(result);
            },
            error => {
              reject(error);
            }
          );
        },
        error => {
          reject(error);
        }
      );
    });
    return promise;
  }
}
