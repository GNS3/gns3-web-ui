import { Injectable } from '@angular/core';
import { AngularIndexedDB } from 'angular2-indexeddb';

@Injectable()
export class IndexedDbService {
  private db: AngularIndexedDB;

  constructor() {
    this.db = new AngularIndexedDB('gns3-web-ui', 1);
  }

  public get() {
    return this.db;
  }
}
