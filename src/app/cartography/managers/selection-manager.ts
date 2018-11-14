import { Injectable, EventEmitter } from "@angular/core";

import { Subject } from "rxjs";
import { Subscription } from "rxjs";

import { InRectangleHelper } from "../helpers/in-rectangle-helper";
import { Rectangle } from "../models/rectangle";
import { GraphDataManager } from "./graph-data-manager";
import { Indexed } from "../datasources/map-datasource";


@Injectable()
export class SelectionStore {
  private selection: {[id:string]: any} = {};

  public selected = new EventEmitter<any[]>();
  public unselected = new EventEmitter<any[]>();

  public set(items: Indexed[]) {
    const dictItems = this.convertToKeyDict(items);

    const selected = Object.keys(dictItems).filter((key) => {
      return !this.isSelectedByKey(key);
    }).map(key => dictItems[key]);

    const unselected = Object.keys(this.selection).filter((key) => {
      return !(key in dictItems);
    }).map((key) => this.selection[key]);

    this.selection = dictItems;

    this.selected.emit(selected);
    this.unselected.emit(unselected);
  }

  public get(): Indexed[] {
    return Object.keys(this.selection).map(key => this.selection[key]);
  }

  public isSelected(item): boolean {
    const key = this.getKey(item);
    return this.isSelectedByKey(key);
  }

  private isSelectedByKey(key): boolean {
    return key in this.selection;
  }

  private getKey(item: Indexed): string {
    const type = item.constructor.name;
    return `${type}-${item.id}`;
  }

  private convertToKeyDict(items: Indexed[]) {
    const dict = {};
    items.forEach((item) => {
      dict[this.getKey(item)] = item;
    });
    return dict;
  }
}


@Injectable()
export class SelectionManager {
  private subscription: Subscription;

  constructor(
    private graphDataManager: GraphDataManager,
    private inRectangleHelper: InRectangleHelper,
    private selectionStore: SelectionStore
  ) {}

  public subscribe(subject: Subject<Rectangle>) {
    this.subscription = subject.subscribe((rectangle: Rectangle) => {
      this.onSelection(rectangle);
    });
    return this.subscription;
  }

  public onSelection(rectangle: Rectangle) {
    const selectedNodes = this.graphDataManager.getNodes().filter((node) => {
      return this.inRectangleHelper.inRectangle(rectangle, node.x, node.y)
    });

    const selectedLinks = this.graphDataManager.getLinks().filter((link) => {
      return this.inRectangleHelper.inRectangle(rectangle, link.x, link.y)
    });

    const selectedDrawings = this.graphDataManager.getDrawings().filter((drawing) => {
      return this.inRectangleHelper.inRectangle(rectangle, drawing.x, drawing.y)
    });

    const selected = [...selectedNodes, ...selectedLinks, ...selectedDrawings];

    this.selectionStore.set(selected);
  }

  public getSelected() {
    return this.selectionStore.get();
  }

  public setSelected(value: Indexed[]) {
    this.selectionStore.set(value);
  }
  
  public clearSelection() {
  }
}
