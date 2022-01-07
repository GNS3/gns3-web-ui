import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PermissionEditLineComponent } from './permission-edit-line.component';

describe('PermissionAddEditLineComponent', () => {
  let component: PermissionEditLineComponent;
  let fixture: ComponentFixture<PermissionEditLineComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PermissionEditLineComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PermissionEditLineComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
