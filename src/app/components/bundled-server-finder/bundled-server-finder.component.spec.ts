import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { ProgressService } from '../../common/progress/progress.service';
import { Server } from '../../models/server';
import { ServerService } from '../../services/server.service';
import { MockedServerService } from '../../services/server.service.spec';
import { MockedProgressService } from '../project-map/project-map.component.spec';
import { BundledServerFinderComponent } from './bundled-server-finder.component';

describe('BundledServerFinderComponent', () => {
  let component: BundledServerFinderComponent;
  let fixture: ComponentFixture<BundledServerFinderComponent>;
  let router: any;
  let service: ServerService;
  let progressService: MockedProgressService = new MockedProgressService();
  let controllerServiceMock: jasmine.SpyObj<ServerService>;


  beforeEach(async () => {
    router = {
      navigate: jasmine.createSpy('navigate'),
    };

    

    controllerServiceMock = jasmine.createSpyObj<ServerService>([
      "getLocalServer"
    ]);


    // serverService = new MockedServerService();
    // spyOn(serverService, 'getLocalServer').and.returnValue(Promise.resolve(server));

    await TestBed.configureTestingModule({
      providers: [
        { provide: Router, useValue: router },
        { provide: ServerService, useValue: controllerServiceMock },
        { provide: ProgressService, useValue: progressService },
      ],
      declarations: [BundledServerFinderComponent],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(BundledServerFinderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and redirect to controller', fakeAsync(() => {
    const controller = new Server();
    controller.id = 99;
    controllerServiceMock.getLocalServer.and.returnValue(
      Promise.resolve(controller)
    );
    expect(component).toBeTruthy();
    tick(101)
    fixture.detectChanges()
    fixture.whenStable().then(() => {
      expect(controllerServiceMock.getLocalServer).toHaveBeenCalledWith('vps3.gns3.net',3000);
      expect(router.navigate).toHaveBeenCalledWith(['/controller', 99, 'projects']);
    })
    service = TestBed.inject(ServerService);
  }));
});
