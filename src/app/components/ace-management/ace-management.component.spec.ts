import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AceManagementComponent } from './ace-management.component';

describe('AceManagementComponent', () => {
  let component: AceManagementComponent;
  let fixture: ComponentFixture<AceManagementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AceManagementComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AceManagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
