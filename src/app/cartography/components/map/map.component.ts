import {
  Component, ElementRef, HostListener, Input, OnChanges, OnDestroy, OnInit, SimpleChange, EventEmitter, Output
} from '@angular/core';
import { D3, D3Service } from 'd3-ng2-service';
import { Selection } from 'd3-selection';

import { Node } from "../../models/node";
import { Link } from "../../../models/link";
import { GraphLayout } from "../../widgets/graph-layout";
import { Context } from "../../models/context";
import { Size } from "../../models/size";
import { Drawing } from "../../models/drawing";
import { Symbol } from '../../../models/symbol';
import { NodeEvent, NodesWidget } from '../../widgets/nodes';
import { Subscription } from 'rxjs';
import { InterfaceLabelWidget } from '../../widgets/interface-label';
import { SelectionTool } from '../../tools/selection-tool';
import { MovingTool } from '../../tools/moving-tool';
import { LinksWidget } from '../../widgets/links';
import { MapChangeDetectorRef } from '../../services/map-change-detector-ref';
import { LinkCreated } from '../draw-link-tool/draw-link-tool.component';


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

  @Output() onNodeDragged: EventEmitter<NodeEvent>;
  @Output() onLinkCreated = new EventEmitter<LinkCreated>();

  private d3: D3;
  private parentNativeElement: any;
  private svg: Selection<SVGSVGElement, any, null, undefined>;

  private isReady = false;

  private onNodeDraggingSubscription: Subscription;
  private onChangesDetected: Subscription;

  protected settings = {
    'show_interface_labels': true
  };

  constructor(
    private context: Context,
    private mapChangeDetectorRef: MapChangeDetectorRef,
    protected element: ElementRef,
    protected d3Service: D3Service,
    protected nodesWidget: NodesWidget,
    protected linksWidget: LinksWidget,
    protected interfaceLabelWidget: InterfaceLabelWidget,
    protected selectionToolWidget: SelectionTool,
    protected movingToolWidget: MovingTool,
    public graphLayout: GraphLayout
    ) {
    this.d3 = d3Service.getD3();
    this.parentNativeElement = element.nativeElement;
    this.onNodeDragged = nodesWidget.onNodeDragged;
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
    this.onChangesDetected.unsubscribe();
  }

  ngOnInit() {
    if (this.parentNativeElement !== null) {
      this.createGraph(this.parentNativeElement);
    }
    this.context.size = this.getSize();

    this.onNodeDraggingSubscription = this.nodesWidget.onNodeDragging.subscribe((eventNode: NodeEvent) => {
      const links = this.links.filter((link) => link.target.node_id === eventNode.node.node_id || link.source.node_id === eventNode.node.node_id)

      links.forEach((link) => {
        this.linksWidget.redrawLink(this.svg, link);
      });
    });

    this.onChangesDetected = this.mapChangeDetectorRef.changesDetected.subscribe(() => {
      if (this.isReady) {
        this.reload();
      }
    });
  }

  public createGraph(domElement: HTMLElement) {
    const rootElement = this.d3.select(domElement);
    this.svg = rootElement.select<SVGSVGElement>('svg');
    this.graphLayout.connect(this.svg, this.context);
    this.graphLayout.draw(this.svg, this.context);
    this.isReady = true;
  }

  public getSize(): Size {
    let width = document.documentElement.clientWidth;
    let height = document.documentElement.clientHeight;
    if (this.width > width) {
      width = this.width;
    }
    if (this.height > height) {
      height = this.height;
    }
    return new Size(width, height);
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
    this.graphLayout.getNodesWidget().setSymbols(this.symbols);
  }

  public redraw() {
    this.graphLayout.draw(this.svg, this.context);
  }

  public reload() {
    this.onLinksChange(null);
    this.redraw();
  }

  protected onLinkdddCreated(evt) {

  }

  @HostListener('window:resize', ['$event'])
  onResize(event) {
    this.changeLayout();
  }
}
