import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResourcePoolsManagementComponent } from './resource-pools-management.component';
import {of} from "rxjs";
import {Project} from "@models/project";
import {ToasterService} from "@services/toaster.service";
import {ActivatedRoute} from "@angular/router";
import {ResourcePoolsService} from "@services/resource-pools.service";
import {MatDialog} from "@angular/material/dialog";
import {ControllerService} from "@services/controller.service";


class FakeToastService {

}

class FakeActivatedRoute {
  data = of({controller: {}, pool: {}});
}

class FakeResourcePoolService {
  get(httpcontroller, poolId) {
    return of(undefined);
  }
  getFreeResources() {
    const p = new Project();
    p.name = "test";
    return of(p);
  }
}

class FakeMatDialog {

}

class FakeControllerService {

}

describe('ResourcePoolsManagementComponent', () => {
  let component: ResourcePoolsManagementComponent;
  let fixture: ComponentFixture<ResourcePoolsManagementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [
        {provide: ToasterService, useClass: FakeToastService},
        {provide: ActivatedRoute, useClass: FakeActivatedRoute},
        {provide: ResourcePoolsService, useClass: FakeResourcePoolService},
        {provide: MatDialog, useClass: FakeMatDialog},
        {provide: ControllerService, useClass: FakeControllerService}
      ],
      declarations: [ ResourcePoolsManagementComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ResourcePoolsManagementComponent);
    component = fixture.componentInstance;
    // fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
