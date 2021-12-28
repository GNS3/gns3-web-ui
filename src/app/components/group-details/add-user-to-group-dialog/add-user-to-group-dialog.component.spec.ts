import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddUserToGroupDialogComponent } from './add-user-to-group-dialog.component';

describe('AddUserToGroupDialogComponent', () => {
  let component: AddUserToGroupDialogComponent;
  let fixture: ComponentFixture<AddUserToGroupDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AddUserToGroupDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AddUserToGroupDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
