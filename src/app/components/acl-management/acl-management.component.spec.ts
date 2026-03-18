import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AclManagementComponent } from './acl-management.component';
import {ActivatedRoute} from "@angular/router";
import {ToasterService} from "@services/toaster.service";
import {MatDialog} from "@angular/material/dialog";
import {AclService} from "@services/acl.service";
import {of} from "rxjs";
import {ControllerService} from "@services/controller.service";
import {FatalLinkerError} from "@angular/compiler-cli/linker";

class FakeToastService {

}

class FakeActivatedRoute {
  data = of({controller: {}, pool: {}});
}

class FakeMatDialog {

}

class FakeAclService {

}

class FakeControllerService {

}



describe('AclManagementComponent', () => {
  let component: AclManagementComponent;
  let fixture: ComponentFixture<AclManagementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AclManagementComponent ],
      providers: [
        {provide: ToasterService, useClass: FakeToastService},
        {provide: ActivatedRoute, useClass: FakeActivatedRoute},
        {provide: MatDialog, useClass: FakeMatDialog},
        {provide: AclService, useClass: FakeAclService},
        {provide: ControllerService, useClass: FakeControllerService}
      ],
    })
    .compileComponents();

    fixture = TestBed.createComponent(AclManagementComponent);
    component = fixture.componentInstance;
    // fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
