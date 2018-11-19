import { Injectable } from "@angular/core";

import { Layer } from "../models/layer";
import { Dictionary } from "../models/types";
import { MapNode } from "../models/map/map-node";
import { MapDrawing } from "../models/map/map-drawing";
import { MapLink } from "../models/map/map-link";


@Injectable()
export class LayersManager {
  private layers: Dictionary<Layer>;

  constructor() {
    this.layers = {};
  }

  public getLayersList(): Layer[] {
    return Object.keys(this.layers).sort((a: string, b: string) => {
      return Number(a) - Number(b);
    }).map((key: string) => {
      return this.layers[key];
    });
  }

  public setNodes(nodes: MapNode[]) {
    nodes
      .forEach((node: MapNode) => {
        const layer = this.getLayerForKey(node.z.toString());
        layer.nodes.push(node);
      });
  }

  public setDrawings(drawings: MapDrawing[]) {
    drawings
      .forEach((drawing: MapDrawing) => {
        const layer = this.getLayerForKey(drawing.z.toString());
        layer.drawings.push(drawing);
      });
  }

  public setLinks(links: MapLink[]) {
    links
      .filter((link: MapLink) => link.source && link.target)
      .forEach((link: MapLink) => {
        const key = Math.min(link.source.z, link.target.z).toString();
        const layer = this.getLayerForKey(key);
        layer.links.push(link);
      });
  }

  public clear() {
    this.layers = {};
  }

  public getLayerForKey(key: string): Layer {
    if (!(key in this.layers)) {
      this.layers[key] = new Layer();
      this.layers[key].index = Number(key);
    }
    return this.layers[key];
  }

}
