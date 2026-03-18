import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PrivilegeComponent } from './privilege.component';
import {GroupPrivilegesPipe} from "@components/role-management/role-detail/privilege/group-privileges.pipe";

describe('PrivilegeComponent', () => {
  let component: PrivilegeComponent;
  let fixture: ComponentFixture<PrivilegeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PrivilegeComponent, GroupPrivilegesPipe ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PrivilegeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
