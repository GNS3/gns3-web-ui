import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NodesMenuConfirmationDialogComponent } from './nodes-menu-confirmation-dialog.component';

describe('NodesMenuConfirmationDialogComponent', () => {
  let component: NodesMenuConfirmationDialogComponent;
  let fixture: ComponentFixture<NodesMenuConfirmationDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ NodesMenuConfirmationDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(NodesMenuConfirmationDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
