import { async, ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { Router } from '@angular/router';

import { LocalServerComponent } from './local-server.component';
import { ServerService } from '../../services/server.service';
import { MockedServerService } from '../../services/server.service.spec';
import { Server } from '../../models/server';

describe('LocalServerComponent', () => {
  let component: LocalServerComponent;
  let fixture: ComponentFixture<LocalServerComponent>;
  let router: any;
  let serverService: any;

  beforeEach(async(() => {
    router = {
      navigate: jasmine.createSpy('navigate')
    };

    const server = new Server();
    server.id = 99;

    serverService = new MockedServerService();
    spyOn(serverService, 'getLocalServer').and.returnValue(Promise.resolve(server));

    TestBed.configureTestingModule({
      providers: [{ provide: Router, useValue: router }, { provide: ServerService, useValue: serverService }],
      declarations: [LocalServerComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(LocalServerComponent);
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
