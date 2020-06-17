import {
  Component,
  ElementRef,
  HostListener,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChange,
  EventEmitter,
  Output,
  ViewChild
} from '@angular/core';
import { Selection, select } from 'd3-selection';

import { GraphLayout } from '../../widgets/graph-layout';
import { Context } from '../../models/context';
import { Size } from '../../models/size';
import { Subscription } from 'rxjs';
import { InterfaceLabelWidget } from '../../widgets/interface-label';
import { SelectionTool } from '../../tools/selection-tool';
import { MovingTool } from '../../tools/moving-tool';
import { MapChangeDetectorRef } from '../../services/map-change-detector-ref';
import { CanvasSizeDetector } from '../../helpers/canvas-size-detector';
import { Node } from '../../models/node';
import { Link } from '../../../models/link';
import { Drawing } from '../../models/drawing';
import { Symbol } from '../../../models/symbol';
import { GraphDataManager } from '../../managers/graph-data-manager';
import { MapSettingsManager } from '../../managers/map-settings-manager';
import { Server } from '../../../models/server';
import { ToolsService } from '../../../services/tools.service';
import { TextEditorComponent } from '../text-editor/text-editor.component';
import { MapScaleService } from '../../../services/mapScale.service';
import { Project } from '../../../models/project';
import { MapSettingsService } from '../../../services/mapsettings.service';

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
  public gridVisibility: number = 0;

  public nodeGridX: number = 0;
  public nodeGridY: number = 0;
  public drawingGridX: number = 0;
  public drawingGridY: number = 0;

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
    this.updateGrid();

    this.graphDataManager.setNodes(this.nodes);
    this.graphDataManager.setLinks(this.links);
    this.graphDataManager.setDrawings(this.drawings);
    this.graphLayout.draw(this.svg, this.context);
    this.textEditor.activateTextEditingForDrawings();
    this.textEditor.activateTextEditingForNodeLabels();
    this.mapSettingsService.mapRenderedEmitter.emit(true);
  }

  updateGrid() {
    this.nodeGridX = (this.project.scene_width/2 - (Math.floor(this.project.scene_width/2 / this.project.grid_size) * this.project.grid_size));
    this.nodeGridY = (this.project.scene_height/2 - (Math.floor(this.project.scene_height/2 / this.project.grid_size) * this.project.grid_size));

    this.drawingGridX = (this.project.scene_width/2 - (Math.floor(this.project.scene_width/2 / this.project.drawing_grid_size) * this.project.drawing_grid_size));
    this.drawingGridY = (this.project.scene_height/2 - (Math.floor(this.project.scene_height/2 / this.project.drawing_grid_size) * this.project.drawing_grid_size));
  }

  @HostListener('window:resize', ['$event'])
  onResize(event) {
    this.changeLayout();
  }
}
