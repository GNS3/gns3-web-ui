import { Injectable } from '@angular/core';
import { AngularIndexedDB } from 'angular2-indexeddb';

@Injectable()
export class IndexedDbService {
  static VERSION = 1;
  static DATABASE = 'gns3-web-ui';

  private db: AngularIndexedDB;

  constructor() {
    this.db = new AngularIndexedDB(IndexedDbService.DATABASE, IndexedDbService.VERSION);
  }

  public get() {
    return this.db;
  }
}
