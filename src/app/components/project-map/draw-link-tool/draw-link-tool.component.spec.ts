import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EventEmitter } from '@angular/core';
import { DrawLinkToolComponent } from './draw-link-tool.component';
import { DrawingLineWidget } from '../../../cartography/widgets/drawing-line';
import { NodesEventSource } from '../../../cartography/events/nodes-event-source';
import { LinksEventSource } from '../../../cartography/events/links-event-source';
import { MapNodeToNodeConverter } from '../../../cartography/converters/map/map-node-to-node-converter';
import { NodeToMapNodeConverter } from '../../../cartography/converters/map/node-to-map-node-converter';
import { PortToMapPortConverter } from '../../../cartography/converters/map/port-to-map-port-converter';
import { ClickedDataEvent } from '../../../cartography/events/event-source';
import { MapLinkCreated } from '../../../cartography/events/links';
import { MapNode } from '../../../cartography/models/map/map-node';
import { MapPort } from '../../../cartography/models/map/map-port';
import { Node } from '../../../cartography/models/node';
import { Port } from '@models/port';
import { ToasterService } from '../../../services/toaster.service';
import { ChangeDetectorRef } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('DrawLinkToolComponent', () => {
  let fixture: ComponentFixture<DrawLinkToolComponent>;
  let component: DrawLinkToolComponent;

  // Mocks
  let mockDrawingLineTool: { [key: string]: ReturnType<typeof vi.fn> };
  let mockNodesEventSource: { clicked: EventEmitter<ClickedDataEvent<MapNode>> };
  let mockLinksEventSource: { created: EventEmitter<MapLinkCreated> };
  let mockMapNodeToNode: { convert: ReturnType<typeof vi.fn> };
  let mockNodeToMapNode: { convert: ReturnType<typeof vi.fn> };
  let mockPortToMapPort: { convert: ReturnType<typeof vi.fn> };
  let mockNodeSelectMenu: { open: ReturnType<typeof vi.fn> };
  let mockToasterService: { error: ReturnType<typeof vi.fn> };
  let mockChangeDetectorRef: { markForCheck: ReturnType<typeof vi.fn> };

  // Emitter for node clicks
  let nodeClickedEmitter: EventEmitter<ClickedDataEvent<MapNode>>;

  beforeEach(async () => {
    vi.clearAllMocks();
    nodeClickedEmitter = new EventEmitter<ClickedDataEvent<MapNode>>();

    mockDrawingLineTool = {
      isDrawing: vi.fn().mockReturnValue(false),
      start: vi.fn(),
      stop: vi.fn().mockReturnValue({}),
      connect: vi.fn(),
      draw: vi.fn(),
    };

    mockNodesEventSource = {
      clicked: nodeClickedEmitter,
    };

    mockLinksEventSource = {
      created: {
        emit: vi.fn(),
      } as unknown as EventEmitter<MapLinkCreated>,
    };

    mockMapNodeToNode = {
      convert: vi.fn().mockReturnValue({} as Node),
    };

    mockNodeToMapNode = {
      convert: vi.fn().mockReturnValue({} as MapNode),
    };

    mockPortToMapPort = {
      convert: vi.fn().mockReturnValue({} as MapPort),
    };

    mockNodeSelectMenu = {
      open: vi.fn(),
    };

    mockToasterService = {
      error: vi.fn(),
    };

    mockChangeDetectorRef = {
      markForCheck: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [DrawLinkToolComponent],
      providers: [
        { provide: DrawingLineWidget, useValue: mockDrawingLineTool },
        { provide: NodesEventSource, useValue: mockNodesEventSource },
        { provide: LinksEventSource, useValue: mockLinksEventSource },
        { provide: MapNodeToNodeConverter, useValue: mockMapNodeToNode },
        { provide: NodeToMapNodeConverter, useValue: mockNodeToMapNode },
        { provide: PortToMapPortConverter, useValue: mockPortToMapPort },
        { provide: ToasterService, useValue: mockToasterService },
        { provide: ChangeDetectorRef, useValue: mockChangeDetectorRef },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DrawLinkToolComponent);
    component = fixture.componentInstance;

    // Override viewChild signal - it returns a function that returns the child component
    // We need to make nodeSelectInterfaceMenu() return our mock
    Object.defineProperty(component, 'nodeSelectInterfaceMenu', {
      get: () => () => mockNodeSelectMenu,
      configurable: true,
      enumerable: true,
    });
  });

  afterEach(() => {
    fixture.destroy();
  });

  describe('ngOnInit', () => {
    it('should subscribe to node clicked events', () => {
      fixture.detectChanges();
      expect(nodeClickedEmitter.observers.length).toBe(1);
    });

    it('should open node select interface menu when a node is clicked', () => {
      const mapNode = createMapNode({ id: 'node-1', x: 100, y: 200 });
      const node = createNode({ node_id: 'node-1' });
      const clickedEvent = new ClickedDataEvent<MapNode>(mapNode, 150, 250);

      mockMapNodeToNode.convert.mockReturnValue(node);

      fixture.detectChanges();
      nodeClickedEmitter.emit(clickedEvent);

      expect(mockMapNodeToNode.convert).toHaveBeenCalledWith(mapNode);
      expect(mockNodeSelectMenu.open).toHaveBeenCalledWith(node, clickedEvent.y, clickedEvent.x);
    });
  });

  describe('ngOnDestroy', () => {
    it('should stop drawing line tool when isDrawing is true', () => {
      mockDrawingLineTool.isDrawing.mockReturnValue(true);
      fixture.detectChanges();
      fixture.destroy();

      expect(mockDrawingLineTool.stop).toHaveBeenCalled();
    });

    it('should not stop drawing line tool when isDrawing is false', () => {
      mockDrawingLineTool.isDrawing.mockReturnValue(false);
      fixture.detectChanges();
      fixture.destroy();

      expect(mockDrawingLineTool.stop).not.toHaveBeenCalled();
    });
  });

  describe('onChooseInterface', () => {
    beforeEach(() => {
      // Ensure ngOnInit runs to initialize nodeClicked$
      fixture.detectChanges();
    });

    it('should start drawing when not already drawing', () => {
      mockDrawingLineTool.isDrawing.mockReturnValue(false);

      const mapNode = createMapNode({ id: 'node-1', x: 100, y: 200, width: 50, height: 30 });
      const mapPort = createMapPort({ name: 'eth0' });
      const node = createNode({ node_id: 'node-1' });
      const port = createPort({ name: 'eth0' });

      mockNodeToMapNode.convert.mockReturnValue(mapNode);
      mockPortToMapPort.convert.mockReturnValue(mapPort);

      component.onChooseInterface({ node, port });

      expect(mockNodeToMapNode.convert).toHaveBeenCalledWith(node);
      expect(mockPortToMapPort.convert).toHaveBeenCalledWith(port);
      expect(mockDrawingLineTool.start).toHaveBeenCalledWith(
        mapNode.x + mapNode.width / 2,
        mapNode.y + mapNode.height / 2,
        { node: mapNode, port: mapPort }
      );
    });

    it('should stop drawing and emit link created event when already drawing', () => {
      mockDrawingLineTool.isDrawing.mockReturnValue(true);

      const existingMapNode = createMapNode({ id: 'node-1', x: 100, y: 200, width: 50, height: 30 });
      const existingMapPort = createMapPort({ name: 'eth0' });
      const newMapNode = createMapNode({ id: 'node-2', x: 300, y: 400, width: 50, height: 30 });
      const newMapPort = createMapPort({ name: 'eth1' });
      const existingNode = createNode({ node_id: 'node-1' });
      const existingPort = createPort({ name: 'eth0' });
      const newNode = createNode({ node_id: 'node-2' });
      const newPort = createPort({ name: 'eth1' });

      const stopData = { node: existingMapNode, port: existingMapPort };
      mockDrawingLineTool.stop.mockReturnValue(stopData);
      mockNodeToMapNode.convert.mockReturnValue(newMapNode);
      mockPortToMapPort.convert.mockReturnValue(newMapPort);

      component.onChooseInterface({ node: newNode, port: newPort });

      expect(mockDrawingLineTool.stop).toHaveBeenCalled();
      expect(mockLinksEventSource.created.emit).toHaveBeenCalledWith(
        new MapLinkCreated(existingMapNode, existingMapPort, newMapNode, newMapPort)
      );
    });
  });

  // Helper functions
  function createMapNode(overrides: Partial<MapNode> = {}): MapNode {
    const mapNode = new MapNode();
    Object.assign(mapNode, overrides);
    return mapNode;
  }

  function createNode(overrides: Partial<Node> = {}): Node {
    const node = new Node();
    Object.assign(node, overrides);
    return node;
  }

  function createMapPort(overrides: Partial<MapPort> = {}): MapPort {
    const mapPort = new MapPort();
    Object.assign(mapPort, overrides);
    return mapPort;
  }

  function createPort(overrides: Partial<Port> = {}): Port {
    const port = new Port();
    Object.assign(port, overrides);
    return port;
  }
});
