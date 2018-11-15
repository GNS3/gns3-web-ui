import { Injectable } from "@angular/core";

import { Layer } from "../models/layer";
import { Node } from "../models/node";
import { Drawing } from "../models/drawing";
import { Link } from "../../models/link";
import { Dictionary } from "../models/types";


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

  public setNodes(nodes: Node[]) {
    nodes
      .forEach((node: Node) => {
        const layer = this.getLayerForKey(node.z.toString());
        layer.nodes.push(node);
      });
  }

  public setDrawings(drawings: Drawing[]) {
    drawings
      .forEach((drawing: Drawing) => {
        const layer = this.getLayerForKey(drawing.z.toString());
        layer.drawings.push(drawing);
      });
  }

  public setLinks(links: Link[]) {
    links
      .filter((link: Link) => link.source && link.target)
      .forEach((link: Link) => {
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
