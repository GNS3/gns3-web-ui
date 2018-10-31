import { Injectable } from "@angular/core";

import { Subject } from "rxjs";
import { Subscription } from "rxjs";

import { NodesDataSource } from "../datasources/nodes-datasource";
import { LinksDataSource } from "../datasources/links-datasource";
import { Node } from "../models/node";
import { InRectangleHelper } from "../helpers/in-rectangle-helper";
import { Rectangle } from "../models/rectangle";
import { Link} from "../../models/link";
import { DataSource } from "../datasources/datasource";
import { Drawing } from "../models/drawing";
import { InterfaceLabel } from "../models/interface-label";
import { DrawingsDataSource } from "../datasources/drawings-datasource";


export interface Selectable {
  x: number;
  y: number;
  is_selected: boolean;
}

@Injectable()
export class SelectionManager {
  private selectedNodes: Node[] = [];
  private selectedLinks: Link[] = [];
  private selectedDrawings: Drawing[] = [];
  private selectedInterfaceLabels: InterfaceLabel[] = [];

  private subscription: Subscription;

  constructor(private nodesDataSource: NodesDataSource,
              private linksDataSource: LinksDataSource,
              private drawingsDataSource: DrawingsDataSource,
              private inRectangleHelper: InRectangleHelper) {}


  public subscribe(subject: Subject<Rectangle>) {
    this.subscription = subject.subscribe((rectangle: Rectangle) => {
      this.onSelection(rectangle);
    });
    return this.subscription;
  }

  public onSelection(rectangle: Rectangle) {
    this.selectedNodes = this.getSelectedItemsInRectangle<Node>(this.nodesDataSource, rectangle);
    this.selectedLinks = this.getSelectedItemsInRectangle<Link>(this.linksDataSource, rectangle);
    this.selectedDrawings = this.getSelectedItemsInRectangle<Drawing>(this.drawingsDataSource, rectangle);
    // don't select interfaces for now
    // this.selectedInterfaceLabels = this.getSelectedInterfaceLabelsInRectangle(rectangle);
  }  

  public getSelectedNodes() {
    return this.selectedNodes;
  }

  public getSelectedLinks() {
    return this.selectedLinks;
  }

  public getSelectedDrawings() {
    return this.selectedDrawings;
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

  public setSelectedDrawings(drawings: Drawing[]) {
    this.selectedDrawings = this.setSelectedItems<Drawing>(this.drawingsDataSource, (drawing: Drawing) => {
      return !!drawings.find((d: Drawing) => drawing.drawing_id === d.drawing_id);
    });
  }

  public clearSelection() {
    this.setSelectedDrawings([]);
    this.setSelectedLinks([]);
    this.setSelectedNodes([]);
  }

  private getSelectedItemsInRectangle<T extends Selectable>(dataSource: DataSource<T>, rectangle: Rectangle) {
    return this.setSelectedItems<T>(dataSource, (item: T) => {
      return this.inRectangleHelper.inRectangle(rectangle, item.x, item.y);
    });
  }

  private getSelectedInterfaceLabelsInRectangle(rectangle: Rectangle) {
    this.linksDataSource.getItems().forEach((link: Link) => {
      if (!(link.source && link.target && link.nodes.length > 1)) {
        return;
      }

      let updated = false;

      let x = link.source.x + link.nodes[0].label.x;
      let y = link.source.y + link.nodes[0].label.y;

      if (this.inRectangleHelper.inRectangle(rectangle, x, y)) {
        link.nodes[0].label.is_selected = true;
        updated = true;
      }

      x = link.target.x + link.nodes[1].label.x;
      y = link.target.y + link.nodes[1].label.y;

      if (this.inRectangleHelper.inRectangle(rectangle, x, y)) {
        link.nodes[1].label.is_selected = true;
        updated = true;
      }

      if (updated) {
        this.linksDataSource.update(link);
      }
    });

    return [];
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
