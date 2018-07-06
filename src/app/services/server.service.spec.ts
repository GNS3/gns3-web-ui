import { TestBed } from '@angular/core/testing';

import { ServerService } from './server.service';
import { Server } from "../models/server";
import { IndexedDbService } from "./indexed-db.service";
import { AngularIndexedDB } from "angular2-indexeddb";
import Spy = jasmine.Spy;


export class MockedServerService {
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
}


describe('ServerService', () => {
  let indexedDbService: IndexedDbService;
  let db: AngularIndexedDB;
  let service: ServerService;
  let openDatabaseSpy: Spy;

  beforeEach(() => {
    indexedDbService = new IndexedDbService();

    db = indexedDbService.get();

    openDatabaseSpy = spyOn(db, 'openDatabase').and.returnValue(Promise.resolve(true));

    TestBed.configureTestingModule({
      providers: [
        ServerService,
        { provide: IndexedDbService, useValue: indexedDbService}
      ]
    });

    service = TestBed.get(ServerService);
  });

  it('should be created and create database', () => {
    expect(service).toBeTruthy();
    expect(db.openDatabase).toHaveBeenCalled();
    expect(openDatabaseSpy.calls.first().args[0]).toEqual(1);

    const evnt = {
      currentTarget: {
        result: {
          createObjectStore: function () {}
        }
      }
    };

    spyOn(evnt.currentTarget.result, 'createObjectStore');

    const upgradeCallback = openDatabaseSpy.calls.first().args[1];
    upgradeCallback(evnt);

    expect(evnt.currentTarget.result.createObjectStore).toHaveBeenCalledWith( 'servers', { keyPath: 'id', autoIncrement: true });
  });

  describe('operations on records', () => {
    let record: any;

    beforeEach(() => {
      record = new Server();
      record.name = 'test';
    });

    it('should get an object', (done) => {
      spyOn(db, 'getByKey').and.returnValue(Promise.resolve([record]));

      service.get(1).then((result) => {
        expect(db.getByKey).toHaveBeenCalledWith('servers', 1);
        expect(result).toEqual([record]);
        done();
      });
    });

    it('should create an object', (done) => {
      const created = new Server();
      created.id = 22;

      spyOn(db, 'add').and.returnValue(Promise.resolve(created));

      service.create(record).then((result) => {
        expect(db.add).toHaveBeenCalledWith('servers', record);
        done();
      });
    });

    it('should update an object', (done) => {
      spyOn(db, 'update').and.returnValue(Promise.resolve(record));

      service.update(record).then((result) => {
        expect(db.update).toHaveBeenCalledWith('servers', record);
        expect(result).toEqual(record);
        done();
      });
    });

    it('should delete an object', (done) => {
      record.id = 88;

      spyOn(db, 'delete').and.returnValue(Promise.resolve());

      service.delete(record).then(() => {
        expect(db.delete).toHaveBeenCalledWith('servers', record.id);
        done();
      });
    });
  });

  it('should call findAll', (done) => {
    spyOn(db, 'getAll').and.returnValue(Promise.resolve(true));

    service.findAll().then((result) => {
        expect(result).toEqual(true);
        expect(db.getAll).toHaveBeenCalledWith('servers');
        done();
    });
  });

  it('should create local server when missing', (done) => {
    spyOn(db, 'getAll').and.returnValue(Promise.resolve([]));
    spyOn(service, 'create').and.returnValue(Promise.resolve(new Server()));

    const expectedServer = new Server();
    expectedServer.name = 'local';
    expectedServer.ip = 'hostname';
    expectedServer.port = 9999;
    expectedServer.is_local = true;

    service.getLocalServer('hostname', 9999).then(() => {
      expect(service.create).toHaveBeenCalledWith(expectedServer)
      done();
    });
  });

  it('should update local server when found', (done) => {
    const server = new Server();
    server.name = 'local';
    server.ip = 'hostname';
    server.port = 9999;
    server.is_local = true;

    spyOn(db, 'getAll').and.returnValue(Promise.resolve([server]));
    spyOn(service, 'update').and.returnValue(Promise.resolve(new Server()));

    service.getLocalServer('hostname-2', 11111).then(() => {
      server.ip = 'hostname-2';
      server.port = 11111;

      expect(service.update).toHaveBeenCalledWith(server);
      done();
    });
  });

});
