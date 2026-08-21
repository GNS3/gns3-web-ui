import { Injectable } from '@angular/core';
import { Layer } from '../models/layer';
import { MapDrawing } from '../models/map/map-drawing';
import { MapLink } from '../models/map/map-link';
import { MapNode } from '../models/map/map-node';
import { Dictionary } from '../models/types';

@Injectable()
export class LayersManager {
  private layers: Dictionary<Layer>;

  constructor() {
    this.layers = {};
  }

  public getLayersList(): Layer[] {
    return Object.keys(this.layers)
      .sort((a: string, b: string) => {
        return Number(a) - Number(b);
      })
      .map((key: string) => {
        return this.layers[key];
      });
  }

  public setNodes(nodes: MapNode[]) {
    nodes.forEach((node: MapNode) => {
      const layer = this.getLayerForKey(node.z.toString());
      layer.nodes.push(node);
    });
  }

  public setDrawings(drawings: MapDrawing[]) {
    drawings.forEach((drawing: MapDrawing) => {
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

  // ── Single-item incremental API (used by GraphDataManager incremental diff) ──

  public addNode(node: MapNode): void {
    this.getLayerForKey(node.z.toString()).nodes.push(node);
  }

  public removeNode(node: MapNode): void {
    for (const key of Object.keys(this.layers)) {
      this.layers[key].nodes = this.layers[key].nodes.filter((n) => n.id !== node.id);
    }
  }

  public moveNode(node: MapNode, _oldZ: number): void {
    // node.z already holds the NEW z (set by the caller before move). Remove
    // from any layer, then re-add so addNode routes to the new z bucket.
    // Do NOT reset node.z to oldZ — that would undo the update.
    this.removeNode(node);
    this.addNode(node);
  }

  public addLink(link: MapLink): void {
    if (!link.source || !link.target) return;
    const key = Math.min(link.source.z, link.target.z).toString();
    this.getLayerForKey(key).links.push(link);
  }

  public removeLink(link: MapLink): void {
    for (const key of Object.keys(this.layers)) {
      this.layers[key].links = this.layers[key].links.filter((l) => l.id !== link.id);
    }
  }

  public moveLink(link: MapLink): void {
    // Re-bucket to the link's current layer (min(source.z, target.z)): remove
    // from any layer, then re-add so addLink routes to the updated bucket.
    this.removeLink(link);
    this.addLink(link);
  }

  public addDrawing(drawing: MapDrawing): void {
    this.getLayerForKey(drawing.z.toString()).drawings.push(drawing);
  }

  public removeDrawing(drawing: MapDrawing): void {
    for (const key of Object.keys(this.layers)) {
      this.layers[key].drawings = this.layers[key].drawings.filter((d) => d.id !== drawing.id);
    }
  }

  public moveDrawing(drawing: MapDrawing, _oldZ: number): void {
    this.removeDrawing(drawing);
    this.addDrawing(drawing);
  }

  public getLayerForKey(key: string): Layer {
    if (!(key in this.layers)) {
      this.layers[key] = new Layer();
      this.layers[key].index = Number(key);
    }
    return this.layers[key];
  }
}
