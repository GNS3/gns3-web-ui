import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddAceDialogComponent } from './add-ace-dialog.component';

describe('AddAceDialogComponent', () => {
  let component: AddAceDialogComponent;
  let fixture: ComponentFixture<AddAceDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AddAceDialogComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddAceDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
