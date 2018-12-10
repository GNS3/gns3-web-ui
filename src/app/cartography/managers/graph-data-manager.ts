import { Injectable } from "@angular/core";
import { Node } from "../models/node";
import { NodeToMapNodeConverter } from "../converters/map/node-to-map-node-converter";
import { LinkToMapLinkConverter } from "../converters/map/link-to-map-link-converter";
import { DrawingToMapDrawingConverter } from "../converters/map/drawing-to-map-drawing-converter";
import { SymbolToMapSymbolConverter } from "../converters/map/symbol-to-map-symbol-converter";
import { MapNode } from "../models/map/map-node";
import { MapLink } from "../models/map/map-link";
import { Link } from "../../models/link";
import { Drawing } from "../models/drawing";
import { Symbol } from "../../models/symbol";
import { LayersManager } from "./layers-manager";
import { MapNodesDataSource, MapLinksDataSource, MapDrawingsDataSource, MapSymbolsDataSource } from "../datasources/map-datasource";
import { MultiLinkCalculatorHelper } from "../helpers/multi-link-calculator-helper";

@Injectable()
export class GraphDataManager {
  constructor(
    private mapNodesDataSource: MapNodesDataSource,
    private mapLinksDataSource: MapLinksDataSource,
    private mapDrawingsDataSource: MapDrawingsDataSource,
    private mapSymbolsDataSource: MapSymbolsDataSource,
    private nodeToMapNode: NodeToMapNodeConverter,
    private linkToMapLink: LinkToMapLinkConverter,
    private drawingToMapDrawing: DrawingToMapDrawingConverter,
    private symbolToMapSymbol: SymbolToMapSymbolConverter,
    private layersManager: LayersManager,
    private multiLinkCalculator: MultiLinkCalculatorHelper
  ) {}

  public setNodes(nodes: Node[]) {
    const mapNodes = nodes.map((n) => this.nodeToMapNode.convert(n));
    this.mapNodesDataSource.set(mapNodes);

    this.assignDataToLinks();
    this.onDataUpdate();
  }

  public setLinks(links: Link[]) {
    const mapLinks = links.map((l) => this.linkToMapLink.convert(l));
    this.mapLinksDataSource.set(mapLinks);

    this.assignDataToLinks();
    this.onDataUpdate();
  }

  public setDrawings(drawings: Drawing[]) {
    const mapDrawings = drawings.map((d) => this.drawingToMapDrawing.convert(d));
    this.mapDrawingsDataSource.set(mapDrawings);

    this.onDataUpdate();
  }

  public setSymbols(symbols: Symbol[]) {
    const mapSymbols = symbols.map((s) => this.symbolToMapSymbol.convert(s));
    this.mapSymbolsDataSource.set(mapSymbols);
  }

  public getNodes() {
    return this.mapNodesDataSource.getItems();
  }

  public getLinks() {
    return this.mapLinksDataSource.getItems();
  }

  public getDrawings() {
    return this.mapDrawingsDataSource.getItems();
  }

  public getSymbols() {
    return this.mapSymbolsDataSource.getItems();
  }

  private onDataUpdate() {
    this.layersManager.clear();
    this.layersManager.setNodes(this.getNodes());
    this.layersManager.setLinks(this.getLinks());
    this.layersManager.setDrawings(this.getDrawings());
  }

  private assignDataToLinks() {
    const nodes_by_id = {};
    this.getNodes().forEach((n: MapNode) => {
      nodes_by_id[n.id] = n;
    });

    this.getLinks().forEach((link: MapLink) => {
      const source_id = link.nodes[0].nodeId;
      const target_id = link.nodes[1].nodeId;
      if (source_id in nodes_by_id) {
        link.source = nodes_by_id[source_id];
      }
      if (target_id in nodes_by_id) {
        link.target = nodes_by_id[target_id];
      }

      if (link.source && link.target) {
        link.x = link.source.x + (link.target.x - link.source.x) * 0.5;
        link.y = link.source.y + (link.target.y - link.source.y) * 0.5;
      }
    });

    this.multiLinkCalculator.assignDataToLinks(this.getLinks());
  }

}