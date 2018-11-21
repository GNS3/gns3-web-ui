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
import { MapChangeDetectorRef } from '../../services/map-change-detector-ref';
import { MapLinkCreated } from '../../events/links';
import { CanvasSizeDetector } from '../../helpers/canvas-size-detector';
import { MapListeners } from '../../listeners/map-listeners';
import { DrawingsWidget } from '../../widgets/drawings';
import { Node } from '../../models/node';
import { Link } from '../../../models/link';
import { Drawing } from '../../models/drawing';
import { Symbol } from '../../../models/symbol';
import { GraphDataManager } from '../../managers/graph-data-manager';
import { DraggedDataEvent } from '../../events/event-source';


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
  @Output() onLinkCreated = new EventEmitter<MapLinkCreated>();

  private parentNativeElement: any;
  private svg: Selection<SVGSVGElement, any, null, undefined>;

  private onChangesDetected: Subscription;

  protected settings = {
    'show_interface_labels': true
  };

  constructor(
    private graphDataManager: GraphDataManager,
    private context: Context,
    private mapChangeDetectorRef: MapChangeDetectorRef,
    private canvasSizeDetector: CanvasSizeDetector,
    private mapListeners: MapListeners,
    protected element: ElementRef,
    protected nodesWidget: NodesWidget,
    protected drawingsWidget: DrawingsWidget,
    protected interfaceLabelWidget: InterfaceLabelWidget,
    protected selectionToolWidget: SelectionTool,
    protected movingToolWidget: MovingTool,
    public graphLayout: GraphLayout,
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

  @Input('is-rectangle-chosen') isRectangleChosen: boolean;

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
      (changes['symbols'] && !changes['symbols'].isFirstChange() ||
      (changes['isRectangleChosen'] && !changes['isRectangleChosen'].isFirstChange()))
    ) {
      if (this.svg.empty && !this.svg.empty()) {
        if (changes['symbols']) {
          this.onSymbolsChange(changes['symbols']);
        }
        if (changes['isRectangleChosen']){
          this.onDrawingRectangleActive();
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

  private onDrawingRectangleActive(){
    var map = document.getElementsByClassName('map')[0];
    console.log(this.drawings);

    map.addEventListener('click', (event: MouseEvent) => {
      console.log(event);

      this.svg.select('g.drawings')
        .append<SVGElement>('g')
        .attr("class", 'drawing')
        .append<SVGGElement>('g')
        .attr("class", 'drawing_body')
        .attr('transform', `translate(${event.clientX-1000},${event.clientY-500}) rotate(0)`)
        .append<SVGRectElement>('rect')
        .attr('class', 'rect_element noselect')
        .attr('fill', '#ffffff')
        .attr('fill-opacity', '1')
        .attr('stroke', '#000000')
        .attr('stroke-width', 2)
        .attr('width', 200)
        .attr('height', 100);

      let newRectangle = new Drawing;
      /*drawing_id: string;
      project_id: string;
      rotation: number;
      svg: string;
      x: number;
      y: number;
      z: number;
      is_selected = false;
      element: DrawingElement;*/

      //this.onRectangleCreated.emit(null);
    }, {once : true});
  }

  @HostListener('window:resize', ['$event'])
  onResize(event) {
    this.changeLayout();
  }
}
