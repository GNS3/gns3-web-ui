import { ComponentFixture, TestBed, provideZonelessChangeDetection } from '@angular/core';
import { NodesEventSource } from 'app/cartography/events/nodes-event-source';
import { CssFixer } from 'app/cartography/helpers/css-fixer';
import { FontFixer } from 'app/cartography/helpers/font-fixer';
import { NodeComponent } from './node.component';
import { DraggableComponent } from '../draggable/draggable.component';

describe('NodeComponent', () => {
  let component: NodeComponent;
  let fixture: ComponentFixture<NodeComponent>;

  beforeEach(() => {
   TestBed.configureTestingModule({
      declarations: [NodeComponent, DraggableComponent],
      providers:[
        provideZonelessChangeDetection(),
        CssFixer,
        FontFixer,
        NodesEventSource,
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(NodeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
