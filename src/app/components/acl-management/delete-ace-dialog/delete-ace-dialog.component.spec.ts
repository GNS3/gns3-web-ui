import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeleteAceDialogComponent } from './delete-ace-dialog.component';
import {MAT_DIALOG_DATA, MatDialog, MatDialogRef} from "@angular/material/dialog";

class FakeMatDialogRef {

}
describe('DeleteAceDialogComponent', () => {
  let component: DeleteAceDialogComponent;
  let fixture: ComponentFixture<DeleteAceDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DeleteAceDialogComponent ],
      providers: [
        {provide: MatDialogRef, useClass: FakeMatDialogRef},
        {provide: MAT_DIALOG_DATA, useValue: {}}
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DeleteAceDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
