import { Injectable } from '@angular/core';

import {IndexedDbService} from "./indexed-db.service";
import {Server} from "../models/server";


@Injectable()
export class ServerService {
  private tablename = "servers";
  private ready: Promise<any>;

  constructor(private indexedDbService: IndexedDbService) {
    this.ready = indexedDbService.get().openDatabase(1, (evt) => {
      const store = evt.currentTarget.result.createObjectStore(
        this.tablename, { keyPath: "id", autoIncrement: true });
    });
  }

  public get(id: number) {
    return this.onReady(() =>
      this.indexedDbService.get().getByKey(this.tablename,  id));
  }

  public getLocalOrRemote(id: string) {
    if (id === 'local') {

    }
    return this.get(parseInt(id, 10));
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

  public findAll() {
    return this.onReady(() =>
      this.indexedDbService.get().getAll(this.tablename));
  }

  public delete(server: Server) {
    return this.onReady(() =>
      this.indexedDbService.get().delete(this.tablename, server.id));
  }

  private onReady(query) {
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
