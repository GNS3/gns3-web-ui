import {
  ChangeDetectionStrategy,
  Component,
  effect,
  ElementRef,
  HostListener,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChange,
  inject,
  input,
  signal,
  viewChild,
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
import { DrawingAddingComponent } from '../drawing-adding/drawing-adding.component';
import { DrawingResizingComponent } from '../drawing-resizing/drawing-resizing.component';
import { SelectionControlComponent } from '../selection-control/selection-control.component';
import { SelectionSelectComponent } from '../selection-select/selection-select.component';
import { DraggableSelectionComponent } from '../draggable-selection/draggable-selection.component';
import { LinkEditingComponent } from '../link-editing/link-editing.component';
import { MovingCanvasDirective } from '../../directives/moving-canvas.directive';
import { ZoomingCanvasDirective } from '../../directives/zooming-canvas.directive';

@Component({
  selector: 'app-d3-map',
  standalone: true,
  templateUrl: './d3-map.component.html',
  styleUrl: './d3-map.component.scss',
  imports: [
    TextEditorComponent,
    DrawingAddingComponent,
    DrawingResizingComponent,
    SelectionControlComponent,
    SelectionSelectComponent,
    DraggableSelectionComponent,
    LinkEditingComponent,
    MovingCanvasDirective,
    ZoomingCanvasDirective,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class D3MapComponent implements OnInit, OnChanges, OnDestroy {
  readonly nodes = input<Node[]>([]);
  readonly links = input<Link[]>([]);
  readonly drawings = input<Drawing[]>([]);
  readonly symbols = input<Symbol[]>([]);
  readonly project = input<Project>(undefined);
  readonly controller = input<Controller>(undefined);

  readonly width = input(1500);
  readonly height = input(600);

  readonly svgRef = viewChild<ElementRef>('svg');
  readonly textEditor = viewChild<TextEditorComponent>('textEditor');

  private parentNativeElement: any;
  private svg: Selection<SVGSVGElement, any, null, undefined>;
  private onChangesDetected: Subscription;
  private subscriptions: Subscription[] = [];
  private drawLinkTool: boolean;
  protected settings = {
    show_interface_labels: true,
  };
  public gridVisibility = signal(0);

  public nodeGridX: number = 0;
  public nodeGridY: number = 0;
  public drawingGridX: number = 0;
  public drawingGridY: number = 0;

  private graphDataManager = inject(GraphDataManager);
  public context = inject(Context);
  private mapChangeDetectorRef = inject(MapChangeDetectorRef);
  private canvasSizeDetector = inject(CanvasSizeDetector);
  private mapSettings = inject(MapSettingsManager);
  protected element = inject(ElementRef);
  protected interfaceLabelWidget = inject(InterfaceLabelWidget);
  protected selectionToolWidget = inject(SelectionTool);
  protected movingToolWidget = inject(MovingTool);
  public graphLayout = inject(GraphLayout);
  private toolsService = inject(ToolsService);
  private mapScaleService = inject(MapScaleService);
  private mapSettingsService = inject(MapSettingsService);

  constructor() {
    this.parentNativeElement = this.element.nativeElement;

    // Watch for project grid size changes
    effect(() => {
      const project = this.project();
      if (project && this.mapChangeDetectorRef.hasBeenDrawn) {
        this.updateGrid();
      }
    });
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

      if (this.height() > heightOfProjectWindow) {
        this.svg.attr('height', this.height());
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

    // Initialize grid offsets based on project settings
    const project = this.project();
    if (project) {
      this.updateGrid();
    }

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
        this.movingToolWidget.setEnabled(value);
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

    this.gridVisibility.set(localStorage.getItem('gridVisibility') === 'true' ? 1 : 0);
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
        const prevCX = dragStartCenterX ?? this.context.size.width / 2;
        const prevCY = dragStartCenterY ?? this.context.size.height / 2;
        const newSize = this.getSize();
        const newCX = this.context.centerX ?? newSize.width / 2;
        const newCY = this.context.centerY ?? newSize.height / 2;
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
    const viewportWidth = document.documentElement.clientWidth;
    const viewportHeight = document.documentElement.clientHeight;

    // Use live MapNode positions from graphDataManager so size is correct during
    // active drags (where this.nodes hasn't been updated yet).
    const mapNodes = this.graphDataManager.getNodes();
    const mapDrawings = this.graphDataManager.getDrawings();

    if (mapNodes.length === 0 && mapDrawings.length === 0) {
      this.context.centerX = null;
      this.context.centerY = null;
      return new Size(viewportWidth, viewportHeight);
    }

    const scale = this.context.transformation.k;
    const margin = 30; // Reduced from 100px to 30px to prevent premature scrollbar appearance
    let minX = 0,
      maxX = 0,
      minY = 0,
      maxY = 0;

    for (const node of mapNodes) {
      const nodeWidth = (node.width || 60) * scale;
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
    const halfViewW = viewportWidth / 2;
    const halfViewH = viewportHeight / 2;
    const leftSpace = Math.max(halfViewW, -minX + margin);
    const rightSpace = Math.max(halfViewW, maxX + margin);
    const topSpace = Math.max(halfViewH, -minY + margin);
    const bottomSpace = Math.max(halfViewH, maxY + margin);

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
    this.graphDataManager.setSymbols(this.symbols());
  }

  private redraw() {
    this.updateGrid();

    this.graphDataManager.setNodes(this.nodes());
    this.graphDataManager.setLinks(this.links());
    this.graphDataManager.setDrawings(this.drawings());
    // Recalculate after setNodes/Drawings so graphDataManager has current positions.
    this.context.size = this.getSize();
    this.graphLayout.draw(this.svg, this.context);
    this.textEditor().activateTextEditingForDrawings();
    this.textEditor().activateTextEditingForNodeLabels();
    this.mapSettingsService.mapRenderedEmitter.emit(true);
  }

  updateGrid() {
    const project = this.project();
    if (project.grid_size && project.grid_size > 0)
      this.nodeGridX =
        this.context.size.width / 2 - Math.floor(this.context.size.width / 2 / project.grid_size) * project.grid_size;
    if (project.grid_size && project.grid_size > 0)
      this.nodeGridY =
        this.context.size.height / 2 - Math.floor(this.context.size.height / 2 / project.grid_size) * project.grid_size;

    if (project.drawing_grid_size && project.drawing_grid_size > 0)
      this.drawingGridX =
        this.context.size.width / 2 -
        Math.floor(this.context.size.width / 2 / project.drawing_grid_size) * project.drawing_grid_size;
    if (project.drawing_grid_size && project.drawing_grid_size > 0)
      this.drawingGridY =
        this.context.size.height / 2 -
        Math.floor(this.context.size.height / 2 / project.drawing_grid_size) * project.drawing_grid_size;
  }

  @HostListener('window:resize', ['$event'])
  onResize(event) {
    this.changeLayout();
  }
}
