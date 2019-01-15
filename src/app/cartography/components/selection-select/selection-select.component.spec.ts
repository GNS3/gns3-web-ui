import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SelectionSelectComponent } from './selection-select.component';

describe('SelectionSelectComponent', () => {
  let component: SelectionSelectComponent;
  let fixture: ComponentFixture<SelectionSelectComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [SelectionSelectComponent]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SelectionSelectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // it('should create', () => {
  //   expect(component).toBeTruthy();
  // });
});
