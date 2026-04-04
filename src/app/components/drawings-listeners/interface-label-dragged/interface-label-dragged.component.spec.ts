import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ChangeDetectorRef } from '@angular/core';
import { of, Subject, Subscription } from 'rxjs';
import { InterfaceLabelDraggedComponent } from './interface-label-dragged.component';
import { LinksDataSource } from '../../../cartography/datasources/links-datasource';
import { LinksEventSource } from '../../../cartography/events/links-event-source';
import { LinkService } from '@services/link.service';
import { DraggedDataEvent } from '../../../cartography/events/event-source';
import { MapLinkNode } from '../../../cartography/models/map/map-link-node';
import { Link } from '@models/link';
import { Controller } from '@models/controller';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('InterfaceLabelDraggedComponent', () => {
  let fixture: ComponentFixture<InterfaceLabelDraggedComponent>;
  let component: InterfaceLabelDraggedComponent;
  let mockLinksEventSource: any;
  let mockLinksDataSource: any;
  let mockLinkService: any;
  let mockChangeDetectorRef: any;
  let interfaceDragged$: Subject<DraggedDataEvent<MapLinkNode>>;
  let mockController: Controller;

  const createMockLink = (): Link =>
    ({
      link_id: 'link-123',
      nodes: [
        {
          node_id: 'node-1',
          adapter_number: 0,
          port_number: 0,
          label: { rotation: 0, style: '', text: 'e0', x: 100, y: 200, original_x: 100, original_y: 200 },
        },
        {
          node_id: 'node-2',
          adapter_number: 0,
          port_number: 1,
          label: { rotation: 0, style: '', text: 'e1', x: 300, y: 400, original_x: 300, original_y: 400 },
        },
      ],
      project_id: 'project-1',
      kind: 'ethernet',
      state: 'configured',
      segments: [],
      filters: { name: '' },
      link_type: 'ethernet',
    }) as any;

  const createMockController = (): Controller =>
    ({
      id: 1,
      name: 'Test Controller',
      location: 'local',
      host: '192.168.1.100',
      port: 3080,
      protocol: 'http:',
      status: 'running',
      authToken: 'token',
      path: '',
      ubridge_path: '',
      username: '',
      password: '',
      tokenExpired: false,
    }) as any;

  const createDraggedEvent = (nodeId: string, dx: number, dy: number): DraggedDataEvent<MapLinkNode> => {
    const mapLinkNode: MapLinkNode = {
      id: 'node-link-0',
      nodeId,
      linkId: 'link-123',
      adapterNumber: 0,
      portNumber: 0,
      label: { id: 'label-0', rotation: 0, style: '', text: 'e0', x: 100, y: 200, originalX: 100, originalY: 200, nodeId },
    };
    return new DraggedDataEvent(mapLinkNode, dx, dy);
  };

  beforeEach(async () => {
    interfaceDragged$ = new Subject();

    mockLinksEventSource = {
      interfaceDragged: interfaceDragged$,
    };

    const mockLink = createMockLink();
    mockLinksDataSource = {
      get: vi.fn().mockReturnValue(mockLink),
      update: vi.fn(),
    };

    mockLinkService = {
      updateNodes: vi.fn().mockReturnValue(of(mockLink)),
    };

    mockChangeDetectorRef = {
      markForCheck: vi.fn(),
    };

    mockController = createMockController();

    await TestBed.configureTestingModule({
      imports: [InterfaceLabelDraggedComponent],
      providers: [
        { provide: LinksEventSource, useValue: mockLinksEventSource },
        { provide: LinksDataSource, useValue: mockLinksDataSource },
        { provide: LinkService, useValue: mockLinkService },
        { provide: ChangeDetectorRef, useValue: mockChangeDetectorRef },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(InterfaceLabelDraggedComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    fixture.destroy();
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should subscribe to linksEventSource.interfaceDragged', () => {
      fixture.detectChanges();
      expect(interfaceDragged$.observed).toBe(true);
    });
  });

  describe('onInterfaceLabelDragged', () => {
    it('should update label position for first node when dragged node matches nodes[0]', () => {
      fixture.detectChanges();
      const mockLink = createMockLink();
      mockLinksDataSource.get.mockReturnValue(mockLink);

      const event = createDraggedEvent('node-1', 10, 20);
      component.onInterfaceLabelDragged(event);

      expect(mockLink.nodes[0].label.x).toBe(110);
      expect(mockLink.nodes[0].label.y).toBe(220);
    });

    it('should update label position for second node when dragged node matches nodes[1]', () => {
      fixture.detectChanges();
      const mockLink = createMockLink();
      mockLinksDataSource.get.mockReturnValue(mockLink);

      const event = createDraggedEvent('node-2', 15, 25);
      component.onInterfaceLabelDragged(event);

      expect(mockLink.nodes[1].label.x).toBe(315);
      expect(mockLink.nodes[1].label.y).toBe(425);
    });

    it('should not update label when dragged node does not match any link node', () => {
      fixture.detectChanges();
      const mockLink = createMockLink();
      mockLinksDataSource.get.mockReturnValue(mockLink);
      const originalNode0Label = { ...mockLink.nodes[0].label };

      const event = createDraggedEvent('node-999', 10, 20);
      component.onInterfaceLabelDragged(event);

      expect(mockLink.nodes[0].label.x).toBe(originalNode0Label.x);
      expect(mockLink.nodes[0].label.y).toBe(originalNode0Label.y);
    });

    it('should call linkService.updateNodes with controller, link, and nodes', () => {
      fixture.detectChanges();
      fixture.componentRef.setInput('controller', mockController);
      const mockLink = createMockLink();
      mockLinksDataSource.get.mockReturnValue(mockLink);

      const event = createDraggedEvent('node-1', 10, 20);
      component.onInterfaceLabelDragged(event);

      expect(mockLinkService.updateNodes).toHaveBeenCalledWith(
        component.controller(),
        mockLink,
        mockLink.nodes
      );
    });

    it('should update linksDataSource with returned link from service', () => {
      fixture.detectChanges();
      const updatedLink = { ...createMockLink(), link_id: 'link-123-updated' };
      mockLinkService.updateNodes.mockReturnValue(of(updatedLink));

      const mockLink = createMockLink();
      mockLinksDataSource.get.mockReturnValue(mockLink);

      const event = createDraggedEvent('node-1', 10, 20);
      component.onInterfaceLabelDragged(event);

      expect(mockLinksDataSource.update).toHaveBeenCalledWith(updatedLink);
    });
  });

  describe('template', () => {
    it('should have empty template', () => {
      fixture.detectChanges();
      const templateContent = fixture.nativeElement.innerHTML.trim();
      expect(templateContent).toBe('');
    });
  });
});
