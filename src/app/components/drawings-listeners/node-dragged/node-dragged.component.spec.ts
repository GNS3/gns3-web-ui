import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { Observable } from 'rxjs';
import { NodesDataSource } from '../../../cartography/datasources/nodes-datasource';
import { DraggedDataEvent } from '../../../cartography/events/event-source';
import { NodesEventSource } from '../../../cartography/events/nodes-event-source';
import { MapLabel } from '../../../cartography/models/map/map-label';
import { MapNode } from '../../../cartography/models/map/map-node';
import { NodeService } from '../../../services/node.service';
import { MockedNodesDataSource, MockedNodeService } from '../../project-map/project-map.component.spec';
import { NodeDraggedComponent } from './node-dragged.component';

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
        { provide: NodesEventSource, useValue: mockedNodesEventSource },
      ],
      declarations: [NodeDraggedComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NodeDraggedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    component.ngOnDestroy();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call node service when node dragged', () => {
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
      locked: false,
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
      z: 0,
    };
    const draggedDataEvent = new DraggedDataEvent<MapNode>(mapNode, 0, 0);
    spyOn(mockedNodeService, 'updatePosition').and.returnValue(Observable.of());

    mockedNodesEventSource.dragged.emit(draggedDataEvent);

    expect(mockedNodeService.updatePosition).toHaveBeenCalled();
  });
});
