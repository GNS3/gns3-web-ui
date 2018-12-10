import { fakeAsync, tick } from '@angular/core/testing';

import { SelectionControlComponent } from './selection-control.component';
import { SelectionManager } from '../../managers/selection-manager';
import { SelectionEventSource } from '../../events/selection-event-source';
import { mock, when, instance } from 'ts-mockito';
import { GraphDataManager } from '../../managers/graph-data-manager';
import { MapNode } from '../../models/map/map-node';
import { MapLink } from '../../models/map/map-link';
import { InRectangleHelper } from '../../helpers/in-rectangle-helper';
import { Rectangle } from '../../models/rectangle';

describe('SelectionControlComponent', () => {
  let component: SelectionControlComponent;
  let manager: SelectionManager;
  let selectionEventSource: SelectionEventSource;

  beforeEach(() => {

    const mockedGraphData = mock(GraphDataManager);

    const node_1 = new MapNode();
    node_1.id = "test1";
    node_1.name = "Node 1";
    node_1.x = 150;
    node_1.y = 150;

    const node_2 = new MapNode();
    node_2.id = "test2";
    node_2.name = "Node 2";
    node_2.x = 300;
    node_2.y = 300;

    const link_1 = new MapLink();
    link_1.id = "test1";

    when(mockedGraphData.getNodes()).thenReturn([node_1, node_2]);
    when(mockedGraphData.getLinks()).thenReturn([link_1]);
    when(mockedGraphData.getDrawings()).thenReturn([]);

    const graphData = instance(mockedGraphData);
    const inRectangleHelper = new InRectangleHelper();

    selectionEventSource = new SelectionEventSource();
    manager = new SelectionManager();

    component = new SelectionControlComponent(selectionEventSource, graphData, inRectangleHelper, manager);
    component.ngOnInit();
  });

  afterEach(() => {
    component.ngOnDestroy();
  })

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('node should be selected', fakeAsync(() => {
    selectionEventSource.selected.next(new Rectangle(100, 100, 100, 100));
    tick();
    expect(manager.getSelected().length).toEqual(1);
  }));

  it('node should be selected and deselected', fakeAsync(() => {
    selectionEventSource.selected.next(new Rectangle(100, 100, 100, 100));
    tick();
    selectionEventSource.selected.next(new Rectangle(350, 350, 100, 100));
    tick();
    expect(manager.getSelected().length).toEqual(0);
  }));
});
