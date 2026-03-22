import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DeleteRoleDialogComponent } from './delete-role-dialog.component';

describe('DeleteRoleDialogComponent', () => {
  let component: DeleteRoleDialogComponent;
  let fixture: ComponentFixture<DeleteRoleDialogComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [MatDialogModule],
      providers: [
        provideZonelessChangeDetection(),
        { provide: MatDialogRef, useValue: {} },
        { provide: MAT_DIALOG_DATA, useValue: {} },
      ],
      declarations: [DeleteRoleDialogComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DeleteRoleDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
