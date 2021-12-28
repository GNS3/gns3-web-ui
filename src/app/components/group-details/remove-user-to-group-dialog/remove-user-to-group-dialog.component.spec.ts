import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RemoveUserToGroupDialogComponent } from './remove-user-to-group-dialog.component';

describe('RemoveUserToGroupDialogComponent', () => {
  let component: RemoveUserToGroupDialogComponent;
  let fixture: ComponentFixture<RemoveUserToGroupDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RemoveUserToGroupDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RemoveUserToGroupDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
