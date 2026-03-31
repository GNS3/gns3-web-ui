import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';

import { DeleteAceDialogComponent } from './delete-ace-dialog.component';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { NO_ERRORS_SCHEMA } from '@angular/core';

class FakeMatDialogRef {}
describe('DeleteAceDialogComponent', () => {
  let component: DeleteAceDialogComponent;
  let fixture: ComponentFixture<DeleteAceDialogComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      
      imports: [
    DeleteAceDialogComponent,MatDialogModule, MatButtonModule],
      providers: [
        provideZonelessChangeDetection(),
        { provide: MatDialogRef, useClass: FakeMatDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: {} },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(DeleteAceDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
