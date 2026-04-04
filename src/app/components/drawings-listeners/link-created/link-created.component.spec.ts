import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EventEmitter } from '@angular/core';
import { LinkCreatedComponent } from './link-created.component';
import { LinksEventSource } from '../../../cartography/events/links-event-source';
import { MapNodeToNodeConverter } from '../../../cartography/converters/map/map-node-to-node-converter';
import { MapPortToPortConverter } from '../../../cartography/converters/map/map-port-to-port-converter';
import { LinksDataSource } from '../../../cartography/datasources/links-datasource';
import { LinkService } from '@services/link.service';
import { ProjectService } from '@services/project.service';
import { MapLinkCreated } from '../../../cartography/events/links';
import { MapNode } from '../../../cartography/models/map/map-node';
import { MapPort } from '../../../cartography/models/map/map-port';
import { Node } from '../../../cartography/models/node';
import { Port } from '@models/port';
import { Link } from '@models/link';
import { Project } from '@models/project';
import { Controller } from '@models/controller';
import { of, Subject } from 'rxjs';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('LinkCreatedComponent', () => {
  let fixture: ComponentFixture<LinkCreatedComponent>;
  let component: LinkCreatedComponent;

  // Mocks
  let mockLinksEventSource: { created: EventEmitter<MapLinkCreated> };
  let mockMapNodeToNode: { convert: ReturnType<typeof vi.fn> };
  let mockMapPortToPort: { convert: ReturnType<typeof vi.fn> };
  let mockLinksDataSource: { set: ReturnType<typeof vi.fn> };
  let mockLinkService: { createLink: ReturnType<typeof vi.fn> };
  let mockProjectService: { links: ReturnType<typeof vi.fn> };

  // Events
  let linkCreatedEmitter: EventEmitter<MapLinkCreated>;

  // Test data
  let mockController: Controller;
  let mockProject: Project;
  let mockSourceNode: MapNode;
  let mockTargetNode: MapNode;
  let mockSourcePort: MapPort;
  let mockTargetPort: MapPort;
  let mockLinkCreatedEvent: MapLinkCreated;
  let mockConvertedSourceNode: Node;
  let mockConvertedTargetNode: Node;
  let mockConvertedSourcePort: Port;
  let mockConvertedTargetPort: Port;

  const createMapNode = (overrides: Partial<MapNode> = {}): MapNode => ({
    id: 'node1',
    commandLine: '',
    computeId: 'local',
    console: 0,
    consoleHost: '0.0.0.0',
    consoleType: '',
    firstPortName: '',
    height: 50,
    label: { id: 'label1', rotation: 0, style: '', text: '', x: 0, y: 0, originalX: 0, originalY: 0, nodeId: 'node1' },
    locked: false,
    name: 'Test Node',
    nodeDirectory: '',
    nodeType: 'vpcs',
    portNameFormat: '',
    portSegmentSize: 0,
    ports: [],
    properties: {} as any,
    projectId: 'proj1',
    status: 'started',
    symbol: '',
    symbolUrl: '',
    width: 50,
    x: 0,
    y: 0,
    z: 0,
    ...overrides,
  });

  const createMapPort = (overrides: Partial<MapPort> = {}): MapPort => ({
    adapterNumber: 0,
    linkType: 'ethernet',
    name: 'Ethernet0',
    portNumber: 0,
    shortName: 'e0',
    ...overrides,
  });

  beforeEach(async () => {
    linkCreatedEmitter = new EventEmitter<MapLinkCreated>();

    mockMapNodeToNode = {
      convert: vi.fn(),
    };

    mockMapPortToPort = {
      convert: vi.fn(),
    };

    mockLinksDataSource = {
      set: vi.fn(),
    };

    mockLinkService = {
      createLink: vi.fn().mockReturnValue(of({})),
    };

    mockProjectService = {
      links: vi.fn().mockReturnValue(of([])),
    };

    mockLinksEventSource = {
      created: linkCreatedEmitter,
    };

    mockController = { name: 'local' } as Controller;
    mockProject = { project_id: 'proj1' } as Project;

    mockSourceNode = createMapNode({ id: 'source', x: 0, y: 0, width: 50, height: 50 });
    mockTargetNode = createMapNode({ id: 'target', x: 100, y: 100, width: 50, height: 50 });
    mockSourcePort = createMapPort({ name: 'source-port' });
    mockTargetPort = createMapPort({ name: 'target-port' });

    mockLinkCreatedEvent = new MapLinkCreated(
      mockSourceNode,
      mockSourcePort,
      mockTargetNode,
      mockTargetPort
    );

    mockConvertedSourceNode = { node_id: 'source' } as unknown as Node;
    mockConvertedTargetNode = { node_id: 'target' } as unknown as Node;
    mockConvertedSourcePort = { name: 'source-port', adapter_number: 0, adapter_type: 'ethernet', link_type: 'ethernet', port_number: 0, short_name: 'e0' } as Port;
    mockConvertedTargetPort = { name: 'target-port', adapter_number: 0, adapter_type: 'ethernet', link_type: 'ethernet', port_number: 0, short_name: 'e0' } as Port;

    mockMapNodeToNode.convert
      .mockReturnValueOnce(mockConvertedSourceNode)
      .mockReturnValueOnce(mockConvertedTargetNode);
    mockMapPortToPort.convert
      .mockReturnValueOnce(mockConvertedSourcePort)
      .mockReturnValueOnce(mockConvertedTargetPort);

    await TestBed.configureTestingModule({
      imports: [LinkCreatedComponent],
      providers: [
        { provide: LinksEventSource, useValue: mockLinksEventSource },
        { provide: MapNodeToNodeConverter, useValue: mockMapNodeToNode },
        { provide: MapPortToPortConverter, useValue: mockMapPortToPort },
        { provide: LinksDataSource, useValue: mockLinksDataSource },
        { provide: LinkService, useValue: mockLinkService },
        { provide: ProjectService, useValue: mockProjectService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LinkCreatedComponent);
    component = fixture.componentInstance;

    fixture.componentRef.setInput('controller', mockController);
    component.project = mockProject;

    fixture.detectChanges();
  });

  afterEach(() => {
    if (fixture) {
      fixture.destroy();
    }
  });

  describe('ngOnInit', () => {
    it('should subscribe to linksEventSource.created', () => {
      const subscribeSpy = vi.spyOn(mockLinksEventSource.created, 'subscribe');

      const testComponent = fixture.componentInstance;
      testComponent.ngOnInit();

      expect(subscribeSpy).toHaveBeenCalled();
    });

    it('should not call createLink when component initializes without events', () => {
      expect(mockLinkService.createLink).not.toHaveBeenCalled();
    });
  });

  describe('onLinkCreated', () => {
    it('should convert source and target nodes', () => {
      component.onLinkCreated(mockLinkCreatedEvent);

      expect(mockMapNodeToNode.convert).toHaveBeenCalledWith(mockSourceNode);
      expect(mockMapNodeToNode.convert).toHaveBeenCalledWith(mockTargetNode);
    });

    it('should convert source and target ports', () => {
      component.onLinkCreated(mockLinkCreatedEvent);

      expect(mockMapPortToPort.convert).toHaveBeenCalledWith(mockSourcePort);
      expect(mockMapPortToPort.convert).toHaveBeenCalledWith(mockTargetPort);
    });

    it('should call linkService.createLink with correct parameters', () => {
      component.onLinkCreated(mockLinkCreatedEvent);

      expect(mockLinkService.createLink).toHaveBeenCalledWith(
        mockController,
        mockConvertedSourceNode,
        mockConvertedSourcePort,
        mockConvertedTargetNode,
        mockConvertedTargetPort,
        expect.any(Number),
        expect.any(Number),
        expect.any(Number),
        expect.any(Number)
      );
    });

    it('should calculate label positions for source node in first quadrant (source <= target)', () => {
      const sourceNode = createMapNode({ x: 0, y: 0, width: 50, height: 50 });
      const targetNode = createMapNode({ x: 100, y: 100, width: 50, height: 50 });
      const event = new MapLinkCreated(sourceNode, mockSourcePort, targetNode, mockTargetPort);

      component.onLinkCreated(event);

      const createLinkCall = mockLinkService.createLink.mock.calls[0];
      const xLabelSourceNode = createLinkCall[5];
      const yLabelSourceNode = createLinkCall[6];

      expect(xLabelSourceNode).toBeGreaterThan(0);
      expect(yLabelSourceNode).toBeGreaterThan(0);
    });

    it('should calculate label positions for target node in first quadrant (source <= target)', () => {
      const sourceNode = createMapNode({ x: 0, y: 0, width: 50, height: 50 });
      const targetNode = createMapNode({ x: 100, y: 100, width: 50, height: 50 });
      const event = new MapLinkCreated(sourceNode, mockSourcePort, targetNode, mockTargetPort);

      component.onLinkCreated(event);

      const createLinkCall = mockLinkService.createLink.mock.calls[0];
      const xLabelTargetNode = createLinkCall[7];
      const yLabelTargetNode = createLinkCall[8];

      expect(xLabelTargetNode).toBeLessThan(100);
      expect(yLabelTargetNode).toBeLessThan(100);
    });

    it('should handle second quadrant case (source.x > target.x, source.y < target.y)', () => {
      const sourceNode = createMapNode({ x: 100, y: 0, width: 50, height: 50 });
      const targetNode = createMapNode({ x: 0, y: 100, width: 50, height: 50 });
      const event = new MapLinkCreated(sourceNode, mockSourcePort, targetNode, mockTargetPort);

      component.onLinkCreated(event);

      expect(mockLinkService.createLink).toHaveBeenCalled();
    });

    it('should handle third quadrant case (source.x < target.x, source.y > target.y)', () => {
      const sourceNode = createMapNode({ x: 0, y: 100, width: 50, height: 50 });
      const targetNode = createMapNode({ x: 100, y: 0, width: 50, height: 50 });
      const event = new MapLinkCreated(sourceNode, mockSourcePort, targetNode, mockTargetPort);

      component.onLinkCreated(event);

      expect(mockLinkService.createLink).toHaveBeenCalled();
    });

    it('should handle fourth quadrant case (source.x >= target.x, source.y >= target.y)', () => {
      const sourceNode = createMapNode({ x: 100, y: 100, width: 50, height: 50 });
      const targetNode = createMapNode({ x: 0, y: 0, width: 50, height: 50 });
      const event = new MapLinkCreated(sourceNode, mockSourcePort, targetNode, mockTargetPort);

      component.onLinkCreated(event);

      expect(mockLinkService.createLink).toHaveBeenCalled();
    });
  });

  describe('link creation flow', () => {
    it('should refresh links data source after link is created', () => {
      const mockLinks: Link[] = [{ link_id: 'link1' } as Link];
      mockProjectService.links.mockReturnValue(of(mockLinks));

      component.onLinkCreated(mockLinkCreatedEvent);

      expect(mockProjectService.links).toHaveBeenCalledWith(mockController, mockProject.project_id);
    });

    it('should update linksDataSource with returned links after creation', () => {
      const mockLinks: Link[] = [{ link_id: 'link1' }, { link_id: 'link2' }] as Link[];
      mockProjectService.links.mockReturnValue(of(mockLinks));

      component.onLinkCreated(mockLinkCreatedEvent);

      expect(mockLinksDataSource.set).toHaveBeenCalledWith(mockLinks);
    });

    it('should not update linksDataSource when projectService.links fails', () => {
      mockProjectService.links.mockReturnValue(new Subject<Link[]>().pipe());

      component.onLinkCreated(mockLinkCreatedEvent);

      expect(mockLinksDataSource.set).not.toHaveBeenCalled();
    });
  });

  describe('ngOnDestroy', () => {
    it('should unsubscribe from linksEventSource.created when component is destroyed', () => {
      const unsubscribeSpy = vi.fn();
      const originalSubscribe = mockLinksEventSource.created.subscribe;
      mockLinksEventSource.created.subscribe = vi.fn().mockReturnValue({
        unsubscribe: unsubscribeSpy,
      });

      const testComponent = fixture.componentInstance;
      testComponent.ngOnInit();
      testComponent.ngOnDestroy();

      expect(unsubscribeSpy).toHaveBeenCalled();
    });
  });
});
