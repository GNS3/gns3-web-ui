import {async, ComponentFixture, fakeAsync, TestBed, tick} from '@angular/core/testing';
import { MatCardModule } from "@angular/material";

import { Observable } from "rxjs/Rx";

import { ServerDiscoveryComponent } from './server-discovery.component';
import { VersionService } from "../../../services/version.service";
import { MockedVersionService } from "../../../services/version.service.spec";
import { Version } from "../../../models/version";
import { Server } from "../../../models/server";


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

  describe('isAvailable', () => {
    it('should return server object when server is available', () => {
        const server = new Server();
        server.ip = '127.0.0.1';
        server.port = 3080;

        const getVersionSpy = spyOn(mockedVersionService, 'get')
          .and.returnValue(Observable.of(server));

        component.isServerAvailable('127.0.0.1', 3080).subscribe((s) => {
          expect(s.ip).toEqual('127.0.0.1');
          expect(s.port).toEqual(3080);
        });

        expect(getVersionSpy).toHaveBeenCalledWith(server);
    });

    it('should throw error once server is not available', () => {
        const server = new Server();
        server.ip = '127.0.0.1';
        server.port = 3080;

        const getVersionSpy = spyOn(mockedVersionService, 'get')
          .and.returnValue(Observable.throwError(new Error("server is unavailable")));
        let hasExecuted = false;

        component.isServerAvailable('127.0.0.1', 3080).subscribe((ver) => {}, (err) => {
          hasExecuted = true;
          expect(err.toString()).toEqual('Error: server is unavailable');
        });

        expect(getVersionSpy).toHaveBeenCalledWith(server);
        expect(hasExecuted).toBeTruthy();
    });
  });

  // describe("discovery", () => {
  //     it('should discovery single server', () => {
  //       component.discovery([]);
  //     });
  // });

});
