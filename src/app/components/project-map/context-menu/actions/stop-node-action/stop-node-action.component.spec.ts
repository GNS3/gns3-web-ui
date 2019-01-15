import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { StopNodeActionComponent } from './stop-node-action.component';

describe('StopNodeActionComponent', () => {
  let component: StopNodeActionComponent;
  let fixture: ComponentFixture<StopNodeActionComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [StopNodeActionComponent]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(StopNodeActionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // it('should create', () => {
  //   expect(component).toBeTruthy();
  // });
});
