import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { LocalServerComponent } from './local-server.component';
import { Location } from "@angular/common";
import { RouterTestingModule } from "@angular/router/testing";
import { Router } from "@angular/router";
import { ServerService } from "../../services/server.service";
import { MockedServerService } from "../../services/server.service.spec";


class MockedLocation {
  private _hostname: string;
  private _port: number;

  get hostname(): string {
    return this._hostname;
  }

  set hostname(hostname: string) {
    this._hostname = hostname;
  }

  get port(): number {
    return this._port;
  }

  set port(port: number) {
    this._port = port;
  }
}

describe('LocalServerComponent', () => {
  let component: LocalServerComponent;
  let fixture: ComponentFixture<LocalServerComponent>;
  let router: Router;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [ RouterTestingModule.withRoutes([]) ],
      providers: [
        { provide: Location, useClass: MockedLocation},
        { provide: ServerService, useClass: MockedServerService }
      ],
      declarations: [ LocalServerComponent ]
    })
    .compileComponents();

    router = TestBed.get(Router);
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LocalServerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
