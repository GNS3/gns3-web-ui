import { MapNode } from "../models/map/map-node";
import { SelectionManager } from "./selection-manager";


describe('SelectionManager', () => {
  let manager: SelectionManager;

  beforeEach(() => {
    manager = new SelectionManager();
  });
  

  it('nodes should be manually selected', () => {
    const node = new MapNode();
    node.id = "test1";
    manager.setSelected([node]);
    expect(manager.getSelected().length).toEqual(1);
  });

});
