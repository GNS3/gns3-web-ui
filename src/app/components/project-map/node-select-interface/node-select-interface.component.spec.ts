import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { NodeSelectInterfaceComponent } from './node-select-interface.component';

describe('NodeSelectInterfaceComponent', () => {
  let component: NodeSelectInterfaceComponent;
  let fixture: ComponentFixture<NodeSelectInterfaceComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [NodeSelectInterfaceComponent]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NodeSelectInterfaceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // it('should create', () => {
  //   expect(component).toBeTruthy();
  // });
});
