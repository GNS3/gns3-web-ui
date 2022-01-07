import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddPermissionLineComponent } from './add-permission-line.component';

describe('AddPermissionLineComponent', () => {
  let component: AddPermissionLineComponent;
  let fixture: ComponentFixture<AddPermissionLineComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AddPermissionLineComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AddPermissionLineComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
