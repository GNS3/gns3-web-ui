import { NodeDraggedComponent } from './node-dragged.component';
import { ComponentFixture, async, TestBed } from '@angular/core/testing';
import { NodesDataSource } from '../../../cartography/datasources/nodes-datasource';
import { NodeService } from '../../../services/node.service';
import { NodesEventSource } from '../../../cartography/events/nodes-event-source';
import { MockedNodeService, MockedNodesDataSource } from '../../project-map/project-map.component.spec';
import { DraggedDataEvent } from '../../../cartography/events/event-source';
import { MapNode } from '../../../cartography/models/map/map-node';
import { MapLabel } from '../../../cartography/models/map/map-label';
import { Observable } from 'rxjs';

describe('NodeDraggedComponent', () => {
  let component: NodeDraggedComponent;
  let fixture: ComponentFixture<NodeDraggedComponent>;
  let mockedNodesDataSource = new MockedNodesDataSource();
  let mockedNodeService = new MockedNodeService();
  let mockedNodesEventSource = new NodesEventSource();

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: NodesDataSource, useValue: mockedNodesDataSource },
        { provide: NodeService, useValue: mockedNodeService },
        { provide: NodesEventSource, useValue: mockedNodesEventSource }
      ],
      declarations: [NodeDraggedComponent]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NodeDraggedComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call node service when node dragged', () => {
    fixture.detectChanges();
    const mapNode: MapNode = {
      id: 'sampleId',
      commandLine: 'sampleCommandLine',
      computeId: 'sampleComputeId',
      console: 0,
      consoleHost: 'sampleConsoleHost',
      consoleType: 'sampleConsoleType',
      firstPortName: 'sampleFirstPortName',
      height: 0,
      label: {} as MapLabel,
      name: 'sampleName',
      nodeDirectory: 'sampleNodeDirectory',
      nodeType: 'sampleNodeType',
      portNameFormat: 'samplePortNameFormat',
      portSegmentSize: 0,
      ports: [],
      projectId: 'sampleProjectId',
      status: 'sampleStatus',
      symbol: 'sampleSymbol',
      symbolUrl: 'sampleUrl',
      width: 0,
      x: 0,
      y: 0,
      z: 0
    };
    const draggedDataEvent = new DraggedDataEvent<MapNode>(mapNode, 0, 0);
    spyOn(mockedNodeService, 'updatePosition').and.returnValue(Observable.of({}));

    mockedNodesEventSource.dragged.emit(draggedDataEvent);

    expect(mockedNodeService.updatePosition).toHaveBeenCalled();
  });
});
