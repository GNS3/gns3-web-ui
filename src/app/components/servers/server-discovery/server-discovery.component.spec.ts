import {async, ComponentFixture, fakeAsync, TestBed, tick} from '@angular/core/testing';

import { ServerDiscoveryComponent } from './server-discovery.component';
import { MatCardModule } from "@angular/material";
import { VersionService } from "../../../services/version.service";
import {MockedVersionService} from "../../../services/version.service.spec";
import {Observable} from "rxjs/Rx";
import {Version} from "../../../models/version";
import {Server} from "../../../models/server";


describe('ServerDiscoveryComponent', () => {
  let component: ServerDiscoveryComponent;
  let fixture: ComponentFixture<ServerDiscoveryComponent>;
  let mockedVersionService: MockedVersionService;

  beforeEach(async(() => {
    mockedVersionService = new MockedVersionService();
    TestBed.configureTestingModule({
      imports: [ MatCardModule ],
      providers: [
        { provide: VersionService, useFactory: () => mockedVersionService }
      ],
      declarations: [ ServerDiscoveryComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ServerDiscoveryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // it('should discovery new server with no added yet', () => {
  //   const server = component.discovery([]);
  //   expect(server.ip);
  // });

  describe('isAvailable', () => {
    it('should return version when server is available', () => {
        const version = new Version();
        version.version = '2.1.8';
        const getVersionSpy = spyOn(mockedVersionService, 'get')
          .and.returnValue(Observable.of(version));

        component.isServerAvailable('127.0.0.1', 3080).subscribe((ver) => {
          expect(ver.version).toEqual('2.1.8');
        });

        const server = new Server();
        server.ip = '127.0.0.1';
        server.port = 3080;
        expect(getVersionSpy).toHaveBeenCalledWith(server);
    });

    it('should throw error once server is not available', () => {
        const version = new Version();
        version.version = '2.1.8';
        const getVersionSpy = spyOn(mockedVersionService, 'get')
          .and.returnValue(Observable.throwError(new Error("server is unavailable")));
        let hasExecuted = false;

        component.isServerAvailable('127.0.0.1', 3080).subscribe((ver) => {}, (err) => {
          hasExecuted = true;
          expect(err.toString()).toEqual('Error: server is unavailable');
        });

        const server = new Server();
        server.ip = '127.0.0.1';
        server.port = 3080;
        expect(getVersionSpy).toHaveBeenCalledWith(server);
        expect(hasExecuted).toBeTruthy();
    });
  });

  describe("discovery", () => {
      it('should discovery single server', () => {
        // component.discovery([]).
      });
  });

});
