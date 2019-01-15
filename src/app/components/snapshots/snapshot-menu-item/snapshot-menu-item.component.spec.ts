import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SnapshotMenuItemComponent } from './snapshot-menu-item.component';

describe('SnapshotMenuItemComponent', () => {
  let component: SnapshotMenuItemComponent;
  let fixture: ComponentFixture<SnapshotMenuItemComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [SnapshotMenuItemComponent]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SnapshotMenuItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // it('should create', () => {
  //   expect(component).toBeTruthy();
  // });
});
