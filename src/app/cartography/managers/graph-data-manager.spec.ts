import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GraphDataManager } from './graph-data-manager';

/**
 * Focused unit spec for GraphDataManager's incremental diff behaviour around
 * drags and link removal. The drag fix is the important one: while a node or
 * drawing is being dragged, its live datum x/y deliberately diverge from the
 * server (the drag PUTs only at drag end), and a mid-drag WS batch carrying the
 * pre-drag position used to reset the datum — the node teleported back under
 * the pointer and the drag-end PUT persisted an offset position.
 */

// Minimal in-memory stand-ins for the map data sources: enough of the real
// interface for the incremental setters (getItems/get/applyBatch).
function createDataSource<T>() {
  const items: T[] = [];
  return {
    items,
    getItems: () => items,
    get: (id: string) => items.find((i) => (i as any).id === id),
    applyBatch: (additions: T[], removals: T[]) => {
      for (const r of removals) {
        const idx = items.indexOf(r);
        if (idx >= 0) items.splice(idx, 1);
      }
      items.push(...additions);
    },
    set: (next: T[]) => {
      items.length = 0;
      items.push(...next);
    },
  };
}

describe('GraphDataManager', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let manager: GraphDataManager;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let nodesDataSource: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let linksDataSource: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let drawingsDataSource: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let symbolsDataSource: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let markerFlashService: any;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const makeNode = (nodeId: string, x: number, y: number): any => ({
    node_id: nodeId,
    name: nodeId,
    x,
    y,
    z: 1,
    symbol: '',
    symbol_url: '',
    width: 60,
    height: 60,
    status: 'stopped',
    locked: false,
    node_type: 'qemu',
    first_port_name: '',
    port_name_format: '',
    port_segment_size: 0,
    label: null,
    ports: null,
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const makeDrawing = (drawingId: string, x: number, y: number): any => ({
    drawing_id: drawingId,
    x,
    y,
    z: 1,
    rotation: 0,
    locked: false,
    svg: '',
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const makeLink = (linkId: string): any => ({
    link_id: linkId,
    nodes: [],
    capturing: false,
    suspend: false,
    show_filters_icon: false,
    wireshark: false,
    link_type: 'ethernet',
    filters: null,
    link_style: null,
  });

  beforeEach(() => {
    vi.clearAllMocks();
    nodesDataSource = createDataSource<any>();
    linksDataSource = createDataSource<any>();
    drawingsDataSource = createDataSource<any>();
    symbolsDataSource = createDataSource<any>();
    markerFlashService = { evictLink: vi.fn() };

    manager = new GraphDataManager(
      nodesDataSource,
      linksDataSource,
      drawingsDataSource,
      symbolsDataSource,
      // Passthrough converters: mirror the real ones' node_id → id mapping.
      { convert: (n: any) => ({ id: n.node_id, ...n }) } as any,
      {
        convert: (l: any) => ({
          id: l.link_id,
          ...l,
          nodes: (l.nodes || []).map((nd: any) => ({ ...nd, nodeId: nd.node_id })),
        }),
      } as any,
      { convert: (d: any) => ({ id: d.drawing_id, ...d }) } as any,
      { convert: (s: any) => ({ ...s }) } as any,
      {
        addNode: vi.fn(),
        removeNode: vi.fn(),
        moveNode: vi.fn(),
        addLink: vi.fn(),
        removeLink: vi.fn(),
        moveLink: vi.fn(),
        addDrawing: vi.fn(),
        removeDrawing: vi.fn(),
        moveDrawing: vi.fn(),
        clear: vi.fn(),
        setNodes: vi.fn(),
        setLinks: vi.fn(),
        setDrawings: vi.fn(),
      } as any,
      { assignDataToLinks: vi.fn() } as any,
      markerFlashService
    );
  });

  describe('drag awareness in setNodes', () => {
    it('does not reset a dragged node live position on a mid-drag WS batch', () => {
      manager.setNodes([makeNode('n1', 10, 10)]);
      const datum = manager.getNodes()[0];
      expect(datum.x).toBe(10);

      // DraggableSelectionComponent mutates the datum while dragging.
      manager.markDragging('n1');
      datum.x += 25;

      // Same server data arrives mid-drag (e.g. an unrelated peer change
      // echoed in a node.updated batch) — position must NOT reset.
      manager.setNodes([makeNode('n1', 10, 10)]);

      expect(datum.x).toBe(35);
    });

    it('corrects drag drift once the drag ends (snap-back correction preserved)', () => {
      manager.setNodes([makeNode('n1', 10, 10)]);
      const datum = manager.getNodes()[0];
      manager.markDragging('n1');
      datum.x += 25;
      manager.setNodes([makeNode('n1', 10, 10)]);
      manager.unmarkDragging('n1');

      // The drag-end PUT echo corrects the datum again after the gesture.
      manager.setNodes([makeNode('n1', 10, 10)]);

      expect(datum.x).toBe(10);
    });

    it('applies non-position updates to a dragged node while keeping live x/y', () => {
      manager.setNodes([makeNode('n1', 10, 10)]);
      const datum = manager.getNodes()[0];
      manager.markDragging('n1');
      datum.x += 25;

      const renamed = makeNode('n1', 10, 10);
      renamed.name = 'renamed';
      manager.setNodes([renamed]);

      expect(datum.name).toBe('renamed');
      expect(datum.x).toBe(35); // live drag position preserved
    });

    it('lets an explicit server move win over an active drag', () => {
      manager.setNodes([makeNode('n1', 10, 10)]);
      const datum = manager.getNodes()[0];
      manager.markDragging('n1');
      datum.x += 25;

      manager.setNodes([makeNode('n1', 500, 500)]); // server moved it (xY change)

      expect(datum.x).toBe(500);
    });
  });

  describe('drag awareness in setDrawings', () => {
    it('does not reset a dragged drawing live position on a mid-drag WS batch', () => {
      manager.setDrawings([makeDrawing('d1', 20, 20)]);
      const datum = manager.getDrawings()[0];
      manager.markDragging('d1');
      datum.y += 40;

      manager.setDrawings([makeDrawing('d1', 20, 20)]);

      expect(datum.y).toBe(60);
    });

    it('corrects drawing drift once the drag ends', () => {
      manager.setDrawings([makeDrawing('d1', 20, 20)]);
      const datum = manager.getDrawings()[0];
      manager.markDragging('d1');
      datum.y += 40;
      manager.setDrawings([makeDrawing('d1', 20, 20)]);
      manager.unmarkDragging('d1');

      manager.setDrawings([makeDrawing('d1', 20, 20)]);

      expect(datum.y).toBe(20);
    });
  });

  describe('link removal', () => {
    it('evicts the flash geometry cache for links removed via data-diff replacement', () => {
      // Regression: evictLink was only called from the WS link.deleted
      // handler — links removed by data-diff (project reload, server restart,
      // diff sync) leaked their geoCache entries in the app-singleton service.
      manager.setLinks([makeLink('l1'), makeLink('l2')]);
      expect(manager.getLinks().length).toBe(2);

      manager.setLinks([makeLink('l2')]); // l1 disappears via diff, not WS

      expect(markerFlashService.evictLink).toHaveBeenCalledWith('l1');
      expect(markerFlashService.evictLink).not.toHaveBeenCalledWith('l2');
    });
  });
});
