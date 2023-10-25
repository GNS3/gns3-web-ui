import {ComponentFixture, TestBed} from '@angular/core/testing';

import {ResourcePoolDetailsComponent} from './resource-pool-details.component';
import {ToasterService} from "@services/toaster.service";
import {ActivatedRoute} from "@angular/router";
import {ResourcePoolsService} from "@services/resource-pools.service";
import {MatDialog} from "@angular/material/dialog";
import {MatAutocomplete} from "@angular/material/autocomplete";
import {of} from "rxjs";
import {HttpController} from "@services/http-controller.service";
import {Project} from "@models/project";

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

describe('ResourcePoolDetailsComponent', () => {
  let component: ResourcePoolDetailsComponent;
  let fixture: ComponentFixture<ResourcePoolDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ResourcePoolDetailsComponent, MatAutocomplete],
      providers: [
        {provide: ToasterService, useClass: FakeToastService},
        {provide: ActivatedRoute, useClass: FakeActivatedRoute},
        {provide: ResourcePoolsService, useClass: FakeResourcePoolService},
        {provide: MatDialog, useClass: FakeMatDialog}
      ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(ResourcePoolDetailsComponent);
    component = fixture.componentInstance;
    // fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
