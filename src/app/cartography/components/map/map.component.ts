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
import { NodeDragging, NodeDragged, NodeClicked } from '../../events/nodes';
import { LinkCreated } from '../../events/links';
import { CanvasSizeDetector } from '../../helpers/canvas-size-detector';
import { SelectionManager } from '../../managers/selection-manager';
import { NodeWidget } from '../../widgets/node';


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

  @Input('selection-manager') selectionManager: SelectionManager;

  @Input() width = 1500;
  @Input() height = 600;

  @Output() onNodeDragged = new EventEmitter<NodeDragged>();
  @Output() onLinkCreated = new EventEmitter<LinkCreated>();

  private parentNativeElement: any;
  private svg: Selection<SVGSVGElement, any, null, undefined>;

  private onNodeDraggingSubscription: Subscription;
  private onNodeClickedSubscription: Subscription;
  private onNodeDraggedSubscription: Subscription;

  private onChangesDetected: Subscription;

  protected settings = {
    'show_interface_labels': true
  };

  constructor(
    private context: Context,
    private mapChangeDetectorRef: MapChangeDetectorRef,
    private canvasSizeDetector: CanvasSizeDetector,
    protected element: ElementRef,
    protected nodesWidget: NodesWidget,
    protected nodeWidget: NodeWidget,
    protected linksWidget: LinksWidget,
    protected interfaceLabelWidget: InterfaceLabelWidget,
    protected selectionToolWidget: SelectionTool,
    protected movingToolWidget: MovingTool,
    public graphLayout: GraphLayout
    ) {
    this.parentNativeElement = element.nativeElement;
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

  ngOnDestroy() {
    this.graphLayout.disconnect(this.svg);
    this.onNodeDraggingSubscription.unsubscribe();
    this.onNodeClickedSubscription.unsubscribe();
    this.onNodeDraggedSubscription.unsubscribe();
    this.onChangesDetected.unsubscribe();
  }

  ngOnInit() {
    if (this.parentNativeElement !== null) {
      this.createGraph(this.parentNativeElement);
    }
    this.context.size = this.getSize();

    this.onNodeDraggingSubscription = this.nodeWidget.onNodeDragging.subscribe((eventNode: NodeDragging) => {
      let nodes = this.selectionManager.getSelectedNodes();
      
      if (nodes.filter((n: Node) => n.node_id === eventNode.node.node_id).length === 0) {
        this.selectionManager.setSelectedNodes([eventNode.node]);
        nodes = this.selectionManager.getSelectedNodes();
      }

      nodes.forEach((node: Node) => {
        node.x += eventNode.event.dx;
        node.y += eventNode.event.dy;

        this.nodesWidget.redrawNode(this.svg, node);
        const links = this.links.filter((link) => link.target.node_id === node.node_id || link.source.node_id === node.node_id);
        links.forEach((link) => {
          this.linksWidget.redrawLink(this.svg, link);
        });
      });

    });

    this.onNodeDraggedSubscription = this.nodeWidget.onNodeDragged.subscribe((eventNode: NodeDragged) => {
      let nodes = this.selectionManager.getSelectedNodes();
      
      if (nodes.filter((n: Node) => n.node_id === eventNode.node.node_id).length === 0) {
        this.selectionManager.setSelectedNodes([eventNode.node]);
        nodes = this.selectionManager.getSelectedNodes();
      }

      nodes.forEach((node) => {
        this.onNodeDragged.emit(new NodeDragged(eventNode.event, node));
      });
      
    });

    this.onNodeClickedSubscription = this.nodeWidget.onNodeClicked.subscribe((nodeClickedEvent: NodeClicked) => {
      this.selectionManager.setSelectedNodes([nodeClickedEvent.node]);
    });

    this.onChangesDetected = this.mapChangeDetectorRef.changesDetected.subscribe(() => {
      if (this.mapChangeDetectorRef.hasBeenDrawn) {
        this.reload();
      }
    });
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
