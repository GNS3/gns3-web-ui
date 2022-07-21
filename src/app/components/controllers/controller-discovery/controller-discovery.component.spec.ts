import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { Observable } from 'rxjs/Rx';
import{ Controller } from '../../../models/controller';
import { Version } from '../../../models/version';
import { ControllerDatabase } from '../../../services/controller.database';
import { ControllerService } from '../../../services/controller.service';
import { MockedControllerService } from '../../../services/controller.service.spec';
import { VersionService } from '../../../services/version.service';
import { MockedVersionService } from '../../../services/version.service.spec';
import { ControllerDiscoveryComponent } from './controller-discovery.component';

xdescribe('ControllerDiscoveryComponent', () => {
  let component: ControllerDiscoveryComponent;
  let fixture: ComponentFixture<ControllerDiscoveryComponent>;
  let mockedVersionService: MockedVersionService;
  let mockedServerService: MockedControllerService;

  beforeEach(async () => {
    mockedServerService = new MockedControllerService();
    mockedVersionService = new MockedVersionService();
    await TestBed.configureTestingModule({
      imports: [MatCardModule, MatDividerModule],
      providers: [
        { provide: VersionService, useFactory: () => mockedVersionService },
        { provide: ControllerService, useFactory: () => mockedServerService },
        ControllerDatabase,
      ],
      declarations: [ControllerDiscoveryComponent],
    }).compileComponents();
  });

beforeEach(() => {
  fixture = TestBed.createComponent(ControllerDiscoveryComponent);

  component = fixture.componentInstance;

  // we don't really want to run it during testing
  spyOn(component, 'ngOnInit').and.returnValue(null);

  fixture.detectChanges();
});

it('should create', () => {
  expect(component).toBeTruthy();
});

describe('isAvailable', () => {
  it('should return controller object when controller is available', () => {
    const version = new Version();
    version.version = '2.1.8';

    const getVersionSpy = spyOn(mockedVersionService, 'get').and.returnValue(Observable.of(version));

    component.isServerAvailable('127.0.0.1', 3080).subscribe((s) => {
      expect(s.host).toEqual('127.0.0.1');
      expect(s.port).toEqual(3080);
    });

    const controller = new Controller ();
    controller.host = '127.0.0.1';
    controller.port = 3080;

    expect(getVersionSpy).toHaveBeenCalledWith(controller);
  });

  it('should throw error once controller is not available', () => {
    const controller = new Controller ();
    controller.host = '127.0.0.1';
    controller.port = 3080;

    const getVersionSpy = spyOn(mockedVersionService, 'get').and.returnValue(
      Observable.throwError(new Error('controller is unavailable'))
    );
    let hasExecuted = false;

    component.isServerAvailable('127.0.0.1', 3080).subscribe(
      (ver) => { },
      (err) => {
        hasExecuted = true;
        expect(err.toString()).toEqual('Error: controller is unavailable');
      }
    );

    expect(getVersionSpy).toHaveBeenCalledWith(controller);
    expect(hasExecuted).toBeTruthy();
  });
});

describe('discovery', () => {
  it('should discovery all servers available', (done) => {
    const version = new Version();
    version.version = '2.1.8';

    spyOn(component, 'isServerAvailable').and.callFake((ip, port) => {
      const controller = new Controller  ();
      controller.host = ip;
      controller.port = port;
      return Observable.of(controller);
    });

    component.discovery().subscribe((discovered) => {
      expect(discovered[0].host).toEqual('127.0.0.1');
      expect(discovered[0].port).toEqual(3080);

      expect(discovered.length).toEqual(1);

      done();
    });
  });
});

describe('discoverFirstAvailableServer', () => {
  let controller:Controller ;

  beforeEach(function () {
    controller = new Controller  ();
    (controller.host = '199.111.111.1'), (controller.port = 3333);

    spyOn(component, 'discovery').and.callFake(() => {
      return Observable.of([controller]);
    });
  });

  it('should get first controller from discovered and with no added before', fakeAsync(() => {
    expect(component.discoveredServer).toBeUndefined();
    component.discoverFirstAvailableServer();
    tick();
    expect(component.discoveredServer.host).toEqual('199.111.111.1');
    expect(component.discoveredServer.port).toEqual(3333);
  }));

  it('should get first controller from discovered and with already added', fakeAsync(() => {
    mockedServerService.servers.push(controller);

    expect(component.discoveredServer).toBeUndefined();
    component.discoverFirstAvailableServer();
    tick();
    expect(component.discoveredServer).toBeUndefined();
  }));
});

describe('accepting and ignoring found controller', () => {
  let controller:Controller ;
  beforeEach(() => {
    controller = new Controller  ();
    (controller.host = '199.111.111.1'), (controller.port = 3333);
    component.discoveredServer = controller;
  });

  describe('accept', () => {
    it('should add new controller', fakeAsync(() => {
      component.accept(controller);
      tick();
      expect(component.discoveredServer).toBeNull();
      expect(mockedServerService.servers[0].host).toEqual('199.111.111.1');
      expect(mockedServerService.servers[0].name).toEqual('199.111.111.1');
      expect(mockedServerService.servers[0].location).toEqual('remote');
    }));
  });

  describe('ignore', () => {
    it('should reject controller', fakeAsync(() => {
      component.ignore(controller);
      tick();
      expect(component.discoveredServer).toBeNull();
    }));
  });
});
});
