import { NodeLabelDraggedComponent } from './node-label-dragged.component';
import { ComponentFixture, TestBed, async } from '@angular/core/testing';
import { NodesDataSource } from '../../../cartography/datasources/nodes-datasource';
import { NodeService } from '../../../services/node.service';
import { MapLabelToLabelConverter } from '../../../cartography/converters/map/map-label-to-label-converter';
import { NodesEventSource } from '../../../cartography/events/nodes-event-source';
import { CssFixer } from '../../../cartography/helpers/css-fixer';
import { FontFixer } from '../../../cartography/helpers/font-fixer';
import { FontBBoxCalculator } from '../../../cartography/helpers/font-bbox-calculator';
import { MockedNodeService, MockedNodesDataSource } from '../../project-map/project-map.component.spec';
import { DraggedDataEvent } from '../../../cartography/events/event-source';
import { MapLabel } from '../../../cartography/models/map/map-label';
import { Observable } from 'rxjs';

describe('NodeLabelDraggedComponent', () => {
  let component: NodeLabelDraggedComponent;
  let fixture: ComponentFixture<NodeLabelDraggedComponent>;
  let mockedNodesDataSource = new MockedNodesDataSource();
  let mockedNodeService = new MockedNodeService();
  let mockedNodesEventSource = new NodesEventSource();
  let mapLabelToLabelConverter = new MapLabelToLabelConverter(
    new FontBBoxCalculator(),
    new CssFixer(),
    new FontFixer()
  );

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: NodesDataSource, useValue: mockedNodesDataSource },
        { provide: NodeService, useValue: mockedNodeService },
        { provide: NodesEventSource, useValue: mockedNodesEventSource },
        { provide: MapLabelToLabelConverter, useValue: mapLabelToLabelConverter }
      ],
      declarations: [NodeLabelDraggedComponent]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NodeLabelDraggedComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call node service when node label dragged', () => {
    fixture.detectChanges();
    const mapLabel: MapLabel = {
      id: 'sample id',
      rotation: 0,
      style: 'sample style',
      text: 'sample text',
      x: 0,
      y: 0,
      originalX: 0,
      originalY: 0,
      nodeId: 'node id'
    };
    const nodeDraggedDataEvent = new DraggedDataEvent<MapLabel>(mapLabel, 0, 0);
    spyOn(mockedNodeService, 'updateLabel').and.returnValue(Observable.of({}));

    mockedNodesEventSource.labelDragged.emit(nodeDraggedDataEvent);

    expect(mockedNodeService.updateLabel).toHaveBeenCalled();
  });
});
