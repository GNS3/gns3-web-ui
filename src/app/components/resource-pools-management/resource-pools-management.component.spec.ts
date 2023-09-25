import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResourcePoolsManagementComponent } from './resource-pools-management.component';

describe('ResourcePoolsManagementComponent', () => {
  let component: ResourcePoolsManagementComponent;
  let fixture: ComponentFixture<ResourcePoolsManagementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ResourcePoolsManagementComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ResourcePoolsManagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
