import {
  Component, ElementRef, HostListener, Input, OnChanges, OnDestroy, OnInit, SimpleChange, EventEmitter, Output
} from '@angular/core';
import { Selection, select } from 'd3-selection';

import { Node } from "../../models/node";
import { Link } from "../../../models/link";
import { GraphLayout } from "../../widgets/graph-layout";
import { Context } from "../../models/context";
import { Size } from "../../models/size";
import { Drawing } from "../../models/drawing";
import { Symbol } from '../../../models/symbol';
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

  @Output() nodeDragged: EventEmitter<DraggedDataEvent<Node>>;
  @Output() drawingDragged: EventEmitter<DraggedDataEvent<Drawing>>;
  @Output() onLinkCreated = new EventEmitter<LinkCreated>();

  private parentNativeElement: any;
  private svg: Selection<SVGSVGElement, any, null, undefined>;

  private onChangesDetected: Subscription;

  protected settings = {
    'show_interface_labels': true
  };

  constructor(
    private context: Context,
    private mapChangeDetectorRef: MapChangeDetectorRef,
    private canvasSizeDetector: CanvasSizeDetector,
    private mapListeners: MapListeners,
    protected element: ElementRef,
    protected nodesWidget: NodesWidget,
    protected nodeWidget: NodeWidget,
    protected linksWidget: LinksWidget,
    protected drawingsWidget: DrawingsWidget,
    protected interfaceLabelWidget: InterfaceLabelWidget,
    protected selectionToolWidget: SelectionTool,
    protected movingToolWidget: MovingTool,
    public graphLayout: GraphLayout,
    nodesEventSource: NodesEventSource,
    drawingsEventSource: DrawingsEventSource,
    ) {
    this.parentNativeElement = element.nativeElement;
    this.nodeDragged = nodesEventSource.dragged;
    this.drawingDragged = drawingsEventSource.dragged;
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
        if (changes['nodes']) {
          this.onNodesChange(changes['nodes']);
        }
        if (changes['links']) {
          this.onLinksChange(changes['links']);
        }
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
        this.reload();
      }
    });

    this.mapListeners.onInit(this.svg);
  }

  ngOnDestroy() {
    this.graphLayout.disconnect(this.svg);
    this.onChangesDetected.unsubscribe();
    this.mapListeners.onDestroy();
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
    this.onLinkCreated.emit(evt);
  }

  private changeLayout() {
    if (this.parentNativeElement != null) {
      this.context.size = this.getSize();
    }

    this.graphLayout.setNodes(this.nodes);
    this.graphLayout.setLinks(this.links);
    this.graphLayout.setDrawings(this.drawings);

    this.redraw();
  }

  private onLinksChange(change: SimpleChange) {
    const nodes_by_id = {};
    this.nodes.forEach((n: Node) => {
      nodes_by_id[n.node_id] = n;
    });

    this.links.forEach((link: Link) => {
      const source_id = link.nodes[0].node_id;
      const target_id = link.nodes[1].node_id;
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
  }

  private onNodesChange(change: SimpleChange) {
    this.onLinksChange(null);
  }

  private onSymbolsChange(change: SimpleChange) {
    this.nodeWidget.setSymbols(this.symbols);
  }

  public redraw() {
    this.graphLayout.draw(this.svg, this.context);
  }

  public reload() {
    this.onLinksChange(null);
    this.redraw();
  }

  @HostListener('window:resize', ['$event'])
  onResize(event) {
    this.changeLayout();
  }
}
