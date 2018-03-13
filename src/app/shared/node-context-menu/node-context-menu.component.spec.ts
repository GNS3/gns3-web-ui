import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { NodeContextMenuComponent } from './node-context-menu.component';

describe('NodeContextMenuComponent', () => {
  let component: NodeContextMenuComponent;
  let fixture: ComponentFixture<NodeContextMenuComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ NodeContextMenuComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NodeContextMenuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // it('should create', () => {
  //   expect(component).toBeTruthy();
  // });
});
