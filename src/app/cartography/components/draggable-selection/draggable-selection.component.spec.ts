import { async, ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';

import { DraggableSelectionComponent } from './draggable-selection.component';
import { NodesWidget } from '../../widgets/nodes';
import { DrawingsWidget } from '../../widgets/drawings';
import { LinksWidget } from '../../widgets/links';
import { LabelWidget } from '../../widgets/label';
import { InterfaceLabelWidget } from '../../widgets/interface-label';
import { SelectionManager } from '../../managers/selection-manager';
import { SelectionManagerMock } from '../../managers/selection-manager.spec';
import { NodesEventSource } from '../../events/nodes-event-source';
import { DrawingsEventSource } from '../../events/drawings-event-source';
import { GraphDataManager } from '../../managers/graph-data-manager';
import { MockedGraphDataManager } from '../../managers/graph-data-manager.spec';
import { LinksEventSource } from '../../events/links-event-source';
import { DraggableStart, DraggableDrag, DraggableEnd } from '../../events/draggable';
import { MapNode } from '../../models/map/map-node';
import { EventEmitter } from '@angular/core';
import { MapDrawing } from '../../models/map/map-drawing';
import { MapLabel } from '../../models/map/map-label';
import { MapLinkNode } from '../../models/map/map-link-node';
import { select } from 'd3-selection';
import { MapLink } from '../../models/map/map-link';

describe('DraggableSelectionComponent', () => {
  let component: DraggableSelectionComponent;
  let fixture: ComponentFixture<DraggableSelectionComponent>;
  let mockedGraphDataManager: MockedGraphDataManager;
  let nodesStartEventEmitter: EventEmitter<DraggableStart<MapNode>>;
  let nodesDragEventEmitter: EventEmitter<DraggableDrag<MapNode>>;
  let nodesEndEventEmitter: EventEmitter<DraggableEnd<MapNode>>;

  let drawingsStartEventEmitter: EventEmitter<DraggableStart<MapDrawing>>;
  let drawingsDragEventEmitter: EventEmitter<DraggableDrag<MapDrawing>>;
  let drawingsEndEventEmitter: EventEmitter<DraggableEnd<MapDrawing>>;

  let labelStartEventEmitter: EventEmitter<DraggableStart<MapLabel>>;
  let labelDragEventEmitter: EventEmitter<DraggableDrag<MapLabel>>;
  let labelEndEventEmitter: EventEmitter<DraggableEnd<MapLabel>>;

  let interfaceLabelStartEventEmitter: EventEmitter<DraggableStart<MapLinkNode>>;
  let interfaceLabelDragEventEmitter: EventEmitter<DraggableDrag<MapLinkNode>>;
  let interfaceLabelEndEventEmitter: EventEmitter<DraggableEnd<MapLinkNode>>;

  beforeEach(async(() => {
    mockedGraphDataManager = new MockedGraphDataManager();

    nodesStartEventEmitter = new EventEmitter<DraggableStart<MapNode>>();
    nodesDragEventEmitter = new EventEmitter<DraggableDrag<MapNode>>();
    nodesEndEventEmitter = new EventEmitter<DraggableEnd<MapNode>>();

    drawingsStartEventEmitter = new EventEmitter<DraggableStart<MapDrawing>>();
    drawingsDragEventEmitter = new EventEmitter<DraggableDrag<MapDrawing>>();
    drawingsEndEventEmitter = new EventEmitter<DraggableEnd<MapDrawing>>();

    labelStartEventEmitter = new EventEmitter<DraggableStart<MapLabel>>();
    labelDragEventEmitter = new EventEmitter<DraggableDrag<MapLabel>>();
    labelEndEventEmitter = new EventEmitter<DraggableEnd<MapLabel>>();

    interfaceLabelStartEventEmitter = new EventEmitter<DraggableStart<MapLinkNode>>();
    interfaceLabelDragEventEmitter = new EventEmitter<DraggableDrag<MapLinkNode>>();
    interfaceLabelEndEventEmitter = new EventEmitter<DraggableEnd<MapLinkNode>>();

    const nodesWidgetStub = {
      redrawNode: () => {},
      draggable: {
        start: nodesStartEventEmitter,
        drag: nodesDragEventEmitter,
        end: nodesEndEventEmitter
      }
    };

    const drawingsWidgetStub = {
      redrawDrawing: () => {},
      draggable: {
        start: drawingsStartEventEmitter,
        drag: drawingsDragEventEmitter,
        end: drawingsEndEventEmitter
      }
    };
    const linksWidgetStub = {
      redrawLink: () => {}
    };

    const labelWidgetStub = {
      redrawLabel: () => {},
      draggable: {
        start: labelStartEventEmitter,
        drag: labelDragEventEmitter,
        end: labelEndEventEmitter
      }
    };

    const interfaceLabelWidgetStub = {
      draggable: {
        start: interfaceLabelStartEventEmitter,
        drag: interfaceLabelDragEventEmitter,
        end: interfaceLabelEndEventEmitter
      }
    };

    const nodesEventSourceStub = {
      dragged: { emit: () => {} },
      labelDragged: { emit: () => {} }
    };
    const drawingsEventSourceStub = {
      dragged: { emit: () => {} }
    };
    const linksEventSourceStub = {
      interfaceDragged: { emit: () => {} }
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: NodesWidget, useValue: nodesWidgetStub },
        { provide: DrawingsWidget, useValue: drawingsWidgetStub },
        { provide: LinksWidget, useValue: linksWidgetStub },
        { provide: LabelWidget, useValue: labelWidgetStub },
        { provide: InterfaceLabelWidget, useValue: interfaceLabelWidgetStub },
        { provide: SelectionManager, useValue: new SelectionManagerMock() },
        { provide: NodesEventSource, useValue: nodesEventSourceStub },
        { provide: DrawingsEventSource, useValue: drawingsEventSourceStub },
        { provide: GraphDataManager, useValue: mockedGraphDataManager },
        { provide: LinksEventSource, useValue: linksEventSourceStub }
      ],
      declarations: [DraggableSelectionComponent]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DraggableSelectionComponent);
    component = fixture.componentInstance;
    component.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('nodes dragging', () => {
    let nodesWidgetStub: NodesWidget;
    let linksWidgetStub: LinksWidget;
    let selectionManagerStub: SelectionManager;
    let node: MapNode;

    beforeEach(() => {
      nodesWidgetStub = fixture.debugElement.injector.get(NodesWidget);
      linksWidgetStub = fixture.debugElement.injector.get(LinksWidget);
      selectionManagerStub = fixture.debugElement.injector.get(SelectionManager);
      node = new MapNode();
      node.id = 'nodeid';
      node.x = 1;
      node.y = 2;
    });

    it('should select node when started dragging', fakeAsync(() => {
      nodesWidgetStub.draggable.start.emit(new DraggableStart<MapNode>(node));
      tick();
      expect(selectionManagerStub.getSelected().length).toEqual(1);
    }));

    it('should ignore node when started dragging and node is in selection', fakeAsync(() => {
      selectionManagerStub.setSelected([node]);
      nodesWidgetStub.draggable.start.emit(new DraggableStart<MapNode>(node));
      tick();
      expect(selectionManagerStub.getSelected().length).toEqual(1);
    }));

    it('should update node position when dragging', fakeAsync(() => {
      spyOn(nodesWidgetStub, 'redrawNode');
      selectionManagerStub.setSelected([node]);

      const dragEvent = new DraggableDrag<MapNode>(node);
      dragEvent.dx = 10;
      dragEvent.dy = 20;

      nodesWidgetStub.draggable.drag.emit(dragEvent);
      tick();
      expect(nodesWidgetStub.redrawNode).toHaveBeenCalledWith(select(fixture.componentInstance.svg), node);
      expect(node.x).toEqual(11);
      expect(node.y).toEqual(22);
    }));

    it('should redraw related links target when dragging node', fakeAsync(() => {
      spyOn(nodesWidgetStub, 'redrawNode');
      spyOn(linksWidgetStub, 'redrawLink');
      const link = new MapLink();
      link.target = node;
      mockedGraphDataManager.setLinks([link]);
      selectionManagerStub.setSelected([node]);
      nodesWidgetStub.draggable.drag.emit(new DraggableDrag<MapNode>(node));

      tick();
      expect(linksWidgetStub.redrawLink).toHaveBeenCalledWith(select(fixture.componentInstance.svg), link);
    }));

    it('should redraw related links source when dragging node', fakeAsync(() => {
      spyOn(nodesWidgetStub, 'redrawNode');
      spyOn(linksWidgetStub, 'redrawLink');
      const link = new MapLink();
      link.source = node;
      mockedGraphDataManager.setLinks([link]);
      selectionManagerStub.setSelected([node]);
      nodesWidgetStub.draggable.drag.emit(new DraggableDrag<MapNode>(node));

      tick();
      expect(linksWidgetStub.redrawLink).toHaveBeenCalledWith(select(fixture.componentInstance.svg), link);
    }));

    it('should emit event when node stopped dragging', fakeAsync(() => {
      const nodesEventSourceStub = fixture.debugElement.injector.get(NodesEventSource);
      const spyDragged = spyOn(nodesEventSourceStub.dragged, 'emit');

      selectionManagerStub.setSelected([node]);
      const dragEvent = new DraggableEnd<MapNode>(node);
      dragEvent.dx = 10;
      dragEvent.dy = 20;

      nodesWidgetStub.draggable.end.emit(dragEvent);
      tick();
      expect(nodesEventSourceStub.dragged.emit).toHaveBeenCalled();
      expect(spyDragged.calls.mostRecent().args[0].datum).toEqual(node);
      expect(spyDragged.calls.mostRecent().args[0].dx).toEqual(10);
      expect(spyDragged.calls.mostRecent().args[0].dy).toEqual(20);
    }));
  });

  describe('drawings dragging', () => {
    let drawingsWidgetStub: DrawingsWidget;
    let selectionManagerStub: SelectionManager;
    let drawing: MapDrawing;

    beforeEach(() => {
      drawingsWidgetStub = fixture.debugElement.injector.get(DrawingsWidget);
      selectionManagerStub = fixture.debugElement.injector.get(SelectionManager);
      drawing = new MapDrawing();
      drawing.id = 'drawingid';
      drawing.x = 1;
      drawing.y = 2;
    });

    it('should select drawing when started dragging', fakeAsync(() => {
      drawingsWidgetStub.draggable.start.emit(new DraggableStart<MapDrawing>(drawing));
      tick();
      expect(selectionManagerStub.getSelected().length).toEqual(1);
    }));

    it('should ignore drawing when started dragging and node is in selection', fakeAsync(() => {
      selectionManagerStub.setSelected([drawing]);
      drawingsWidgetStub.draggable.start.emit(new DraggableStart<MapDrawing>(drawing));
      tick();
      expect(selectionManagerStub.getSelected().length).toEqual(1);
    }));

    it('should update drawing position when dragging', fakeAsync(() => {
      spyOn(drawingsWidgetStub, 'redrawDrawing');
      selectionManagerStub.setSelected([drawing]);

      const dragEvent = new DraggableDrag<MapDrawing>(drawing);
      dragEvent.dx = 10;
      dragEvent.dy = 20;

      drawingsWidgetStub.draggable.drag.emit(dragEvent);
      tick();
      expect(drawingsWidgetStub.redrawDrawing).toHaveBeenCalledWith(select(fixture.componentInstance.svg), drawing);
      expect(drawing.x).toEqual(11);
      expect(drawing.y).toEqual(22);
    }));

    it('should emit event when drawing stopped dragging', fakeAsync(() => {
      const drawingsEventSourceStub = fixture.debugElement.injector.get(DrawingsEventSource);
      const spyDragged = spyOn(drawingsEventSourceStub.dragged, 'emit');

      selectionManagerStub.setSelected([drawing]);
      const dragEvent = new DraggableEnd<MapDrawing>(drawing);
      dragEvent.dx = 10;
      dragEvent.dy = 20;

      drawingsWidgetStub.draggable.end.emit(dragEvent);
      tick();
      expect(drawingsEventSourceStub.dragged.emit).toHaveBeenCalled();
      expect(spyDragged.calls.mostRecent().args[0].datum).toEqual(drawing);
      expect(spyDragged.calls.mostRecent().args[0].dx).toEqual(10);
      expect(spyDragged.calls.mostRecent().args[0].dy).toEqual(20);
    }));
  });

  describe('labels dragging', () => {
    let labelWidgetStub: LabelWidget;
    let selectionManagerStub: SelectionManager;
    let label: MapLabel;

    beforeEach(() => {
      labelWidgetStub = fixture.debugElement.injector.get(LabelWidget);
      selectionManagerStub = fixture.debugElement.injector.get(SelectionManager);
      label = new MapLabel();
      label.id = 'labelid';
      label.x = 1;
      label.y = 2;
    });

    it('should select label when started dragging', fakeAsync(() => {
      labelWidgetStub.draggable.start.emit(new DraggableStart<MapLabel>(label));
      tick();
      expect(selectionManagerStub.getSelected().length).toEqual(1);
    }));

    it('should ignore label when started dragging and node is in selection', fakeAsync(() => {
      selectionManagerStub.setSelected([label]);
      labelWidgetStub.draggable.start.emit(new DraggableStart<MapLabel>(label));
      tick();
      expect(selectionManagerStub.getSelected().length).toEqual(1);
    }));

    it('should update label position when dragging', fakeAsync(() => {
      spyOn(labelWidgetStub, 'redrawLabel');
      selectionManagerStub.setSelected([label]);
      const node = new MapNode();
      node.id = 'nodeid';
      node.label = label;
      label.nodeId = node.id;

      mockedGraphDataManager.setNodes([node]);

      const dragEvent = new DraggableDrag<MapLabel>(label);
      dragEvent.dx = 10;
      dragEvent.dy = 20;

      labelWidgetStub.draggable.drag.emit(dragEvent);
      tick();
      expect(labelWidgetStub.redrawLabel).toHaveBeenCalledWith(select(fixture.componentInstance.svg), label);
      expect(label.x).toEqual(11);
      expect(label.y).toEqual(22);
    }));

    it('should not update label position when dragging and parent is selected', fakeAsync(() => {
      spyOn(labelWidgetStub, 'redrawLabel');
      const node = new MapNode();
      node.id = 'nodeid';
      node.label = label;
      label.nodeId = node.id;

      selectionManagerStub.setSelected([label, node]);
      mockedGraphDataManager.setNodes([node]);

      const dragEvent = new DraggableDrag<MapLabel>(label);
      dragEvent.dx = 10;
      dragEvent.dy = 20;

      labelWidgetStub.draggable.drag.emit(dragEvent);
      tick();
      expect(labelWidgetStub.redrawLabel).not.toHaveBeenCalled();
      expect(label.x).toEqual(1);
      expect(label.y).toEqual(2);
    }));

    it('should emit event when label stopped dragging', fakeAsync(() => {
      const nodesEventSourceStub = fixture.debugElement.injector.get(NodesEventSource);
      const spyDragged = spyOn(nodesEventSourceStub.labelDragged, 'emit');

      selectionManagerStub.setSelected([label]);
      const dragEvent = new DraggableEnd<MapLabel>(label);
      dragEvent.dx = 10;
      dragEvent.dy = 20;

      labelWidgetStub.draggable.end.emit(dragEvent);
      tick();
      expect(nodesEventSourceStub.labelDragged.emit).toHaveBeenCalled();
      expect(spyDragged.calls.mostRecent().args[0].datum).toEqual(label);
      expect(spyDragged.calls.mostRecent().args[0].dx).toEqual(10);
      expect(spyDragged.calls.mostRecent().args[0].dy).toEqual(20);
    }));

    it('should not emit event when label stopped dragging and parent node is selected', fakeAsync(() => {
      const nodesEventSourceStub = fixture.debugElement.injector.get(NodesEventSource);
      spyOn(nodesEventSourceStub.labelDragged, 'emit');
      const node = new MapNode();
      node.id = 'nodeid';
      label.nodeId = node.id;

      selectionManagerStub.setSelected([label, node]);
      const dragEvent = new DraggableEnd<MapLabel>(label);
      dragEvent.dx = 10;
      dragEvent.dy = 20;

      labelWidgetStub.draggable.end.emit(dragEvent);
      tick();
      expect(nodesEventSourceStub.labelDragged.emit).not.toHaveBeenCalled();
    }));
  });

  describe('interfaces labels dragging', () => {
    let linksWidgetStub: LinksWidget;
    let interfaceLabelWidgetStub: InterfaceLabelWidget;
    let selectionManagerStub: SelectionManager;
    let linkNode: MapLinkNode;

    beforeEach(() => {
      interfaceLabelWidgetStub = fixture.debugElement.injector.get(InterfaceLabelWidget);
      linksWidgetStub = fixture.debugElement.injector.get(LinksWidget);
      selectionManagerStub = fixture.debugElement.injector.get(SelectionManager);
      linkNode = new MapLinkNode();
      linkNode.label = new MapLabel();
      linkNode.label.x = 1;
      linkNode.label.y = 2;
      linkNode.id = 'linknodeid';
    });

    it('should select interface label when started dragging', fakeAsync(() => {
      interfaceLabelWidgetStub.draggable.start.emit(new DraggableStart<MapLinkNode>(linkNode));
      tick();
      expect(selectionManagerStub.getSelected().length).toEqual(1);
    }));

    it('should ignore interface label when started dragging and node is in selection', fakeAsync(() => {
      selectionManagerStub.setSelected([linkNode]);
      interfaceLabelWidgetStub.draggable.start.emit(new DraggableStart<MapLinkNode>(linkNode));
      tick();
      expect(selectionManagerStub.getSelected().length).toEqual(1);
    }));

    it('should update interface label position when dragging first node', fakeAsync(() => {
      spyOn(linksWidgetStub, 'redrawLink');
      selectionManagerStub.setSelected([linkNode]);
      const node = new MapNode();
      node.id = 'nodeid';
      linkNode.nodeId = node.id;

      const secondLinkNode = new MapLinkNode();
      secondLinkNode.label = new MapLabel();
      secondLinkNode.label.x = 1;
      secondLinkNode.label.y = 2;
      secondLinkNode.id = 'secondlinknodeid';

      const link = new MapLink();
      link.nodes = [linkNode, secondLinkNode];

      mockedGraphDataManager.setLinks([link]);

      const dragEvent = new DraggableDrag<MapLinkNode>(linkNode);
      dragEvent.dx = 10;
      dragEvent.dy = 20;

      interfaceLabelWidgetStub.draggable.drag.emit(dragEvent);
      tick();
      expect(linksWidgetStub.redrawLink).toHaveBeenCalledWith(select(fixture.componentInstance.svg), link);
      expect(linkNode.label.x).toEqual(11);
      expect(linkNode.label.y).toEqual(22);
    }));

    it('should update interface label position when dragging second node', fakeAsync(() => {
      spyOn(linksWidgetStub, 'redrawLink');
      selectionManagerStub.setSelected([linkNode]);
      const node = new MapNode();
      node.id = 'nodeid';
      linkNode.nodeId = node.id;

      const secondLinkNode = new MapLinkNode();
      secondLinkNode.label = new MapLabel();
      secondLinkNode.label.x = 1;
      secondLinkNode.label.y = 2;
      secondLinkNode.id = 'secondlinknodeid';

      const link = new MapLink();
      link.nodes = [secondLinkNode, linkNode];

      mockedGraphDataManager.setLinks([link]);

      const dragEvent = new DraggableDrag<MapLinkNode>(linkNode);
      dragEvent.dx = 10;
      dragEvent.dy = 20;

      interfaceLabelWidgetStub.draggable.drag.emit(dragEvent);
      tick();
      expect(linksWidgetStub.redrawLink).toHaveBeenCalledWith(select(fixture.componentInstance.svg), link);
      expect(linkNode.label.x).toEqual(11);
      expect(linkNode.label.y).toEqual(22);
    }));

    it('should not update interface label position when dragging and parent node is selected', fakeAsync(() => {
      spyOn(linksWidgetStub, 'redrawLink');
      const node = new MapNode();
      node.id = 'nodeid';
      linkNode.nodeId = node.id;

      selectionManagerStub.setSelected([linkNode, node]);

      const secondLinkNode = new MapLinkNode();
      secondLinkNode.label = new MapLabel();
      secondLinkNode.label.x = 1;
      secondLinkNode.label.y = 2;
      secondLinkNode.id = 'secondlinknodeid';

      const link = new MapLink();
      link.nodes = [linkNode, secondLinkNode];

      mockedGraphDataManager.setLinks([link]);

      const dragEvent = new DraggableDrag<MapLinkNode>(linkNode);
      dragEvent.dx = 10;
      dragEvent.dy = 20;

      interfaceLabelWidgetStub.draggable.drag.emit(dragEvent);
      tick();
      expect(linksWidgetStub.redrawLink).not.toHaveBeenCalled();
      expect(linkNode.label.x).toEqual(1);
      expect(linkNode.label.y).toEqual(2);
    }));

    it('should emit event when interface label stopped dragging', fakeAsync(() => {
      const linksEventSourceStub = fixture.debugElement.injector.get(LinksEventSource);
      const spyDragged = spyOn(linksEventSourceStub.interfaceDragged, 'emit');

      selectionManagerStub.setSelected([linkNode]);
      const dragEvent = new DraggableEnd<MapLinkNode>(linkNode);
      dragEvent.dx = 10;
      dragEvent.dy = 20;

      interfaceLabelWidgetStub.draggable.end.emit(dragEvent);
      tick();
      expect(linksEventSourceStub.interfaceDragged.emit).toHaveBeenCalled();
      expect(spyDragged.calls.mostRecent().args[0].datum).toEqual(linkNode);
      expect(spyDragged.calls.mostRecent().args[0].dx).toEqual(10);
      expect(spyDragged.calls.mostRecent().args[0].dy).toEqual(20);
    }));

    it('should not emit event when interface label stopped dragging and parent node is selected', fakeAsync(() => {
      const linksEventSourceStub = fixture.debugElement.injector.get(LinksEventSource);
      spyOn(linksEventSourceStub.interfaceDragged, 'emit');

      const node = new MapNode();
      node.id = 'nodeid';
      linkNode.nodeId = node.id;

      selectionManagerStub.setSelected([linkNode, node]);
      const dragEvent = new DraggableEnd<MapLinkNode>(linkNode);
      dragEvent.dx = 10;
      dragEvent.dy = 20;

      interfaceLabelWidgetStub.draggable.end.emit(dragEvent);
      tick();
      expect(linksEventSourceStub.interfaceDragged.emit).not.toHaveBeenCalled();
    }));
  });
});
