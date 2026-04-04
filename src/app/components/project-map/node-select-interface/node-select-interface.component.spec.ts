import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
import { DomSanitizer } from '@angular/platform-browser';
import { SafeStyle } from '@angular/platform-browser';
import { NodeSelectInterfaceComponent } from './node-select-interface.component';
import { Node } from '../../../cartography/models/node';
import { Link } from '@models/link';
import { LinkNode } from '@models/link-node';
import { Port } from '@models/port';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('NodeSelectInterfaceComponent', () => {
  let component: NodeSelectInterfaceComponent;
  let fixture: ComponentFixture<NodeSelectInterfaceComponent>;

  let mockSanitizer: any;
  let mockChangeDetector: any;
  let mockMenuTrigger: any;

  const createMockNode = (nodeId: string, ports: Port[] = []): Node =>
    ({
      node_id: nodeId,
      name: `Node-${nodeId}`,
      ports,
    } as Node);

  const createMockPort = (adapterNumber: number, portNumber: number, name: string): Port =>
    ({
      adapter_number: adapterNumber,
      port_number: portNumber,
      name,
      available: false,
    } as Port);

  const createMockLinkNode = (nodeId: string, adapterNumber: number, portNumber: number): LinkNode =>
    ({
      node_id: nodeId,
      adapter_number: adapterNumber,
      port_number: portNumber,
    } as LinkNode);

  const createMockLink = (nodeIds: string[]): Link =>
    ({
      nodes: nodeIds.map((id) => createMockLinkNode(id, 0, 0)),
    } as Link);

  beforeEach(async () => {
    mockSanitizer = {
      bypassSecurityTrustStyle: vi.fn((value: string): SafeStyle => value as SafeStyle),
    };

    mockChangeDetector = {
      detectChanges: vi.fn(),
    };

    mockMenuTrigger = {
      openMenu: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [NodeSelectInterfaceComponent, MatMenuModule],
    })
      .overrideProvider(DomSanitizer, { useValue: mockSanitizer })
      .compileComponents();

    fixture = TestBed.createComponent(NodeSelectInterfaceComponent);
    component = fixture.componentInstance;

    // Inject mocks to replace component's injected instances
    component['sanitizer'] = mockSanitizer;
    component['changeDetector'] = mockChangeDetector;
    // contextMenu is a viewChild, override by setting the signal directly
    (component as any).contextMenu = vi.fn().mockReturnValue(mockMenuTrigger);

    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
  });

  describe('Creation', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should have undefined ports initially', () => {
      expect(component.ports).toBeUndefined();
    });

    it('should have undefined node initially', () => {
      expect(component.node).toBeUndefined();
    });
  });

  describe('ngOnInit', () => {
    it('should call setPosition with 0, 0', () => {
      const setPositionSpy = vi.spyOn(component, 'setPosition');

      component.ngOnInit();

      expect(setPositionSpy).toHaveBeenCalledWith(0, 0);
    });
  });

  describe('setPosition', () => {
    it('should sanitize and set topPosition', () => {
      component.setPosition(100, 0);

      expect(mockSanitizer.bypassSecurityTrustStyle).toHaveBeenCalledWith('100px');
      expect((component as any).topPosition).toBe('100px');
    });

    it('should sanitize and set leftPosition', () => {
      component.setPosition(0, 200);

      expect(mockSanitizer.bypassSecurityTrustStyle).toHaveBeenCalledWith('200px');
      expect((component as any).leftPosition).toBe('200px');
    });

    it('should call detectChanges on changeDetector', () => {
      component.setPosition(50, 50);

      expect(mockChangeDetector.detectChanges).toHaveBeenCalled();
    });
  });

  describe('open', () => {
    const mockNode = createMockNode('node-1', [createMockPort(0, 0, 'eth0'), createMockPort(0, 1, 'eth1')]);

    beforeEach(() => {
      fixture.componentRef.setInput('links', []);
    });

    it('should set the node', () => {
      component.open(mockNode, 10, 20);

      expect(component.node).toBe(mockNode);
    });

    it('should call filterNodePorts', () => {
      const filterSpy = vi.spyOn(component, 'filterNodePorts');

      component.open(mockNode, 10, 20);

      expect(filterSpy).toHaveBeenCalled();
    });

    it('should call setPosition with provided coordinates', () => {
      const setPositionSpy = vi.spyOn(component, 'setPosition');

      component.open(mockNode, 100, 200);

      expect(setPositionSpy).toHaveBeenCalledWith(100, 200);
    });

    it('should open the context menu', () => {
      component.open(mockNode, 10, 20);

      expect(mockMenuTrigger.openMenu).toHaveBeenCalled();
    });
  });

  describe('filterNodePorts', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('links', []);
    });

    it('should set all ports to available when no links exist', () => {
      component.node = createMockNode('node-1', [createMockPort(0, 0, 'eth0'), createMockPort(0, 1, 'eth1')]);
      fixture.componentRef.setInput('links', []);

      component.filterNodePorts();

      expect(component.ports.length).toBe(2);
      expect(component.ports[0].available).toBe(true);
      expect(component.ports[1].available).toBe(true);
    });

    it('should mark port as unavailable when linked on same adapter and port', () => {
      const port0 = createMockPort(0, 0, 'eth0');
      const port1 = createMockPort(0, 1, 'eth1');
      component.node = createMockNode('node-1', [port0, port1]);

      const link = {
        nodes: [createMockLinkNode('node-1', 0, 0)],
      } as Link;
      fixture.componentRef.setInput('links', [link]);

      component.filterNodePorts();

      expect(component.ports[0].available).toBe(false);
      expect(component.ports[1].available).toBe(true);
    });

    it('should mark port as available when linked on different adapter', () => {
      const port0 = createMockPort(0, 0, 'eth0');
      const port1 = createMockPort(1, 0, 'eth1');
      component.node = createMockNode('node-1', [port0, port1]);

      const link = {
        nodes: [createMockLinkNode('node-1', 0, 0)],
      } as Link;
      fixture.componentRef.setInput('links', [link]);

      component.filterNodePorts();

      expect(component.ports[0].available).toBe(false);
      expect(component.ports[1].available).toBe(true);
    });

    it('should mark port as available when linked on different port of same adapter', () => {
      const port0 = createMockPort(0, 0, 'eth0');
      const port1 = createMockPort(0, 1, 'eth1');
      component.node = createMockNode('node-1', [port0, port1]);

      const link = {
        nodes: [createMockLinkNode('node-1', 0, 1)],
      } as Link;
      fixture.componentRef.setInput('links', [link]);

      component.filterNodePorts();

      expect(component.ports[0].available).toBe(true);
      expect(component.ports[1].available).toBe(false);
    });

    it('should not filter ports for different node_id in links', () => {
      const port0 = createMockPort(0, 0, 'eth0');
      component.node = createMockNode('node-1', [port0]);

      const link = {
        nodes: [createMockLinkNode('node-2', 0, 0)],
      } as Link;
      fixture.componentRef.setInput('links', [link]);

      component.filterNodePorts();

      expect(component.ports[0].available).toBe(true);
    });
  });

  describe('chooseInterface', () => {
    it('should emit chooseInterfaceChange with node and port', () => {
      const emitSpy = vi.spyOn(component.chooseInterfaceChange, 'emit');
      const mockPort = createMockPort(0, 0, 'eth0');
      component.node = createMockNode('node-1');

      component.chooseInterface(mockPort);

      expect(emitSpy).toHaveBeenCalledWith({
        node: component.node,
        port: mockPort,
      });
    });
  });

  describe('Output Events', () => {
    it('should have chooseInterfaceChange EventEmitter', () => {
      expect(component.chooseInterfaceChange).toBeDefined();
    });
  });

  describe('Inputs', () => {
    it('should accept links as signal input', () => {
      const mockLinks = [createMockLink(['node-1', 'node-2'])];
      fixture.componentRef.setInput('links', mockLinks);

      expect(component.links()).toEqual(mockLinks);
    });
  });
});
