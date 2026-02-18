import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddAceDialogComponent } from './add-ace-dialog.component';
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";
import {AclService} from "@services/acl.service";
import {UserService} from "@services/user.service";
import {GroupService} from "@services/group.service";
import {RoleService} from "@services/role.service";
import {ToasterService} from "@services/toaster.service";

class FakeMatDialogRef {}
class FakeAclService {}
class FakeUserService {}
class FakeGroupService {}
class FakeRoleService {}
class FakeToasterService{}
describe('AddAceDialogComponent', () => {
  let component: AddAceDialogComponent;
  let fixture: ComponentFixture<AddAceDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AddAceDialogComponent ],
      providers: [
        {provide: MatDialogRef, useClass: FakeMatDialogRef},
        {provide: AclService, useClass: FakeAclService},
        {provide: UserService, useClass: FakeUserService},
        {provide: GroupService, useClass: FakeGroupService},
        {provide: RoleService, useClass: FakeRoleService},
        {provide: ToasterService, useClass: FakeToasterService},
        {provide: MAT_DIALOG_DATA, useValue: {endpoints: []}}
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddAceDialogComponent);
    component = fixture.componentInstance;
    // fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
