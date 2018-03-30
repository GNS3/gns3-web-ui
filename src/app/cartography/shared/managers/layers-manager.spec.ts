import { LayersManager } from "./layers-manager";
import { Node } from "../models/node";
import { Drawing } from "../models/drawing";
import { Link } from "../models/link";


describe('LayersManager', () => {
  let manager: LayersManager;

  beforeEach(() => {
    manager = new LayersManager();
  });

  it('nodes should be added', () => {
    const node_1 = new Node();
    node_1.z = 1;
    const node_2 = new Node();
    node_2.z = 2;

    manager.setNodes([node_1, node_2]);
    const layers = manager.getLayersList();
    expect(layers.length).toEqual(2);
    expect(layers[0].nodes.length).toEqual(1);
    expect(layers[0].index).toEqual(1);
    expect(layers[1].nodes.length).toEqual(1);
    expect(layers[1].index).toEqual(2);
  });

  it('drawings should be added', () => {
    const drawing_1 = new Drawing();
    drawing_1.z = 1;
    const drawing_2 = new Drawing();
    drawing_2.z = 2;

    manager.setDrawings([drawing_1, drawing_2]);
    const layers = manager.getLayersList();
    expect(layers.length).toEqual(2);
    expect(layers[0].drawings.length).toEqual(1);
    expect(layers[0].index).toEqual(1);
    expect(layers[1].drawings.length).toEqual(1);
    expect(layers[1].index).toEqual(2);
  });

  it('links should be added', () => {
    const node_1 = new Node();
    node_1.z = 1;

    const node_2 = new Node();
    node_2.z = 2;

    const link_1 = new Link();
    link_1.source = node_1;
    link_1.target = node_1;

    const link_2 = new Link();
    link_2.source = node_1;
    link_2.target = node_1;

    manager.setLinks([link_1, link_2]);
    const layers = manager.getLayersList();
    expect(layers.length).toEqual(1);
    expect(layers[0].links.length).toEqual(2);
    expect(layers[0].index).toEqual(1);
  });

  it('layers should be cleared', () => {
    const node_1 = new Node();
    node_1.z = 1;
    const node_2 = new Node();
    node_2.z = 2;

    manager.setNodes([node_1, node_2]);
    manager.clear();
    expect(manager.getLayersList().length).toEqual(0);
  });
});
