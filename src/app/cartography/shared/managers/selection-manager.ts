import {Node} from "../models/node";
import {NodesDataSource} from "../datasources/nodes-datasource";
import {LinksDataSource} from "../datasources/links-datasource";
import {Injectable} from "@angular/core";
import {InRectangleHelper} from "../../map/helpers/in-rectangle-helper";
import {Rectangle} from "../models/rectangle";
import {Link} from "../models/link";

export interface Selectable {
  x: number;
  y: number;
  is_selected: boolean;
}


@Injectable()
export class SelectionManager {
  private selectedItems: Selectable[] = [];

  constructor(private nodesDataSource: NodesDataSource,
              private linksDataSource: LinksDataSource,
              private inRectangleHelper: InRectangleHelper) {}

  public setSelectedItemsInRectangle(rectangle: Rectangle) {
    const self = this;

    const nodes: Node[] = [];
    this.nodesDataSource.getItems().forEach((node: Node) => {
      const is_selected = self.inRectangleHelper.inRectangle(node, rectangle);
      if (node.is_selected !== is_selected) {
        node.is_selected = is_selected;
        self.nodesDataSource.update(node);
        if (is_selected) {
          nodes.push(node);
        }
      }
    });

    const links: Link[] = [];
    this.linksDataSource.getItems().forEach((link: Link) => {
      const is_selected = self.inRectangleHelper.inRectangle(link, rectangle);
      if (link.is_selected !== is_selected) {
        link.is_selected = is_selected;
        self.linksDataSource.update(link);
        if (is_selected) {
          links.push(link);
        }
      }
    });
  }
}
