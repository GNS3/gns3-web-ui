import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeleteallfilesDialogComponent } from './deleteallfiles-dialog.component';

describe('DeleteallfilesDialogComponent', () => {
  let component: DeleteallfilesDialogComponent;
  let fixture: ComponentFixture<DeleteallfilesDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DeleteallfilesDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DeleteallfilesDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
