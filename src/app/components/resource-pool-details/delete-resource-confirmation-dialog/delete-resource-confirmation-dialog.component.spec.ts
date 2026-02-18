import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeleteResourceConfirmationDialogComponent } from './delete-resource-confirmation-dialog.component';
import {Resource} from "@models/resourcePools/Resource";
import {DIALOG_DATA} from "@angular/cdk/dialog";
import {MatDialogRef} from "@angular/material/dialog";

class FakeMatDialogRef {

}

describe('DeleteResourceConfirmationDialogComponent', () => {
  let component: DeleteResourceConfirmationDialogComponent;
  let fixture: ComponentFixture<DeleteResourceConfirmationDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DeleteResourceConfirmationDialogComponent ],
      providers: [
        {provide: DIALOG_DATA,  useValue: {}},
        {provide: MatDialogRef, useClass: FakeMatDialogRef}
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DeleteResourceConfirmationDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
