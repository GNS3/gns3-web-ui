import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeleteResourcePoolComponent } from './delete-resource-pool.component';
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";

class FakeMatDialogRef {

}

describe('DeleteResourcePoolComponent', () => {
  let component: DeleteResourcePoolComponent;
  let fixture: ComponentFixture<DeleteResourcePoolComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DeleteResourcePoolComponent ],
      providers:[
        {provide: MatDialogRef, useClass: FakeMatDialogRef},
        {provide: MAT_DIALOG_DATA, useValue: {}}
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DeleteResourcePoolComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
