import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DraggableSelectionComponent } from './draggable-selection.component';

describe('DraggableSelectionComponent', () => {
  let component: DraggableSelectionComponent;
  let fixture: ComponentFixture<DraggableSelectionComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DraggableSelectionComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DraggableSelectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // it('should create', () => {
  //   expect(component).toBeTruthy();
  // });
});
