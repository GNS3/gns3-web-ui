import {
  Component, ElementRef, HostListener, Input, OnChanges, OnDestroy, OnInit,
  SimpleChange, ChangeDetectionStrategy, ChangeDetectorRef, ViewChild
} from '@angular/core';

import { GraphLayout } from "../../widgets/graph-layout";
import { Context } from "../../models/context";
import { Size } from "../../models/size";
import { Subscription } from 'rxjs';
import { MapChangeDetectorRef } from '../../services/map-change-detector-ref';
import { CanvasSizeDetector } from '../../helpers/canvas-size-detector';
import { Node } from '../../models/node';
import { Link } from '../../../models/link';
import { Drawing } from '../../models/drawing';
import { Symbol } from '../../../models/symbol';
import { GraphDataManager } from '../../managers/graph-data-manager';
import { LayersManager } from '../../managers/layers-manager';


@Component({
  selector: 'app-experimental-map',
  templateUrl: './experimental-map.component.html',
  styleUrls: ['./experimental-map.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ExperimentalMapComponent implements OnInit, OnChanges, OnDestroy {
  @Input() nodes: Node[] = [];
  @Input() links: Link[] = [];
  @Input() drawings: Drawing[] = [];
  @Input() symbols: Symbol[] = [];
  // @Input() changed: EventEmitter<any>;
  
  // @Input('node-updated') nodeUpdated: EventEmitter<any>;

  @Input() width = 1500;
  @Input() height = 600;

  @ViewChild('svg') svg: ElementRef;

  private changesDetected: Subscription;

  protected settings = {
    'show_interface_labels': true
  };

  constructor(
    private graphDataManager: GraphDataManager,
    private context: Context,
    private mapChangeDetectorRef: MapChangeDetectorRef,
    private canvasSizeDetector: CanvasSizeDetector,
    private changeDetectorRef: ChangeDetectorRef,
    private layersManger: LayersManager,
    public graphLayout: GraphLayout,
    ) {
  }

  @Input('show-interface-labels') 
  set showInterfaceLabels(value) {
    this.settings.show_interface_labels = value;
    this.mapChangeDetectorRef.detectChanges();
  }

  @Input('moving-tool')
  set movingTool(value) {
    this.mapChangeDetectorRef.detectChanges();
  }

  @Input('selection-tool')
  set selectionTool(value) {
    this.mapChangeDetectorRef.detectChanges();
  }

  @Input('draw-link-tool') drawLinkTool: boolean;

  @Input('readonly') set readonly(value) {
  }
  
  ngOnChanges(changes: { [propKey: string]: SimpleChange }) {
  }

  ngOnInit() {
    // this.changeDetectorRef.detach();

    this.changesDetected = this.mapChangeDetectorRef.changesDetected.subscribe(() => {
      this.graphDataManager.setNodes(this.nodes);
      this.graphDataManager.setLinks(this.links);
      this.graphDataManager.setDrawings(this.drawings);
      this.graphDataManager.setSymbols(this.symbols);

      this.changeDetectorRef.detectChanges();
    });


    // this.changedSubscription = this.changed.subscribe(() => {
    //   this.changeDetectorRef.detectChanges();
    // });

    // this.nodeUpdated.subscribe((node: Node) => {
    //   this.nodeChanged.emit(node);
    // });
  }

  ngOnDestroy() {
    this.changesDetected.unsubscribe();
    // this.changedSubscription.unsubscribe();
  }

  public getSize(): Size {
    return this.canvasSizeDetector.getOptimalSize(this.width, this.height);
  }

  public get layers() {
    return this.layersManger.getLayersList();
  }

  public get transform() {
    const ctx = new Context();
    ctx.size = this.getSize();

    const xTrans = ctx.getZeroZeroTransformationPoint().x + ctx.transformation.x;
    const yTrans = ctx.getZeroZeroTransformationPoint().y + ctx.transformation.y;
    const kTrans = ctx.transformation.k;
    return `translate(${xTrans}, ${yTrans}) scale(${kTrans})`;
  }


  @HostListener('window:resize', ['$event'])
  onResize(event) {

  }
}
