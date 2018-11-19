import { Rectangle } from "../models/rectangle";
import { InRectangleHelper } from "../helpers/in-rectangle-helper";
import { MapNode } from "../models/map/map-node";
import { MapLink } from "../models/map/map-link";
import { mock, instance, when } from "ts-mockito";
import { fakeAsync, tick } from "@angular/core/testing";
import { SelectionListener } from "./selection-listener";
import { SelectionManager } from "../managers/selection-manager";
import { GraphDataManager } from "../managers/graph-data-manager";
import { SelectionTool } from "../tools/selection-tool";
import { Context } from "../models/context";


describe('SelectionListener', () => {
  let selectionListener: SelectionListener;
  let manager: SelectionManager;
  let selectionTool: SelectionTool;

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

    manager = new SelectionManager();
    selectionTool = new SelectionTool(new Context());
    selectionListener = new SelectionListener(selectionTool, graphData, inRectangleHelper, manager);
    selectionListener.onInit(null);
  });
  
  afterEach(() => {
    selectionListener.onDestroy();
  })

  it('node should be selected', fakeAsync(() => {
    selectionTool.rectangleSelected.next(new Rectangle(100, 100, 100, 100));
    tick();
    expect(manager.getSelected().length).toEqual(1);
  }));

  it('node should be selected and deselected', fakeAsync(() => {
    selectionTool.rectangleSelected.next(new Rectangle(100, 100, 100, 100));
    tick();
    selectionTool.rectangleSelected.next(new Rectangle(350, 350, 100, 100));
    tick();
    expect(manager.getSelected().length).toEqual(0);
  }));

});
