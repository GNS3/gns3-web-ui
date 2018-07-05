import { Injectable } from '@angular/core';

import {IndexedDbService} from "./indexed-db.service";
import {Server} from "../models/server";
import { Observable } from "rxjs/Observable";


@Injectable()
export class ServerService {
  private tablename = "servers";
  private ready: Promise<any>;

  constructor(private indexedDbService: IndexedDbService) {
    this.ready = indexedDbService.get().openDatabase(1, (evt) => {
      evt.currentTarget.result.createObjectStore(
        this.tablename, { keyPath: "id", autoIncrement: true });
    });
  }

  public get(id: number) {
    return this.onReady(() =>
      this.indexedDbService.get().getByKey(this.tablename,  id));
  }

  public create(server: Server) {
    return this.onReady(() => {
      const promise = new Promise((resolve, reject) => {
        this.indexedDbService.get().add(this.tablename, server).then((added) => {
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
        this.indexedDbService.get().update(this.tablename, server).then((updated) => {
          resolve(server);
        }, reject);
      });
      return promise;
    });
  }

  public findAll() {
    return this.onReady(() =>
      this.indexedDbService.get().getAll(this.tablename));
  }

  public delete(server: Server) {
    return this.onReady(() =>
      this.indexedDbService.get().delete(this.tablename, server.id));
  }

  public getLocalServer(ip: string, port: number) {
    const promise = new Promise((resolve, reject) => {
      this.findAll().then((servers: Server[]) => {
        const local = servers.find((server) => server.is_local);
        if (local) {
          local.ip = ip;
          local.port = port;
          this.update(local).then((updated) => {
            resolve(updated);
          }, reject);
        } else {
          const server = new Server();
          server.name = 'local';
          server.ip = ip;
          server.port = port;
          server.is_local = true;
          this.create(server).then((created) => {
            resolve(created);
          }, reject);
        }
      }, reject);
    });

    return promise;
  }

  protected onReady(query) {
    const promise = new Promise((resolve, reject) => {
      this.ready.then(() => {
        query()
          .then((result) => {
            resolve(result);
          }, (error) => {
            reject(error);
          });
      }, (error) => {
        reject(error);
      });
    });
    return promise;
  }

}
