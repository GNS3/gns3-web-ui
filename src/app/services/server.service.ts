import { Injectable } from '@angular/core';
import { IndexedDbService } from './indexed-db.service';
import { Server } from '../models/server';
import { Observable } from 'rxjs';
import { HttpServer } from './http-server.service';

@Injectable()
export class ServerService {
  private tablename = 'servers';
  private ready: Promise<any>;

  constructor(
    private indexedDbService: IndexedDbService,
    private httpServer: HttpServer
  ) {
    this.ready = indexedDbService.get().openDatabase(1, evt => {
      evt.currentTarget.result.createObjectStore(this.tablename, { keyPath: 'id', autoIncrement: true });
    });
  }

  public get(id: number): Promise<Server> {
    return this.onReady(() => this.indexedDbService.get().getByKey(this.tablename, id)) as Promise<Server>;
  }

  public create(server: Server) {
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
    return this.onReady(() => this.indexedDbService.get().getAll(this.tablename)) as Promise<Server[]>;
  }

  public delete(server: Server) {
    return this.onReady(() => this.indexedDbService.get().delete(this.tablename, server.id));
  }

  public getServerUrl(server: Server) {
    return `http://${server.host}:${server.port}/`;
  }

  public checkServerVersion(server: Server): Observable<any> {
    return this.httpServer.get(server, '/version');
  }

  public getLocalServer(host: string, port: number) {
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
