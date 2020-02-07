import {
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChange,
  ViewChild
} from '@angular/core';
import { select, Selection } from 'd3-selection';

import { Subscription } from 'rxjs';
import { Link } from '../../../models/link';
import { Project } from '../../../models/project';
import { Server } from '../../../models/server';
import { Symbol } from '../../../models/symbol';
import { MapScaleService } from '../../../services/mapScale.service';
import { MapSettingsService } from '../../../services/mapsettings.service';
import { ToolsService } from '../../../services/tools.service';
import { CanvasSizeDetector } from '../../helpers/canvas-size-detector';
import { GraphDataManager } from '../../managers/graph-data-manager';
import { MapSettingsManager } from '../../managers/map-settings-manager';
import { Context } from '../../models/context';
import { Drawing } from '../../models/drawing';
import { Node } from '../../models/node';
import { Size } from '../../models/size';
import { MapChangeDetectorRef } from '../../services/map-change-detector-ref';
import { MovingTool } from '../../tools/moving-tool';
import { SelectionTool } from '../../tools/selection-tool';
import { GraphLayout } from '../../widgets/graph-layout';
import { InterfaceLabelWidget } from '../../widgets/interface-label';
import { TextEditorComponent } from '../text-editor/text-editor.component';

@Component({
  selector: 'app-d3-map',
  templateUrl: './d3-map.component.html',
  styleUrls: ['./d3-map.component.scss']
})
export class D3MapComponent implements OnInit, OnChanges, OnDestroy {
  @Input() nodes: Node[] = [];
  @Input() links: Link[] = [];
  @Input() drawings: Drawing[] = [];
  @Input() symbols: Symbol[] = [];
  @Input() project: Project;
  @Input() server: Server;

  @Input() width = 1500;
  @Input() height = 600;

  @ViewChild('svg', {static: false}) svgRef: ElementRef;
  @ViewChild('textEditor', {static: false}) textEditor: TextEditorComponent;

  private parentNativeElement: any;
  private svg: Selection<SVGSVGElement, any, null, undefined>;
  private onChangesDetected: Subscription;
  private subscriptions: Subscription[] = [];
  private drawLinkTool: boolean;
  protected settings = {
    show_interface_labels: true
  };
  public gridVisibility = 0;

  constructor(
    private graphDataManager: GraphDataManager,
    public context: Context,
    private mapChangeDetectorRef: MapChangeDetectorRef,
    private canvasSizeDetector: CanvasSizeDetector,
    private mapSettings: MapSettingsManager,
    protected element: ElementRef,
    protected interfaceLabelWidget: InterfaceLabelWidget,
    protected selectionToolWidget: SelectionTool,
    protected movingToolWidget: MovingTool,
    public graphLayout: GraphLayout,
    private toolsService: ToolsService,
    private mapScaleService: MapScaleService,
    private mapSettingsService: MapSettingsService
  ) {
    this.parentNativeElement = element.nativeElement;
  }

  @Input('show-interface-labels')
  set showInterfaceLabels(value) {
    this.settings.show_interface_labels = value;
    this.interfaceLabelWidget.setEnabled(value);
    this.mapChangeDetectorRef.detectChanges();
  }

  @Input('readonly') set readonly(value) {
    this.mapSettings.isReadOnly = value;
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

    this.subscriptions.push(
      this.mapScaleService.scaleChangeEmitter.subscribe((value: number) => this.redraw())
    );

    this.subscriptions.push(
      this.toolsService.isMovingToolActivated.subscribe((value: boolean) => {
        this.mapChangeDetectorRef.detectChanges();
      })
    );

    this.subscriptions.push(
      this.toolsService.isSelectionToolActivated.subscribe((value: boolean) => {
        this.selectionToolWidget.setEnabled(value);
        this.mapChangeDetectorRef.detectChanges();
      })
    );

    this.subscriptions.push(
      this.toolsService.isDrawLinkToolActivated.subscribe((value: boolean) => {
        this.drawLinkTool = value;
      })
    );

    this.gridVisibility = localStorage.getItem('gridVisibility') === 'true' ? 1 : 0;
  }

  ngOnDestroy() {
    this.graphLayout.disconnect(this.svg);
    this.onChangesDetected.unsubscribe();
    this.subscriptions.forEach((subscription: Subscription) => {
      subscription.unsubscribe();
    });
  }

  public applyMapSettingsChanges() {
    this.redraw();
  }

  public createGraph(domElement: HTMLElement) {
    const rootElement = select(domElement);
    this.svg = rootElement.select<SVGSVGElement>('svg');
    this.graphLayout.connect(
      this.svg,
      this.context
    );
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
    this.textEditor.activateTextEditingForDrawings();
    this.textEditor.activateTextEditingForNodeLabels();
    this.mapSettingsService.mapRenderedEmitter.emit(true);
  }

  @HostListener('window:resize', ['$event'])
  onResize(event) {
    this.changeLayout();
  }
}
