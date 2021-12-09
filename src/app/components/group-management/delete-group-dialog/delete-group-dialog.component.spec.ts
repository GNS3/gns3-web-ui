import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeleteGroupDialogComponent } from './delete-group-dialog.component';

describe('DeleteGroupDialogComponent', () => {
  let component: DeleteGroupDialogComponent;
  let fixture: ComponentFixture<DeleteGroupDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DeleteGroupDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DeleteGroupDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
