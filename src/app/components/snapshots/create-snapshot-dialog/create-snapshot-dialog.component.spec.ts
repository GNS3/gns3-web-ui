import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateSnapshotDialogComponent } from './create-snapshot-dialog.component';

describe('CreateSnapshotDialogComponent', () => {
  let component: CreateSnapshotDialogComponent;
  let fixture: ComponentFixture<CreateSnapshotDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CreateSnapshotDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateSnapshotDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
