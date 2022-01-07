import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PermissionsManagementComponent } from './permissions-management.component';

describe('PermissionsManagementComponent', () => {
  let component: PermissionsManagementComponent;
  let fixture: ComponentFixture<PermissionsManagementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PermissionsManagementComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PermissionsManagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
