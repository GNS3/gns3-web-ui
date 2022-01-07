import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeletePermissionDialogComponent } from './delete-permission-dialog.component';

describe('DeletePermissionDialogComponent', () => {
  let component: DeletePermissionDialogComponent;
  let fixture: ComponentFixture<DeletePermissionDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DeletePermissionDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DeletePermissionDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
