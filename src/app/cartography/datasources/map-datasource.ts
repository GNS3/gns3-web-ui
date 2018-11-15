import { DataSource } from "./datasource";
import { MapNode } from "../models/map/map-node";
import { MapLink } from "../models/map/map-link";
import { MapDrawing } from "../models/map/map-drawing";
import { MapSymbol } from "../models/map/map-symbol";
import { Injectable } from "@angular/core";

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