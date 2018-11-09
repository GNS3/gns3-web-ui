import { Injectable } from "@angular/core";

import { Subject } from "rxjs";
import { Subscription } from "rxjs";

import { NodesDataSource } from "../datasources/nodes-datasource";
import { LinksDataSource } from "../datasources/links-datasource";
import { InRectangleHelper } from "../helpers/in-rectangle-helper";
import { Rectangle } from "../models/rectangle";
import { DataSource } from "../datasources/datasource";
import { InterfaceLabel } from "../models/interface-label";
import { DrawingsDataSource } from "../datasources/drawings-datasource";
import { MapNode } from "../models/map/map-node";
import { MapLink } from "../models/map/map-link";
import { MapDrawing } from "../models/map/map-drawing";


export interface Selectable {
  x: number;
  y: number;
  is_selected: boolean;
}

@Injectable()
export class SelectionManager {
  private selectedNodes: MapNode[] = [];
  private selectedLinks: MapLink[] = [];
  private selectedDrawings: MapDrawing[] = [];
  private selectedInterfaceLabels: InterfaceLabel[] = [];

  private subscription: Subscription;

  constructor(
    private nodesDataSource: NodesDataSource,
    private linksDataSource: LinksDataSource,
    private drawingsDataSource: DrawingsDataSource,
    private inRectangleHelper: InRectangleHelper
  ) {}

  public subscribe(subject: Subject<Rectangle>) {
    this.subscription = subject.subscribe((rectangle: Rectangle) => {
      this.onSelection(rectangle);
    });
    return this.subscription;
  }

  public onSelection(rectangle: Rectangle) {
    // this.selectedNodes = this.getSelectedItemsInRectangle<MapNode>(this.nodesDataSource, rectangle);
    // this.selectedLinks = this.getSelectedItemsInRectangle<MapLink>(this.linksDataSource, rectangle);
    // this.selectedDrawings = this.getSelectedItemsInRectangle<MapDrawing>(this.drawingsDataSource, rectangle);
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

  public setSelectedNodes(nodes: MapNode[]) {
    // this.selectedNodes = this.setSelectedItems<MapNode>(this.nodesDataSource, (node: MapNode) => {
    //   return !!nodes.find((n: MapNode) => node.id === n.id);
    // });
  }

  public setSelectedLinks(links: MapLink[]) {
    // this.selectedLinks = this.setSelectedItems<MapLink>(this.linksDataSource, (link: MapLink) => {
    //   return !!links.find((l: MapLink) => link.link_id === l.link_id);
    // });
  }

  public setSelectedDrawings(drawings: MapDrawing[]) {
    // this.selectedDrawings = this.setSelectedItems<MapDrawing>(this.drawingsDataSource, (drawing: MapDrawing) => {
    //   return !!drawings.find((d: MapDrawing) => drawing.drawing_id === d.drawing_id);
    // });
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
    // this.linksDataSource.getItems().forEach((link: MapLink) => {
    //   if (!(link.source && link.target && link.nodes.length > 1)) {
    //     return;
    //   }

    //   let updated = false;

    //   let x = link.source.x + link.nodes[0].label.x;
    //   let y = link.source.y + link.nodes[0].label.y;

    //   if (this.inRectangleHelper.inRectangle(rectangle, x, y)) {
    //     link.nodes[0].label.is_selected = true;
    //     updated = true;
    //   }

    //   x = link.target.x + link.nodes[1].label.x;
    //   y = link.target.y + link.nodes[1].label.y;

    //   if (this.inRectangleHelper.inRectangle(rectangle, x, y)) {
    //     link.nodes[1].label.is_selected = true;
    //     updated = true;
    //   }

    //   if (updated) {
    //     this.linksDataSource.update(link);
    //   }
    // });

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
