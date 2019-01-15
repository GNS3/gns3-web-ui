import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { StartNodeActionComponent } from './start-node-action.component';

describe('StartNodeActionComponent', () => {
  let component: StartNodeActionComponent;
  let fixture: ComponentFixture<StartNodeActionComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [StartNodeActionComponent]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(StartNodeActionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // it('should create', () => {
  //   expect(component).toBeTruthy();
  // });
});
