import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LabelToMapLabelConverter } from 'app/cartography/converters/map/label-to-map-label-converter';
import { MapLabelToLabelConverter } from 'app/cartography/converters/map/map-label-to-label-converter';
import { MapNodeToNodeConverter } from 'app/cartography/converters/map/map-node-to-node-converter';
import { MapPortToPortConverter } from 'app/cartography/converters/map/map-port-to-port-converter';
import { NodeToMapNodeConverter } from 'app/cartography/converters/map/node-to-map-node-converter';
import { PortToMapPortConverter } from 'app/cartography/converters/map/port-to-map-port-converter';
import { LinksEventSource } from 'app/cartography/events/links-event-source';
import { NodesEventSource } from 'app/cartography/events/nodes-event-source';
import { CssFixer } from 'app/cartography/helpers/css-fixer';
import { FontBBoxCalculator } from 'app/cartography/helpers/font-bbox-calculator';
import { FontFixer } from 'app/cartography/helpers/font-fixer';
import { DrawingLineWidget } from 'app/cartography/widgets/drawing-line';
import { DrawLinkToolComponent } from './draw-link-tool.component';

describe('DrawLinkToolComponent', () => {
  let component: DrawLinkToolComponent;
  let fixture: ComponentFixture<DrawLinkToolComponent>;

  beforeEach(async() => {
   await TestBed.configureTestingModule({
      declarations: [DrawLinkToolComponent],
      providers:[
        DrawingLineWidget,
        NodesEventSource,
        LinksEventSource,
        MapNodeToNodeConverter,
        MapLabelToLabelConverter,
        FontBBoxCalculator,
        MapPortToPortConverter,
        CssFixer,
        FontFixer,
        NodeToMapNodeConverter,
        LabelToMapLabelConverter,
        PortToMapPortConverter
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DrawLinkToolComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
