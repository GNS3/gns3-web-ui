import { Subject} from "rxjs/Subject";

import { Node } from "../models/node";
import { Link } from "../models/link";
import { Rectangle } from "../models/rectangle";
import { SelectionManager } from "./selection-manager";
import { NodesDataSource } from "../datasources/nodes-datasource";
import { LinksDataSource } from "../datasources/links-datasource";
import { InRectangleHelper } from "../../map/helpers/in-rectangle-helper";
import { DrawingsDataSource } from "../datasources/drawings-datasource";


describe('SelectionManager', () => {
  let manager: SelectionManager;
  let selectedRectangleSubject: Subject<Rectangle>;
  let nodesDataSource: NodesDataSource;

  beforeEach(() => {
    const linksDataSource = new LinksDataSource();
    const drawingsDataSource = new DrawingsDataSource();
    const inRectangleHelper = new InRectangleHelper();

    selectedRectangleSubject = new Subject<Rectangle>();

    nodesDataSource = new NodesDataSource();

    manager = new SelectionManager(nodesDataSource, linksDataSource, drawingsDataSource, inRectangleHelper);
    manager.subscribe(selectedRectangleSubject);

    const node_1 = new Node();
    node_1.node_id = "test1";
    node_1.name = "Node 1";
    node_1.x = 150;
    node_1.y = 150;

    nodesDataSource.add(node_1);

    const node_2 = new Node();
    node_2.node_id = "test2";
    node_2.name = "Node 2";
    node_2.x = 300;
    node_2.y = 300;
    nodesDataSource.add(node_2);

    const link_1 = new Link();
    link_1.link_id = "test1";
    linksDataSource.add(link_1);
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

  it('nodes should be manually selected', () => {
    const node = new Node();
    node.node_id = "test1";
    manager.setSelectedNodes([node]);
    expect(manager.getSelectedNodes().length).toEqual(1);
  });

  it('links should be manually selected', () => {
    const link = new Link();
    link.link_id = "test1";
    manager.setSelectedLinks([link]);
    expect(manager.getSelectedLinks().length).toEqual(1);
  });
});
