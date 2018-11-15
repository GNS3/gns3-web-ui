import {
  Component, ElementRef, HostListener, Input, OnChanges, OnDestroy, OnInit, SimpleChange, EventEmitter, Output
} from '@angular/core';
import { Selection, select } from 'd3-selection';

import { GraphLayout } from "../../widgets/graph-layout";
import { Context } from "../../models/context";
import { Size } from "../../models/size";
import { NodesWidget } from '../../widgets/nodes';
import { Subscription } from 'rxjs';
import { InterfaceLabelWidget } from '../../widgets/interface-label';
import { SelectionTool } from '../../tools/selection-tool';
import { MovingTool } from '../../tools/moving-tool';
import { LinksWidget } from '../../widgets/links';
import { MapChangeDetectorRef } from '../../services/map-change-detector-ref';
import { LinkCreated } from '../../events/links';
import { CanvasSizeDetector } from '../../helpers/canvas-size-detector';
import { NodeWidget } from '../../widgets/node';
import { MapListeners } from '../../listeners/map-listeners';
import { DraggedDataEvent } from '../../events/event-source';
import { NodesEventSource } from '../../events/nodes-event-source';
import { DrawingsEventSource } from '../../events/drawings-event-source';
import { DrawingsWidget } from '../../widgets/drawings';
import { Node } from '../../models/node';
import { Link } from '../../../models/link';
import { Drawing } from '../../models/drawing';
import { Symbol } from '../../../models/symbol';
import { MapNodeToNodeConverter } from '../../converters/map/map-node-to-node-converter';
import { MapPortToPortConverter } from '../../converters/map/map-port-to-port-converter';
import { GraphDataManager } from '../../managers/graph-data-manager';
import { MapDrawingToDrawingConverter } from '../../converters/map/map-drawing-to-drawing-converter';


@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss']
})
export class MapComponent implements OnInit, OnChanges, OnDestroy {
  @Input() nodes: Node[] = [];
  @Input() links: Link[] = [];
  @Input() drawings: Drawing[] = [];
  @Input() symbols: Symbol[] = [];

  @Input() width = 1500;
  @Input() height = 600;

  @Output() nodeDragged = new EventEmitter<DraggedDataEvent<Node>>();
  @Output() drawingDragged = new EventEmitter<DraggedDataEvent<Drawing>>();
  @Output() onLinkCreated = new EventEmitter<LinkCreated>();

  private parentNativeElement: any;
  private svg: Selection<SVGSVGElement, any, null, undefined>;

  private onChangesDetected: Subscription;
  private nodeDraggedSub: Subscription;
  private drawingDraggedSub: Subscription;

  protected settings = {
    'show_interface_labels': true
  };

  constructor(
    private graphDataManager: GraphDataManager,
    private context: Context,
    private mapChangeDetectorRef: MapChangeDetectorRef,
    private canvasSizeDetector: CanvasSizeDetector,
    private mapListeners: MapListeners,
    private mapNodeToNode: MapNodeToNodeConverter,
    private mapPortToPort: MapPortToPortConverter,
    private mapDrawingToDrawing: MapDrawingToDrawingConverter,
    protected element: ElementRef,
    protected nodesWidget: NodesWidget,
    protected nodeWidget: NodeWidget,
    protected linksWidget: LinksWidget,
    protected drawingsWidget: DrawingsWidget,
    protected interfaceLabelWidget: InterfaceLabelWidget,
    protected selectionToolWidget: SelectionTool,
    protected movingToolWidget: MovingTool,
    public graphLayout: GraphLayout,
    private nodesEventSource: NodesEventSource,
    private drawingsEventSource: DrawingsEventSource,
    ) {
    this.parentNativeElement = element.nativeElement;

    this.selectionToolWidget.setEnabled(false);
    this.movingToolWidget.setEnabled(false);
  }

  @Input('show-interface-labels') 
  set showInterfaceLabels(value) {
    this.settings.show_interface_labels = value;
    this.interfaceLabelWidget.setEnabled(value);
    this.mapChangeDetectorRef.detectChanges();
  }

  @Input('moving-tool')
  set movingTool(value) {
    this.movingToolWidget.setEnabled(value);
    this.mapChangeDetectorRef.detectChanges();
  }

  @Input('selection-tool')
  set selectionTool(value) {
    this.selectionToolWidget.setEnabled(value);
    this.mapChangeDetectorRef.detectChanges();
  }

  @Input('draw-link-tool') drawLinkTool: boolean;

  @Input('readonly') set readonly(value) {
    this.nodesWidget.draggingEnabled = !value;
    this.drawingsWidget.draggingEnabled = !value;
  }
  
  ngOnChanges(changes: { [propKey: string]: SimpleChange }) {
    if (
      (changes['width'] && !changes['width'].isFirstChange()) ||
      (changes['height'] && !changes['height'].isFirstChange()) ||
      (changes['drawings'] && !changes['drawings'].isFirstChange()) ||
      (changes['nodes'] && !changes['nodes'].isFirstChange()) ||
      (changes['links'] && !changes['links'].isFirstChange()) ||
      (changes['symbols'] && !changes['symbols'].isFirstChange())
    ) {
      if (this.svg.empty && !this.svg.empty()) {
        if (changes['symbols']) {
          this.onSymbolsChange(changes['symbols']);
        }
        this.changeLayout();
      }
    }
  }

  ngOnInit() {
    if (this.parentNativeElement !== null) {
      this.createGraph(this.parentNativeElement);
    }
    this.context.size = this.getSize();

    this.onChangesDetected = this.mapChangeDetectorRef.changesDetected.subscribe(() => {
      if (this.mapChangeDetectorRef.hasBeenDrawn) {
        this.redraw();
      }
    });

    this.nodeDraggedSub = this.nodesEventSource.dragged.subscribe((evt) => {
      this.nodeDragged.emit(new DraggedDataEvent<Node>(this.mapNodeToNode.convert(evt.datum), evt.dx, evt.dy));
    });

    this.drawingDraggedSub = this.drawingsEventSource.dragged.subscribe((evt) => {
      this.drawingDragged.emit(new DraggedDataEvent<Drawing>(this.mapDrawingToDrawing.convert(evt.datum), evt.dx, evt.dy));
    });

    this.mapListeners.onInit(this.svg);
  }

  ngOnDestroy() {
    this.graphLayout.disconnect(this.svg);
    this.onChangesDetected.unsubscribe();
    this.mapListeners.onDestroy();
    this.nodeDraggedSub.unsubscribe();
    this.drawingDraggedSub.unsubscribe();
  }

  public createGraph(domElement: HTMLElement) {
    const rootElement = select(domElement);
    this.svg = rootElement.select<SVGSVGElement>('svg');
    this.graphLayout.connect(this.svg, this.context);
    this.graphLayout.draw(this.svg, this.context);
    this.mapChangeDetectorRef.hasBeenDrawn = true;
  }

  public getSize(): Size {
    return this.canvasSizeDetector.getOptimalSize(this.width, this.height);
  }

  protected linkCreated(evt) {
    const linkCreated = new LinkCreated(
      this.mapNodeToNode.convert(evt.sourceNode),
      this.mapPortToPort.convert(evt.sourcePort),
      this.mapNodeToNode.convert(evt.targetNode),
      this.mapPortToPort.convert(evt.targetPort)
    );

    this.onLinkCreated.emit(linkCreated);
  }

  private changeLayout() {
    if (this.parentNativeElement != null) {
      this.context.size = this.getSize();
    }

    this.redraw();
  }


  private onSymbolsChange(change: SimpleChange) {
    this.graphDataManager.setSymbols(this.symbols);
  }

  private redraw() {
    this.graphDataManager.setNodes(this.nodes);
    this.graphDataManager.setLinks(this.links);
    this.graphDataManager.setDrawings(this.drawings);

    this.graphLayout.draw(this.svg, this.context);
  }

  @HostListener('window:resize', ['$event'])
  onResize(event) {
    this.changeLayout();
  }
}
