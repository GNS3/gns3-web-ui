import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddResourcePoolDialogComponent } from './add-resource-pool-dialog.component';
import {of} from "rxjs";
import {Project} from "@models/project";
import {ToasterService} from "@services/toaster.service";
import {ActivatedRoute} from "@angular/router";
import {ResourcePoolsService} from "@services/resource-pools.service";
import {MAT_DIALOG_DATA, MatDialog, MatDialogRef} from "@angular/material/dialog";
import {UntypedFormBuilder} from "@angular/forms";
import {PoolNameValidator} from "@components/resource-pools-management/add-resource-pool-dialog/PoolNameValidator";



class FakeToastService {

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

class FakeMatDialogRef {

}

class FakeUntypedFormBuilder {

}

class FakePoolNameValidator {

}

describe('AddResourcePoolDialogComponent', () => {
  let component: AddResourcePoolDialogComponent;
  let fixture: ComponentFixture<AddResourcePoolDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AddResourcePoolDialogComponent ],
      providers: [
        {provide: ToasterService, useClass: FakeToastService},
        {provide: ResourcePoolsService, useClass: FakeResourcePoolService},
        {provide: MatDialogRef, useClass: FakeMatDialogRef},
        {provide: MAT_DIALOG_DATA, useValue: {}},
        {provide: UntypedFormBuilder, useClass: FakeUntypedFormBuilder},
        {provide: PoolNameValidator, useClass: FakePoolNameValidator}
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddResourcePoolDialogComponent);
    component = fixture.componentInstance;
    // fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
