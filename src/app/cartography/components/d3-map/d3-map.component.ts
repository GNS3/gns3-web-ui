import {
  Component,
  ElementRef,
  HostListener,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChange,
  ViewChild,
} from '@angular/core';
import { select, Selection } from 'd3-selection';
import { Subscription } from 'rxjs';
import { Link } from '@models/link';
import { Project } from '@models/project';
import { Controller } from '@models/controller';
import { Symbol } from '@models/symbol';
import { MapScaleService } from '@services/mapScale.service';
import { MapSettingsService } from '@services/mapsettings.service';
import { ToolsService } from '@services/tools.service';
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
  styleUrls: ['./d3-map.component.scss'],
})
export class D3MapComponent implements OnInit, OnChanges, OnDestroy {
  @Input() nodes: Node[] = [];
  @Input() links: Link[] = [];
  @Input() drawings: Drawing[] = [];
  @Input() symbols: Symbol[] = [];
  @Input() project: Project;
  @Input() controller: Controller;

  @Input() width = 1500;
  @Input() height = 600;

  @ViewChild('svg') svgRef: ElementRef;
  @ViewChild('textEditor') textEditor: TextEditorComponent;

  private parentNativeElement: any;
  private svg: Selection<SVGSVGElement, any, null, undefined>;
  private onChangesDetected: Subscription;
  private subscriptions: Subscription[] = [];
  private drawLinkTool: boolean;
  protected settings = {
    show_interface_labels: true,
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
    if (value && !this.mapSettingsService.integrateLinkLabelsToLinks) {
      this.settings.show_interface_labels = true;
      this.interfaceLabelWidget.setEnabled(true);
    } else {
      this.settings.show_interface_labels = false;
      this.interfaceLabelWidget.setEnabled(false);
    }

    this.mapChangeDetectorRef.detectChanges();
  }

  @Input('readonly') set readonly(value) {
    this.mapSettings.isReadOnly = value;
  }

  resize(val: boolean) {
    if (val) {
      this.svg.attr('height', window.innerHeight + window.scrollY - 16);
    } else {
      let heightOfProjectWindow = window.innerHeight - 16;

      if (this.height > heightOfProjectWindow) {
        this.svg.attr('height', this.height);
      } else {
        this.svg.attr('height', heightOfProjectWindow);
      }
    }
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
      this.mapChangeDetectorRef.selectionChangesDetected.subscribe(() => {
        if (this.mapChangeDetectorRef.hasBeenDrawn) {
          this.graphLayout.updateSelectionHighlights(this.svg);
        }
      })
    );

    this.subscriptions.push(this.mapScaleService.scaleChangeEmitter.subscribe((value: number) => this.redraw()));

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
    this.mapSettingsService.isScrollDisabled.subscribe((val) => this.resize(val));

    // Recalculate canvas size live during node drags so scrollbars appear as
    // content moves. Strategy: only GROW during drag (never shrink), which
    // prevents the browser from clamping scroll and injecting spurious D3 dx.
    // On drag end do a full recalculate + scroll compensation so the viewport
    // stays on the same content after the canvas origin shifts.
    let dragStartCenterX: number | null = null;
    let dragStartCenterY: number | null = null;

    this.subscriptions.push(
      this.graphLayout.getNodesWidget().draggable.start.subscribe(() => {
        const pt = this.context.getZeroZeroTransformationPoint();
        dragStartCenterX = pt.x;
        dragStartCenterY = pt.y;
      })
    );

    this.subscriptions.push(
      this.graphLayout.getNodesWidget().draggable.drag.subscribe(() => {
        const newSize = this.getSize();
        // Lock origin back to drag-start so the canvas <g> transform doesn't
        // shift under the pointer while dragging.
        this.context.centerX = dragStartCenterX;
        this.context.centerY = dragStartCenterY;
        // Only GROW the canvas during drag — never shrink it. Shrinking reduces
        // the max scroll, the browser clamps the scroll position, which shifts
        // the SVG's bounding rect, and D3 picks that up as a spurious dx/dy on
        // the next drag event (the "exponential movement" bug).
        if (newSize.width > this.context.size.width || newSize.height > this.context.size.height) {
          this.context.size = newSize;
          this.svg.attr('width', newSize.width).attr('height', newSize.height);
        }
      })
    );

    this.subscriptions.push(
      this.graphLayout.getNodesWidget().draggable.end.subscribe(() => {
        const prevCX = dragStartCenterX ?? this.context.size.width  / 2;
        const prevCY = dragStartCenterY ?? this.context.size.height / 2;
        const newSize = this.getSize();
        const newCX  = this.context.centerX ?? newSize.width  / 2;
        const newCY  = this.context.centerY ?? newSize.height / 2;
        // Scroll BEFORE resizing the SVG so the browser never clamps the scroll
        // position first (which would nullify the compensation for the cases
        // where centerX/centerY shift, e.g. nodes returning from the left).
        window.scrollBy(newCX - prevCX, newCY - prevCY);
        this.context.size = newSize;
        this.svg.attr('width', newSize.width).attr('height', newSize.height);
        this.graphLayout.draw(this.svg, this.context);
        dragStartCenterX = null;
        dragStartCenterY = null;
      })
    );
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
    this.graphLayout.connect(this.svg, this.context);
    this.graphLayout.draw(this.svg, this.context);
    this.mapChangeDetectorRef.hasBeenDrawn = true;
  }

  public getSize(): Size {
    const viewportWidth  = document.documentElement.clientWidth;
    const viewportHeight = document.documentElement.clientHeight;

    // Use live MapNode positions from graphDataManager so size is correct during
    // active drags (where this.nodes hasn't been updated yet).
    const mapNodes    = this.graphDataManager.getNodes();
    const mapDrawings = this.graphDataManager.getDrawings();

    if (mapNodes.length === 0 && mapDrawings.length === 0) {
      this.context.centerX = null;
      this.context.centerY = null;
      return new Size(viewportWidth, viewportHeight);
    }

    const scale  = this.context.transformation.k;
    const margin = 100;
    let minX = 0, maxX = 0, minY = 0, maxY = 0;

    for (const node of mapNodes) {
      const nodeWidth  = (node.width  || 60) * scale;
      const nodeHeight = (node.height || 60) * scale;
      const nx = node.width ? node.x * scale : (node.x - 30) * scale;
      const ny = node.width ? node.y * scale : (node.y - 30) * scale;
      minX = Math.min(minX, nx);
      maxX = Math.max(maxX, nx + nodeWidth);
      minY = Math.min(minY, ny);
      maxY = Math.max(maxY, ny + nodeHeight);
    }

    for (const drawing of mapDrawings) {
      minX = Math.min(minX, drawing.x * scale);
      maxX = Math.max(maxX, drawing.x * scale);
      minY = Math.min(minY, drawing.y * scale);
      maxY = Math.max(maxY, drawing.y * scale);
    }

    // Asymmetric canvas: allocate exactly the space needed on each side of the
    // scene origin so scrollbars only appear in the direction content extends.
    const halfViewW = viewportWidth  / 2;
    const halfViewH = viewportHeight / 2;
    const leftSpace   = Math.max(halfViewW, (-minX) + margin);
    const rightSpace  = Math.max(halfViewW, maxX    + margin);
    const topSpace    = Math.max(halfViewH, (-minY) + margin);
    const bottomSpace = Math.max(halfViewH, maxY    + margin);

    this.context.centerX = leftSpace;
    this.context.centerY = topSpace;

    return this.canvasSizeDetector.getOptimalSize(leftSpace + rightSpace, topSpace + bottomSpace);
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
    // Recalculate after setNodes/Drawings so graphDataManager has current positions.
    this.context.size = this.getSize();
    this.graphLayout.draw(this.svg, this.context);
    this.textEditor.activateTextEditingForDrawings();
    this.textEditor.activateTextEditingForNodeLabels();
    this.textEditor.activateTextEditingForNodeNames();
    this.mapSettingsService.mapRenderedEmitter.emit(true);
  }

  updateGrid() {
    if (this.project.grid_size && this.project.grid_size > 0)
      this.nodeGridX =
        this.context.size.width / 2 -
        Math.floor(this.context.size.width / 2 / this.project.grid_size) * this.project.grid_size;
    if (this.project.grid_size && this.project.grid_size > 0)
      this.nodeGridY =
        this.context.size.height / 2 -
        Math.floor(this.context.size.height / 2 / this.project.grid_size) * this.project.grid_size;

    if (this.project.drawing_grid_size && this.project.drawing_grid_size > 0)
      this.drawingGridX =
        this.context.size.width / 2 -
        Math.floor(this.context.size.width / 2 / this.project.drawing_grid_size) * this.project.drawing_grid_size;
    if (this.project.drawing_grid_size && this.project.drawing_grid_size > 0)
      this.drawingGridY =
        this.context.size.height / 2 -
        Math.floor(this.context.size.height / 2 / this.project.drawing_grid_size) * this.project.drawing_grid_size;
  }

  @HostListener('window:resize', ['$event'])
  onResize(event) {
    this.changeLayout();
  }
}
