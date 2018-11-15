import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SnapshotsComponent } from './snapshots.component';

describe('SnapshotsComponent', () => {
  let component: SnapshotsComponent;
  let fixture: ComponentFixture<SnapshotsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SnapshotsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SnapshotsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
