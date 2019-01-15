import { Injectable, EventEmitter } from '@angular/core';

import { Indexed } from '../datasources/map-datasource';

@Injectable()
export class SelectionManager {
  private selection: { [id: string]: any } = {};

  public selected = new EventEmitter<any[]>();
  public unselected = new EventEmitter<any[]>();

  public setSelected(items: Indexed[]) {
    const dictItems = this.convertToKeyDict(items);

    const selected = Object.keys(dictItems)
      .filter(key => {
        return !this.isSelectedByKey(key);
      })
      .map(key => dictItems[key]);

    const unselected = Object.keys(this.selection)
      .filter(key => {
        return !(key in dictItems);
      })
      .map(key => this.selection[key]);

    this.selection = dictItems;

    if (selected.length > 0) {
      this.selected.emit(selected);
    }

    if (unselected.length > 0) {
      this.unselected.emit(unselected);
    }
  }

  public getSelected(): Indexed[] {
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
    items.forEach(item => {
      dict[this.getKey(item)] = item;
    });
    return dict;
  }
}
