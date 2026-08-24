import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { CartographyModule } from '../cartography/cartography.module';
import { GraphDataManager } from '../cartography/managers/graph-data-manager';
import { LayersManager } from '../cartography/managers/layers-manager';
import { MarkerFlashService } from './marker-flash.service';
import { SelectionManager } from '../cartography/managers/selection-manager';
import { mapGns3FileTopology } from './gns3-file.mapper';
import { Gns3ProjectFile } from '../models/gns3-file';

// Mirrors the on-disk .gns3 structure (verified against a real project file:
// nodes carry width/height, links carry link_style: {} and endpoint labels
// with concrete x/y).
const file: Gns3ProjectFile = {
  project_id: 'p1',
  topology: {
    nodes: [
      {
        node_id: 'n1',
        name: 'R-1',
        node_type: 'iou',
        compute_id: 'local',
        x: 0,
        y: 0,
        z: 0,
        width: 60,
        height: 60,
        symbol: ':/symbols/router.svg',
        label: { rotation: 0, style: 'font-family: TypeWriter;font-size: 10.0;', text: 'R-1', x: 18, y: -25 },
      },
      {
        node_id: 'n2',
        name: 'R-2',
        node_type: 'iou',
        compute_id: 'local',
        x: 300,
        y: 0,
        z: 0,
        width: 60,
        height: 60,
        symbol: ':/symbols/router.svg',
        label: { rotation: 0, style: 'font-family: TypeWriter;font-size: 10.0;', text: 'R-2', x: 18, y: -25 },
      },
    ],
    links: [
      {
        link_id: 'l1',
        link_style: {},
        filters: {},
        nodes: [
          {
            node_id: 'n1',
            adapter_number: 0,
            port_number: 0,
            label: { rotation: 0, style: 'font-size: 10; font-style: Verdana', text: 'e0/0', x: 80, y: 35 },
          },
          {
            node_id: 'n2',
            adapter_number: 0,
            port_number: 0,
            label: { rotation: 0, style: 'font-size: 10; font-style: Verdana', text: 'e0/0', x: -20, y: 35 },
          },
        ],
      },
    ],
    drawings: [],
  },
};

describe('GNS3 file → map pipeline (static preview path)', () => {
  let graphDataManager: GraphDataManager;
  let layersManager: LayersManager;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [CartographyModule],
      providers: [MarkerFlashService, SelectionManager],
    });
    graphDataManager = TestBed.inject(GraphDataManager);
    layersManager = TestBed.inject(LayersManager);
  });

  it('resolves link source/target and lands links in layers from mapped file data', () => {
    const data = mapGns3FileTopology(file, 'p1');
    graphDataManager.setNodes(data.nodes);
    const affected = graphDataManager.setLinks(data.links);

    expect(affected.additions.links).toHaveLength(1);
    const link = graphDataManager.getLinks()[0] as any;
    expect(link.source?.id).toBe('n1');
    expect(link.target?.id).toBe('n2');

    const layers = layersManager.getLayersList() as any[];
    const layerLinks = layers.flatMap((l) => l.links || []);
    expect(layerLinks).toHaveLength(1);
  });

  it('re-diffs the same data as additions after a remount reset (GraphDataManager survives the component)', () => {
    // First mount (e.g. panel thumbnail)
    const data = mapGns3FileTopology(file, 'p1');
    graphDataManager.setNodes(data.nodes);
    graphDataManager.setLinks(data.links);
    expect(graphDataManager.getLinks()).toHaveLength(1);

    // Remount (e.g. thumbnail → dialog): createGraph clears the layers and
    // (bug fix) resets the manager. Without the reset, the identical cached
    // dataset diffs as unchanged, the cleared layers are never rebuilt and
    // the new map renders blank.
    graphDataManager.reset();
    layersManager.clear();

    const affectedNodes = graphDataManager.setNodes(data.nodes);
    const affectedLinks = graphDataManager.setLinks(data.links);

    expect(affectedNodes.additions.nodes).toHaveLength(2);
    expect(affectedLinks.additions.links).toHaveLength(1);
    const link = graphDataManager.getLinks()[0] as any;
    expect(link.source?.id).toBe('n1');
    expect(link.target?.id).toBe('n2');
    const layers = layersManager.getLayersList() as any[];
    expect(layers.flatMap((l) => l.links || [])).toHaveLength(1);
  });
});
