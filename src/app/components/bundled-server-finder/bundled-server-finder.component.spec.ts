import { async, ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { Router } from '@angular/router';

import { BundledServerFinderComponent } from './bundled-server-finder.component';
import { ServerService } from '../../services/server.service';
import { MockedServerService } from '../../services/server.service.spec';
import { Server } from '../../models/server';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ProgressService } from '../../common/progress/progress.service';
import { MockedProgressService } from '../project-map/project-map.component.spec';

describe('BundledServerFinderComponent', () => {
  let component: BundledServerFinderComponent;
  let fixture: ComponentFixture<BundledServerFinderComponent>;
  let router: any;
  let serverService: any;
  let progressService: MockedProgressService = new MockedProgressService();

  beforeEach(async(() => {
    router = {
      navigate: jasmine.createSpy('navigate'),
    };

    const server = new Server();
    server.id = 99;

    serverService = new MockedServerService();
    spyOn(serverService, 'getLocalServer').and.returnValue(Promise.resolve(server));

    TestBed.configureTestingModule({
      providers: [
        { provide: Router, useValue: router },
        { provide: ServerService, useValue: serverService },
        { provide: ProgressService, useValue: progressService },
      ],
      declarations: [BundledServerFinderComponent],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(BundledServerFinderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create and redirect to server', fakeAsync(() => {
    expect(component).toBeTruthy();
    expect(serverService.getLocalServer).toHaveBeenCalled();
    tick();
    expect(router.navigate).toHaveBeenCalledWith(['/server', 99, 'projects']);
  }));
});
