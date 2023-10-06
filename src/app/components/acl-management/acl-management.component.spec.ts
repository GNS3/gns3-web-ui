import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AclManagementComponent } from './acl-management.component';

describe('AclManagementComponent', () => {
  let component: AclManagementComponent;
  let fixture: ComponentFixture<AclManagementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AclManagementComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AclManagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
