import { Injectable } from '@angular/core';
import { Link } from '@models/link';
import { MarkerFlashService } from '@services/marker-flash.service';
import { Symbol } from '@models/symbol';
import { DrawingToMapDrawingConverter } from '../converters/map/drawing-to-map-drawing-converter';
import { LinkToMapLinkConverter } from '../converters/map/link-to-map-link-converter';
import { NodeToMapNodeConverter } from '../converters/map/node-to-map-node-converter';
import { SymbolToMapSymbolConverter } from '../converters/map/symbol-to-map-symbol-converter';
import {
  MapDrawingsDataSource,
  MapLinksDataSource,
  MapNodesDataSource,
  MapSymbolsDataSource,
} from '../datasources/map-datasource';
import { MultiLinkCalculatorHelper } from '../helpers/multi-link-calculator-helper';
import { Drawing } from '../models/drawing';
import { MapDrawing } from '../models/map/map-drawing';
import { MapLink } from '../models/map/map-link';
import { MapNode } from '../models/map/map-node';
import { Node } from '../models/node';
import { LayersManager } from './layers-manager';
import {
  AffectedIds,
  changedGroups,
  drawingSignatures,
  DrawingSigGroup,
  emptyAffectedIds,
  ItemSignatures,
  LinkSigGroup,
  linkSignatures,
  nodeSignatures,
  NodeSigGroup,
} from '../helpers/item-signature';

@Injectable()
export class GraphDataManager {
  // Per-item visual signatures and sub-signatures — used to diff incremental
  // setNodes/setLinks/setDrawings and to produce AffectedIds for the dom-patcher.
  private nodeSig = new Map<string, ItemSignatures<NodeSigGroup>>();
  private linkSig = new Map<string, ItemSignatures<LinkSigGroup>>();
  private drawingSig = new Map<string, ItemSignatures<DrawingSigGroup>>();

  // Reverse index: nodeId → set of linkIds whose source or target is that node.
  // Maintained incrementally by setLinks and recomputed on first load.
  private nodeToLinks = new Map<string, Set<string>>();

  // Ids of nodes/drawings with an ACTIVE drag gesture. DraggableSelectionComponent
  // mutates the live datum x/y while dragging and PUTs only at drag end, so a
  // mid-drag WS batch still carrying the pre-drag position must not reset the
  // datum (the node would teleport back and the drag-end PUT would persist an
  // offset position). Set by markDragging/unmarkDragging around the gesture.
  private draggingIds = new Set<string>();

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
    private multiLinkCalculator: MultiLinkCalculatorHelper,
    private markerFlashService: MarkerFlashService
  ) {}

  public markDragging(id: string) {
    this.draggingIds.add(id);
  }

  public unmarkDragging(id: string) {
    this.draggingIds.delete(id);
  }

  private isDragging(id: string) {
    return this.draggingIds.has(id);
  }

  // ── Public read-access ────────────────────────────────────────

  public getNodes() { return this.mapNodesDataSource.getItems(); }
  public getLinks() { return this.mapLinksDataSource.getItems(); }
  public getDrawings() { return this.mapDrawingsDataSource.getItems(); }
  public getSymbols() { return this.mapSymbolsDataSource.getItems(); }

  /**
   * Clear all singleton state. Called from D3MapComponent.createGraph: the
   * manager outlives the component, and a fresh mount that receives the SAME
   * items (e.g. preview thumbnail ↔ dialog passing one cached dataset) would
   * diff them as "no change" — no additions, no layers rebuild — and render
   * an empty canvas even though layersManager was cleared.
   */
  public reset() {
    this.mapNodesDataSource.set([]);
    this.mapLinksDataSource.set([]);
    this.mapDrawingsDataSource.set([]);
    this.nodeSig.clear();
    this.linkSig.clear();
    this.drawingSig.clear();
    this.nodeToLinks.clear();
    this.draggingIds.clear();
  }

  // ── Incremental setters (return AffectedIds for dom-patcher) ───

  public setNodes(nodes: Node[]): AffectedIds {
    if (!nodes) return emptyAffectedIds();

    const affected = emptyAffectedIds();
    const nodesByIdEntries: [string, MapNode][] = [];
    for (const n of this.getNodes()) {
      if (n.id != null) nodesByIdEntries.push([n.id, n]);
    }
    const existingMap = new Map(nodesByIdEntries);
    const newIds = new Set(nodes.map((n) => n.node_id));
    const additions: MapNode[] = [];
    const removals: MapNode[] = [];

    for (const n of nodes) {
      const sigs = nodeSignatures(n);
      const existing = existingMap.get(n.node_id);
      if (!existing) {
        const converted = this.nodeToMapNode.convert(n);
        additions.push(converted);
        this.nodeSig.set(n.node_id, sigs);
        affected.additions.nodes.push(n.node_id);
        this.layersManager.addNode(converted);
      } else {
        const oldSigs = this.nodeSig.get(n.node_id);
        const changed = changedGroups(oldSigs?.groups, sigs.groups);
        // Re-apply the server value even when the signature is unchanged: the
        // live datum may have been mutated by a drag (DraggableSelectionComponent
        // writes cursor positions into the MapNode while dragging), and a drag
        // that snaps back onto the same signed position (small move +
        // snap_to_grid) must still correct the datum — otherwise the drag-end
        // redraw re-renders the cursor position and the node stays off-grid,
        // diverging from the server.
        //
        // While a drag is ACTIVE the same position drift is the drag's own work,
        // so a mid-drag WS batch carrying the pre-drag position must NOT reset
        // the datum. Dragged items keep their live x/y (the drag-end echo
        // corrects them); an explicit server move of the dragged item
        // (changed.includes('xY')) still wins.
        if (changed.length > 0) {
          const converted = this.nodeToMapNode.convert(n);
          if (this.isDragging(n.node_id) && !changed.includes('xY')) {
            const live = { x: existing.x, y: existing.y };
            Object.assign(existing, converted);
            Object.assign(existing, live);
          } else {
            Object.assign(existing, converted);
          }
          this.nodeSig.set(n.node_id, sigs);
        } else if (!this.isDragging(n.node_id) && (existing.x !== n.x || existing.y !== n.y)) {
          const converted = this.nodeToMapNode.convert(n);
          Object.assign(existing, converted);
          this.nodeSig.set(n.node_id, sigs);
        }
        if (changed.length > 0) {
          affected.updates.set(n.node_id, changed);
          // Layer migration when z changes
          const oldZ = oldSigs?.groups.z;
          const newZ = sigs.groups.z;
          if (oldZ !== undefined && oldZ !== newZ) {
            this.layersManager.moveNode(existing, Number(oldZ));
            // A node's z change also re-layers every link attached to it (a
            // link's layer is min(source.z, target.z)); without this the full
            // draw below renders those links from the stale layer bucket.
            const linkSet = this.nodeToLinks.get(n.node_id);
            if (linkSet) {
              for (const lid of linkSet) {
                const link = this.mapLinksDataSource.get(lid);
                if (link) {
                  this.layersManager.moveLink(link);
                }
              }
            }
          }
          // A node position/size change bends every link connected to it.
          // Mark those links in affected so the dom-patcher falls through to
          // a full draw (which recomputes link paths from source/target) —
          // otherwise the link path DOM keeps pointing at the old coordinates.
          if (changed.includes('xY') || changed.includes('visual')) {
            const linkSet = this.nodeToLinks.get(n.node_id);
            if (linkSet) {
              for (const lid of linkSet) {
                affected.updates.set(lid, ['linkPath']);
              }
            }
          }
        }
      }
    }

    for (const [id] of this.nodeSig) {
      if (!newIds.has(id)) {
        const m = existingMap.get(id);
        if (m) {
          removals.push(m);
          this.layersManager.removeNode(m);
        }
        this.nodeSig.delete(id);
        this.nodeToLinks.delete(id);
        affected.removals.nodes.push(id);
      }
    }

    this.mapNodesDataSource.applyBatch(additions, removals);
    this.assignDataToLinksIncremental(affected, existingMap);
    return affected;
  }

  public setLinks(links: Link[]): AffectedIds {
    if (!links) return emptyAffectedIds();

    const affected = emptyAffectedIds();
    const linksByIdEntries: [string, MapLink][] = [];
    for (const l of this.getLinks()) {
      if (l.id != null) linksByIdEntries.push([l.id, l]);
    }
    const existingMap = new Map(linksByIdEntries);
    const newIds = new Set(links.map((l) => l.link_id));
    const additions: MapLink[] = [];
    const removals: MapLink[] = [];

    // Rebuild nodeToLinks incrementally
    const oldLinkToNodes = new Map<string, [string, string]>();
    for (const [id, l] of existingMap) {
      // Register off link.nodes[].nodeId — LinkToMapLinkConverter does NOT
      // populate source/target (those are resolved later in assignDataToLinks);
      // reading source?.id here is always undefined on first load.
      const sid = l.nodes[0]?.nodeId;
      const tid = l.nodes[1]?.nodeId;
      if (sid && tid) {
        oldLinkToNodes.set(id, [sid, tid]);
      }
    }

    for (const l of links) {
      const sigs = linkSignatures(l);
      const existing = existingMap.get(l.link_id);
      if (!existing) {
        const converted = this.linkToMapLink.convert(l);
        additions.push(converted);
        this.linkSig.set(l.link_id, sigs);
        affected.additions.links.push(l.link_id);
        const srcId = converted.nodes[0]?.nodeId;
        const tgtId = converted.nodes[1]?.nodeId;
        if (srcId && tgtId) {
          this.registerLinkNodes(l.link_id, srcId, tgtId);
        }
      } else {
        const oldSigs = this.linkSig.get(l.link_id);
        const changed = changedGroups(oldSigs?.groups, sigs.groups);
        if (changed.length > 0) {
          const converted = this.linkToMapLink.convert(l);
          Object.assign(existing, converted);
          this.linkSig.set(l.link_id, sigs);
          affected.updates.set(l.link_id, changed);
          // Update nodeToLinks if nodes changed
          if (changed.includes('nodes')) {
            const oldPair = oldLinkToNodes.get(l.link_id);
            if (oldPair) {
              this.unregisterLinkNodes(l.link_id, oldPair[0], oldPair[1]);
            }
            const srcId = existing.nodes[0]?.nodeId;
            const tgtId = existing.nodes[1]?.nodeId;
            if (srcId && tgtId) {
              this.registerLinkNodes(l.link_id, srcId, tgtId);
            }
          }
        }
      }
    }

    for (const [id] of this.linkSig) {
      if (!newIds.has(id)) {
        const m = existingMap.get(id);
        if (m) {
          removals.push(m);
          this.layersManager.removeLink(m);
        }
        this.linkSig.delete(id);
        // The link is gone from the map — evict its flash geometry cache entry,
        // which would otherwise live forever in the app-singleton service.
        // (WS link.deleted evicts too, but removals arriving as data-diff
        // replacements — project reload, server restart, diff sync — never go
        // through the WS handler.)
        this.markerFlashService.evictLink(id);
        const oldPair = oldLinkToNodes.get(id);
        if (oldPair) {
          this.unregisterLinkNodes(id, oldPair[0], oldPair[1]);
        }
        affected.removals.links.push(id);
      }
    }

    this.mapLinksDataSource.applyBatch(additions, removals);

    // Layer: walk additions and removals only (updates with z change handled
    // during setNodes — link layer depends on source/target z which only
    // changes via node updates, not link updates alone).
    for (const m of additions) this.layersManager.addLink(m);

    // Recompute link x/y / source/target for affected links + multiLink groups.
    // Full recompute is cheap enough here — we already know the affected set.
    this.assignDataToLinksIncremental(affected, new Map());

    return affected;
  }

  public setDrawings(drawings: Drawing[]): AffectedIds {
    if (!drawings) return emptyAffectedIds();

    const affected = emptyAffectedIds();
    const drawingsByIdEntries: [string, MapDrawing][] = [];
    for (const d of this.getDrawings()) {
      if (d.id != null) drawingsByIdEntries.push([d.id, d]);
    }
    const existingMap = new Map(drawingsByIdEntries);
    const newIds = new Set(drawings.map((d) => d.drawing_id));
    const additions: MapDrawing[] = [];
    const removals: MapDrawing[] = [];

    for (const d of drawings) {
      const sigs = drawingSignatures(d);
      const existing = existingMap.get(d.drawing_id);
      if (!existing) {
        const converted = this.drawingToMapDrawing.convert(d);
        additions.push(converted);
        this.drawingSig.set(d.drawing_id, sigs);
        affected.additions.drawings.push(d.drawing_id);
        this.layersManager.addDrawing(converted);
      } else {
        const oldSigs = this.drawingSig.get(d.drawing_id);
        const changed = changedGroups(oldSigs?.groups, sigs.groups);
        // Same drag-mutation correction as setNodes (see the comment there):
        // re-apply the server value when the datum drifted, but keep the live
        // x/y while the drawing is being dragged.
        if (changed.length > 0) {
          const converted = this.drawingToMapDrawing.convert(d);
          if (this.isDragging(d.drawing_id) && !changed.includes('xY')) {
            const live = { x: existing.x, y: existing.y };
            Object.assign(existing, converted);
            Object.assign(existing, live);
          } else {
            Object.assign(existing, converted);
          }
          this.drawingSig.set(d.drawing_id, sigs);
        } else if (!this.isDragging(d.drawing_id) && (existing.x !== d.x || existing.y !== d.y)) {
          const converted = this.drawingToMapDrawing.convert(d);
          Object.assign(existing, converted);
          this.drawingSig.set(d.drawing_id, sigs);
        }
        if (changed.length > 0) {
          affected.updates.set(d.drawing_id, changed);
          if (changed.includes('z')) {
            const oldZ = oldSigs?.groups.z;
            if (oldZ !== undefined) {
              this.layersManager.moveDrawing(existing, Number(oldZ));
            }
          }
        }
      }
    }

    for (const [id] of this.drawingSig) {
      if (!newIds.has(id)) {
        const d = existingMap.get(id);
        if (d) {
          removals.push(d);
          this.layersManager.removeDrawing(d);
        }
        this.drawingSig.delete(id);
        affected.removals.drawings.push(id);
      }
    }

    this.mapDrawingsDataSource.applyBatch(additions, removals);
    return affected;
  }

  public setSymbols(symbols: Symbol[]) {
    if (symbols) {
      const mapSymbols = symbols.map((s) => this.symbolToMapSymbol.convert(s));
      this.mapSymbolsDataSource.set(mapSymbols);
    }
  }

  // ── node ↔ link index ─────────────────────────────────────────

  private registerLinkNodes(linkId: string, sourceId: string, targetId: string) {
    for (const nid of [sourceId, targetId]) {
      let s = this.nodeToLinks.get(nid);
      if (!s) { s = new Set(); this.nodeToLinks.set(nid, s); }
      s.add(linkId);
    }
  }

  private unregisterLinkNodes(linkId: string, sourceId: string, targetId: string) {
    for (const nid of [sourceId, targetId]) {
      const s = this.nodeToLinks.get(nid);
      if (s) { s.delete(linkId); if (s.size === 0) this.nodeToLinks.delete(nid); }
    }
  }

  // ── Incremental assignDataToLinks ──────────────────────────────

  private assignDataToLinksIncremental(affected: AffectedIds, _existingNodes: Map<string, MapNode>) {
    const hasStructural = affected.additions.nodes.length > 0 || affected.removals.nodes.length > 0
                       || affected.additions.links.length > 0 || affected.removals.links.length > 0;

    if (hasStructural) {
      // Fall back to full assignDataToLinks + full layers rebuild.
      this.assignDataToLinksFull();
      this.onDataUpdateFull();
      return;
    }

    // Updates only: recompute source/target/x/y for affected links
    const nodesById = new Map(this.getNodes().map((n) => [n.id, n]));
    const affectedLinkIds = this.collectAffectedLinks(affected);

    for (const linkId of affectedLinkIds) {
      const link = this.mapLinksDataSource.get(linkId) as unknown as MapLink | undefined;
      if (!link) continue;

      const linkNodeData = link.nodes;
      if (!linkNodeData || linkNodeData.length < 2) continue;
      const sourceId = linkNodeData[0]?.nodeId;
      const targetId = linkNodeData[1]?.nodeId;
      const srcNode = sourceId ? nodesById.get(sourceId) : undefined;
      const tgtNode = targetId ? nodesById.get(targetId) : undefined;
      if (srcNode) Object.assign(link, { source: srcNode });
      if (tgtNode) Object.assign(link, { target: tgtNode });
      if (srcNode && tgtNode) {
        Object.assign(link, {
          x: srcNode.x + (tgtNode.x - srcNode.x) * 0.5,
          y: srcNode.y + (tgtNode.y - srcNode.y) * 0.5,
        });
      }
    }

    this.multiLinkCalculator.assignDataToLinks(this.getLinks());
  }

  /** Collect link ids affected by node position/visual changes, including the multiLink closure. */
  private collectAffectedLinks(affected: AffectedIds): Set<string> {
    const linkIds = new Set<string>();
    for (const [nodeId] of affected.updates) {
      const linkSet = this.nodeToLinks.get(nodeId);
      if (linkSet) for (const lid of linkSet) linkIds.add(lid);
    }
    // Also directly affected links (nodes changed)
    for (const [linkId] of affected.updates) linkIds.add(linkId);
    return linkIds;
  }

  // ── Full rebuild paths (first load / structural change) ───────

  private assignDataToLinksFull() {
    const nodesById: Record<string, MapNode> = {};
    this.getNodes().forEach((n) => { nodesById[n.id] = n; });

    this.getLinks().forEach((link: MapLink) => {
      if (!link.nodes || link.nodes.length < 2) return;
      const sourceId = link.nodes[0]?.nodeId;
      const targetId = link.nodes[1]?.nodeId;
      if (sourceId && sourceId in nodesById) link.source = nodesById[sourceId];
      if (targetId && targetId in nodesById) link.target = nodesById[targetId];
      if (link.source && link.target) {
        link.x = link.source.x + (link.target.x - link.source.x) * 0.5;
        link.y = link.source.y + (link.target.y - link.source.y) * 0.5;
      }
    });

    this.multiLinkCalculator.assignDataToLinks(this.getLinks());
  }

  private onDataUpdateFull() {
    this.layersManager.clear();
    this.layersManager.setNodes(this.getNodes());
    this.layersManager.setLinks(this.getLinks());
    this.layersManager.setDrawings(this.getDrawings());
  }
}
