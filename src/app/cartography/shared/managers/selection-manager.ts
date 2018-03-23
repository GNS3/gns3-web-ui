import { Injectable } from "@angular/core";

import { Subject } from "rxjs/Subject";
import { Subscription } from "rxjs/Subscription";

import { NodesDataSource } from "../datasources/nodes-datasource";
import { LinksDataSource } from "../datasources/links-datasource";
import { Node } from "../models/node";
import { InRectangleHelper } from "../../map/helpers/in-rectangle-helper";
import { Rectangle } from "../models/rectangle";
import { Link } from "../models/link";
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
  }

  public getSelectedNodes() {
    return this.selectedNodes;
  }

  public getSelectedLinks() {
    return this.selectedLinks;
  }

  private getSelectedItemsInRectangle<T extends Selectable>(dataSource: DataSource<T>, rectangle: Rectangle) {
    const items: T[] = [];
    dataSource.getItems().forEach((item: T) => {
      const is_selected = this.inRectangleHelper.inRectangle(item, rectangle);
      if (item.is_selected !== is_selected) {
        item.is_selected = is_selected;
        dataSource.update(item);
        if (is_selected) {
          items.push(item);
        }
      }
    });
    return items;
  }
}
