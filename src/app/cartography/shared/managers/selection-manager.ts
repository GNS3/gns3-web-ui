import { Injectable } from "@angular/core";

import { Subject } from "rxjs/Subject";
import { Subscription } from "rxjs/Subscription";

import { NodesDataSource } from "../datasources/nodes-datasource";
import { LinksDataSource } from "../datasources/links-datasource";
import { Node } from "../models/node";
import { InRectangleHelper } from "../../map/helpers/in-rectangle-helper";
import { Rectangle } from "../models/rectangle";
import { Link} from "../models/link";
import { DataSource } from "../datasources/datasource";


export interface Selectable {
  x: number;
  y: number;
  is_selected: boolean;
}

@Injectable()
export class SelectionManager {
  private selectedNodes: Node[] = [];
  private selectedLinks: Link[] = [];
  private subscription: Subscription;

  constructor(private nodesDataSource: NodesDataSource,
              private linksDataSource: LinksDataSource,
              private inRectangleHelper: InRectangleHelper) {}


  public subscribe(subject: Subject<Rectangle>) {
    this.subscription = subject.subscribe((rectangle: Rectangle) => {
        this.selectedNodes = this.getSelectedItemsInRectangle<Node>(this.nodesDataSource, rectangle);
        this.selectedLinks = this.getSelectedItemsInRectangle<Link>(this.linksDataSource, rectangle);
    });
    return this.subscription;
  }

  public getSelectedNodes() {
    return this.selectedNodes;
  }

  public getSelectedLinks() {
    return this.selectedLinks;
  }

  public setSelectedNodes(nodes: Node[]) {
    this.selectedNodes = this.setSelectedItems<Node>(this.nodesDataSource, (node: Node) => {
      return !!nodes.find((n: Node) => node.node_id === n.node_id);
    });
  }

  public setSelectedLinks(links: Link[]) {
    this.selectedLinks = this.setSelectedItems<Link>(this.linksDataSource, (link: Link) => {
      return !!links.find((l: Link) => link.link_id === l.link_id);
    });
  }

  private getSelectedItemsInRectangle<T extends Selectable>(dataSource: DataSource<T>, rectangle: Rectangle) {
    return this.setSelectedItems<T>(dataSource, (item: T) => {
      return this.inRectangleHelper.inRectangle(item, rectangle);
    });
  }

  private setSelected<T extends Selectable>(item: T, isSelected: boolean, dataSource: DataSource<T>): boolean {
    if (item.is_selected !== isSelected) {
      item.is_selected = isSelected;
      dataSource.update(item);
    }
    return item.is_selected;
  }

  private setSelectedItems<T extends Selectable>(dataSource: DataSource<T>, discriminator: (item: T) => boolean) {
    const selected: T[] = [];
    dataSource.getItems().forEach((item: T) => {
      const isSelected = discriminator(item);
      this.setSelected<T>(item, isSelected, dataSource);
      if (isSelected) {
        selected.push(item);
      }
    });
    return selected;
  }
}
