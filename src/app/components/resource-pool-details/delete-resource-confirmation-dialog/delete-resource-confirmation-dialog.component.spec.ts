import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeleteResourceConfirmationDialogComponent } from './delete-resource-confirmation-dialog.component';
import {Resource} from "@models/resourcePools/Resource";
import {DIALOG_DATA} from "@angular/cdk/dialog";
import {MatDialogRef} from "@angular/material/dialog";
import { MatButtonModule } from '@angular/material/button';
import { NO_ERRORS_SCHEMA } from '@angular/core';

class FakeMatDialogRef {

}

describe('DeleteResourceConfirmationDialogComponent', () => {
  let component: DeleteResourceConfirmationDialogComponent;
  let fixture: ComponentFixture<DeleteResourceConfirmationDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DeleteResourceConfirmationDialogComponent ],
      imports: [ MatButtonModule ],
      providers: [
        {provide: DIALOG_DATA,  useValue: {}},
        {provide: MatDialogRef, useClass: FakeMatDialogRef}
      ],
      schemas: [NO_ERRORS_SCHEMA]
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
