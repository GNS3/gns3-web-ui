import { async, ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { MatCardModule, MatDividerModule } from '@angular/material';

import { Observable } from 'rxjs/Rx';

import { ServerDiscoveryComponent } from './server-discovery.component';
import { VersionService } from '../../../services/version.service';
import { MockedVersionService } from '../../../services/version.service.spec';
import { Version } from '../../../models/version';
import { Server } from '../../../models/server';
import { ServerService } from '../../../services/server.service';
import { MockedServerService } from '../../../services/server.service.spec';
import { ServerDatabase } from '../../../services/server.database';

describe('ServerDiscoveryComponent', () => {
  let component: ServerDiscoveryComponent;
  let fixture: ComponentFixture<ServerDiscoveryComponent>;
  let mockedVersionService: MockedVersionService;
  let mockedServerService: MockedServerService;

  beforeEach(async(() => {
    mockedServerService = new MockedServerService();
    mockedVersionService = new MockedVersionService();
    TestBed.configureTestingModule({
      imports: [MatCardModule, MatDividerModule],
      providers: [
        { provide: VersionService, useFactory: () => mockedVersionService },
        { provide: ServerService, useFactory: () => mockedServerService },
        ServerDatabase
      ],
      declarations: [ServerDiscoveryComponent]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ServerDiscoveryComponent);

    component = fixture.componentInstance;

    // we don't really want to run it during testing
    spyOn(component, 'ngOnInit').and.returnValue(null);

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('isAvailable', () => {
    it('should return server object when server is available', () => {
      const version = new Version();
      version.version = '2.1.8';

      const getVersionSpy = spyOn(mockedVersionService, 'get').and.returnValue(Observable.of(version));

      component.isServerAvailable('127.0.0.1', 3080).subscribe(s => {
        expect(s.ip).toEqual('127.0.0.1');
        expect(s.port).toEqual(3080);
      });

      const server = new Server();
      server.ip = '127.0.0.1';
      server.port = 3080;

      expect(getVersionSpy).toHaveBeenCalledWith(server);
    });

    it('should throw error once server is not available', () => {
      const server = new Server();
      server.ip = '127.0.0.1';
      server.port = 3080;

      const getVersionSpy = spyOn(mockedVersionService, 'get').and.returnValue(
        Observable.throwError(new Error('server is unavailable'))
      );
      let hasExecuted = false;

      component.isServerAvailable('127.0.0.1', 3080).subscribe(
        ver => {},
        err => {
          hasExecuted = true;
          expect(err.toString()).toEqual('Error: server is unavailable');
        }
      );

      expect(getVersionSpy).toHaveBeenCalledWith(server);
      expect(hasExecuted).toBeTruthy();
    });
  });

  describe('discovery', () => {
    it('should discovery all servers available', done => {
      const version = new Version();
      version.version = '2.1.8';

      spyOn(component, 'isServerAvailable').and.callFake((ip, port) => {
        const server = new Server();
        server.ip = ip;
        server.port = port;
        return Observable.of(server);
      });

      component.discovery().subscribe(discovered => {
        expect(discovered[0].ip).toEqual('127.0.0.1');
        expect(discovered[0].port).toEqual(3080);

        expect(discovered.length).toEqual(1);

        done();
      });
    });
  });

  describe('discoverFirstAvailableServer', () => {
    let server: Server;

    beforeEach(function() {
      server = new Server();
      (server.ip = '199.111.111.1'), (server.port = 3333);

      spyOn(component, 'discovery').and.callFake(() => {
        return Observable.of([server]);
      });
    });

    it('should get first server from discovered and with no added before', fakeAsync(() => {
      expect(component.discoveredServer).toBeUndefined();
      component.discoverFirstAvailableServer();
      tick();
      expect(component.discoveredServer.ip).toEqual('199.111.111.1');
      expect(component.discoveredServer.port).toEqual(3333);
    }));

    it('should get first server from discovered and with already added', fakeAsync(() => {
      mockedServerService.servers.push(server);

      expect(component.discoveredServer).toBeUndefined();
      component.discoverFirstAvailableServer();
      tick();
      expect(component.discoveredServer).toBeUndefined();
    }));
  });

  describe('accepting and ignoring found server', () => {
    let server: Server;
    beforeEach(() => {
      server = new Server();
      (server.ip = '199.111.111.1'), (server.port = 3333);
      component.discoveredServer = server;
    });

    describe('accept', () => {
      it('should add new server', fakeAsync(() => {
        component.accept(server);
        tick();
        expect(component.discoveredServer).toBeNull();
        expect(mockedServerService.servers[0].ip).toEqual('199.111.111.1');
        expect(mockedServerService.servers[0].name).toEqual('199.111.111.1');
      }));
    });

    describe('ignore', () => {
      it('should reject server', fakeAsync(() => {
        component.ignore(server);
        tick();
        expect(component.discoveredServer).toBeNull();
      }));
    });
  });
});
