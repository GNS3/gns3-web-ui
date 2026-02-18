import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NodesEventSource } from 'app/cartography/events/nodes-event-source';
import { CssFixer } from 'app/cartography/helpers/css-fixer';
import { FontFixer } from 'app/cartography/helpers/font-fixer';
import { NodeComponent } from './node.component';

describe('NodeComponent', () => {
  let component: NodeComponent;
  let fixture: ComponentFixture<NodeComponent>;

  beforeEach(async() => {
   await TestBed.configureTestingModule({
      declarations: [NodeComponent],
      providers:[ 
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
