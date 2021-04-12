import { Injectable } from '@angular/core';
import { MapDrawing } from '../models/map/map-drawing';
import { MapLink } from '../models/map/map-link';
import { MapNode } from '../models/map/map-node';
import { MapSymbol } from '../models/map/map-symbol';
import { DataSource } from './datasource';

export interface Indexed {
  id: number | string;
}

export class MapDataSource<T extends Indexed> extends DataSource<T> {
  protected getItemKey(item: Indexed) {
    return item.id;
  }
}

@Injectable()
export class MapNodesDataSource extends MapDataSource<MapNode> {}

@Injectable()
export class MapLinksDataSource extends MapDataSource<MapLink> {}

@Injectable()
export class MapDrawingsDataSource extends MapDataSource<MapDrawing> {}

@Injectable()
export class MapSymbolsDataSource extends MapDataSource<MapSymbol> {}
