import { Subject} from "rxjs/Subject";

import { Node } from "../models/node";
import { Rectangle } from "../models/rectangle";
import { SelectionManager } from "./selection-manager";
import { NodesDataSource } from "../datasources/nodes-datasource";
import { LinksDataSource } from "../datasources/links-datasource";
import { InRectangleHelper } from "../../map/helpers/in-rectangle-helper";


describe('SelectionManager', () => {
  let manager: SelectionManager;
  let selectedRectangleSubject: Subject<Rectangle>;
  let nodesDataSource: NodesDataSource;

  beforeEach(() => {
    const linksDataSourec = new LinksDataSource();
    const inRectangleHelper = new InRectangleHelper();

    selectedRectangleSubject = new Subject<Rectangle>();

    nodesDataSource = new NodesDataSource();

    manager = new SelectionManager(nodesDataSource, linksDataSourec, inRectangleHelper);
    manager.subscribe(selectedRectangleSubject);

    const node_1 = new Node();
    node_1.name = "Node 1";
    node_1.x = 150;
    node_1.y = 150;

    nodesDataSource.add(node_1);

    const node_2 = new Node();
    node_2.name = "Node 2";
    node_2.x = 300;
    node_2.y = 300;
    nodesDataSource.add(node_2);

  });

  it('node should be selected', () => {
    selectedRectangleSubject.next(new Rectangle(100, 100, 100, 100));
    expect(nodesDataSource.getItems()[0].is_selected).toEqual(true);
    expect(manager.getSelectedNodes().length).toEqual(1);
    expect(manager.getSelectedLinks().length).toEqual(0);
  });

  it('node should be selected and deselected', () => {
    selectedRectangleSubject.next(new Rectangle(100, 100, 100, 100));
    selectedRectangleSubject.next(new Rectangle(350, 350, 100, 100));
    expect(nodesDataSource.getItems()[0].is_selected).toEqual(false);
    expect(manager.getSelectedNodes().length).toEqual(0);
    expect(manager.getSelectedLinks().length).toEqual(0);
  });

});
