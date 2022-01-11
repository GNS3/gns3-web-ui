import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddRoleToGroupComponent } from './add-role-to-group.component';

describe('AddRoleToGroupComponent', () => {
  let component: AddRoleToGroupComponent;
  let fixture: ComponentFixture<AddRoleToGroupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AddRoleToGroupComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AddRoleToGroupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
