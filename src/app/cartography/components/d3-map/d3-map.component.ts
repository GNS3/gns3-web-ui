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
import { MapSettingsService } from '@services/mapsettings.service';
import { MapScaleService } from '@services/mapScale.service';
import { ToolsService } from '@services/tools.service';
import { affectedIsEmpty, emptyAffectedIds, mergeAffected } from '../../helpers/item-signature';
import { applyIncrementalPatches } from '../../helpers/dom-patcher';
import { CanvasSizeDetector } from '../../helpers/canvas-size-detector';
import { GraphDataManager } from '../../managers/graph-data-manager';
import { LayersManager } from '../../managers/layers-manager';
import { MapSettingsManager } from '../../managers/map-settings-manager';
import { Context } from '../../models/context';
import { Drawing } from '../../models/drawing';
import { Node } from '../../models/node';
import { Size } from '../../models/size';
import { MapChangeDetectorRef } from '../../services/map-change-detector-ref';
import { GridAnchorService } from '../../services/grid-anchor.service';
import { MovingTool } from '../../tools/moving-tool';
import { SelectionTool } from '../../tools/selection-tool';
import { GraphLayout } from '../../widgets/graph-layout';
import { InterfaceLabelWidget } from '../../widgets/interface-label';
import { TextEditorComponent } from '../text-editor/text-editor.component';
import { DrawingAddingComponent } from '../drawing-adding/drawing-adding.component';
import { CurveDrawingComponent } from '../curve-drawing/curve-drawing.component';
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
    CurveDrawingComponent,
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
  // Pending requestAnimationFrame id for the coalesced redraw. All redraw
  // triggers funnel through scheduleRedraw(), guaranteeing at most one full
  // redraw per frame regardless of how many WS notifications / zoom events /
  // signal writes fire in between.
  private rafId: number | null = null;
  // Pending requestAnimationFrame id for the coalesced scale-change apply
  // (see the scaleChangeEmitter subscription) — wheel zoom emits one event per
  // notch, and the apply is O(n) over all nodes, so at most one per frame.
  private scaleRafId: number | null = null;
  // Whether the coalesced redraw may be gated. Only DATA-driven redraws (the
  // signal effect) are gated — zoom/resize/settings/tool switches always redraw,
  // so the gate can never skip a redraw the selection tool or canvas transform
  // needs. Any non-gated trigger in a frame downgrades the pending redraw.
  private pendingGated = true;
  protected settings = {
    show_interface_labels: true,
  };
  public gridVisibility = signal(0);

  private graphDataManager = inject(GraphDataManager);
  private layersManager = inject(LayersManager);
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
  private gridAnchor = inject(GridAnchorService);

  constructor() {
    this.parentNativeElement = this.element.nativeElement;

    // Watch for project grid size changes
    effect(() => {
      const project = this.project();
      if (project && this.mapChangeDetectorRef.hasBeenDrawn) {
        this.mapChangeDetectorRef.detectChanges();
      }
    });

    // The grid patterns (re)enter the DOM via this template @if — every apply
    // they missed since the last redraw must be replayed once they exist.
    effect(() => {
      if (this.gridVisibility() && this.mapChangeDetectorRef.hasBeenDrawn) {
        this.applyGridAnchor();
      }
    });

    // Signal-driven data -> redraw. Reading the input signals here registers
    // them as effect dependencies, so any nodes/links/drawings change schedules
    // a single coalesced redraw (see scheduleRedraw). This replaces the old
    // reliance on mapChangeDetectorRef + setTimeout for propagating zoneless
    // signal inputs: inside an effect the inputs are already fresh.
    effect(() => {
      this.nodes();
      this.links();
      this.drawings();
      if (this.mapChangeDetectorRef.hasBeenDrawn) {
        // Data-only trigger: the redraw may be skipped if nothing visual changed.
        this.scheduleRedraw(true);
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
    // nodes/links/drawings changes are handled by the signal-driven effect in
    // the constructor; only width/height/symbols still need ngOnChanges.
    if (
      (changes['width'] && !changes['width'].isFirstChange()) ||
      (changes['height'] && !changes['height'].isFirstChange()) ||
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
    // context.size is already 0x0 from createGraph's reset — do NOT call
    // getSize() here.  It runs before the first redraw's setNodes clears the
    // app-singleton graphDataManager, so on a re-visit it reads the PREVIOUS
    // project's nodes and leaks their content center into savedCenterX →
    // the first redraw anchors origin to the wrong content center.

    this.onChangesDetected = this.mapChangeDetectorRef.changesDetected.subscribe(() => {
      if (this.mapChangeDetectorRef.hasBeenDrawn) {
        this.scheduleRedraw();
      }
    });

    // Toolbar / keyboard zoom (zoomIn/zoomOut/resetZoom) only mutate
    // context.transformation.k via MapScaleService and emit scaleChangeEmitter —
    // nothing else applies the new scale (the old scaleChange→redraw
    // subscription was removed when wheel zoom started applying the transform
    // directly, which left the toolbar buttons dead). Apply it here WITHOUT a
    // full redraw: rebuild the same transform graphLayout.draw would build and
    // keep the SVG size getSize() would recompute, so both wheel zoom (already
    // applied the transform itself — re-applying is idempotent) and toolbar
    // zoom stay in sync.
    //
    // Wheel zoom emits one event per notch; the apply is an O(n) getSize +
    // SVG resize + reflow, so coalesce to at most one per animation frame.
    this.subscriptions.push(
      this.mapScaleService.scaleChangeEmitter.subscribe(() => {
        if (!this.mapChangeDetectorRef.hasBeenDrawn) {
          return;
        }
        if (this.scaleRafId !== null) {
          return;
        }
        this.scaleRafId = requestAnimationFrame(() => {
          this.scaleRafId = null;
          this.applyScaleChange();
        });
      })
    );

    this.subscriptions.push(
      this.mapChangeDetectorRef.selectionChangesDetected.subscribe(() => {
        if (this.mapChangeDetectorRef.hasBeenDrawn) {
          this.graphLayout.updateSelectionHighlights(this.svg);
        }
      })
    );

    this.subscriptions.push(
      this.toolsService.isMovingToolActivated.subscribe((value: boolean) => {
        this.movingToolWidget.setEnabled(value);
        // Apply the drag-binding change directly via the tool's draw() — a tool
        // switch changes no rendering, so a full redraw is pure waste (and is
        // very slow with thousands of nodes).
        this.movingToolWidget.draw(this.svg, this.context);
      })
    );

    this.subscriptions.push(
      this.toolsService.isSelectionToolActivated.subscribe((value: boolean) => {
        this.selectionToolWidget.setEnabled(value);
        this.selectionToolWidget.draw(this.svg, this.context);
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
        // Re-anchor the grid in the same frame — otherwise it sits at the old
        // anchor until the PUT echo triggers the next redraw (visible jump).
        this.applyGridAnchor();
        dragStartCenterX = null;
        dragStartCenterY = null;
      })
    );
  }

  ngOnDestroy() {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    if (this.scaleRafId !== null) {
      cancelAnimationFrame(this.scaleRafId);
      this.scaleRafId = null;
    }
    this.graphLayout.disconnect(this.svg);
    this.onChangesDetected.unsubscribe();
    this.subscriptions.forEach((subscription: Subscription) => {
      subscription.unsubscribe();
    });
  }

  public applyMapSettingsChanges() {
    this.scheduleRedraw();
  }

  // Coalesce redraw requests to at most one per animation frame. Every
  // trigger (signal-driven data change via effect, changesDetected, zoom,
  // resize, map settings) calls this instead of redraw() directly.
  private scheduleRedraw(gated = false) {
    if (this.rafId !== null) {
      // Already scheduled this frame: a non-gated trigger (zoom, resize,
      // settings, tool switches) makes the coalesced redraw unconditional.
      if (!gated) this.pendingGated = false;
      return;
    }
    this.pendingGated = gated;
    this.rafId = requestAnimationFrame(() => {
      this.rafId = null;
      const runGated = this.pendingGated;
      this.pendingGated = true;
      this.redraw(runGated);
    });
  }

  public createGraph(domElement: HTMLElement) {
    const rootElement = select(domElement);
    this.svg = rootElement.select<SVGSVGElement>('svg');
    // Context is an app-lifetime singleton (provided in the eager
    // CartographyModule), so its transformation (pan/scale), centerX/Y and size
    // PERSIST across project open/close. Reset to a clean state here so every
    // entry starts identically; redraw() then anchors the origin to the content
    // center (getSize() leftSpace) from scratch.
    this.context.transformation.x = 0;
    this.context.transformation.y = 0;
    this.context.transformation.k = 1;
    this.context.centerX = null;
    this.context.centerY = null;
    // MapScaleService is equally app-singleton: sync its tracked scale with the
    // fresh k=1 without emitting, or the first toolbar zoom click on the newly
    // opened project would continue from the previous project's scale.
    this.mapScaleService.resetScaleState();
    // LayersManager is an app-lifetime singleton — its layer buckets carry
    // over the previous project's nodes/links/drawings, which graphLayout.draw
    // would render as a ghost frame before the first data redraw clears them.
    this.layersManager.clear();
    // GraphDataManager equally outlives the component: without a reset, a new
    // mount fed the same items (preview thumbnail ↔ dialog share one cached
    // dataset) diffs them as unchanged, never rebuilds the layers and draws
    // an empty canvas.
    this.graphDataManager.reset();
    this.context.size = new Size(0, 0);
    this.graphLayout.connect(this.svg, this.context);
    this.graphLayout.draw(this.svg, this.context);
    this.mapChangeDetectorRef.hasBeenDrawn = true;
  }

  /**
   * Apply a MapScaleService scale change to the canvas without a full redraw:
   * recompute the canvas size (content bbox scales with k) and rebuild the
   * g.canvas transform. Runs at most once per animation frame (coalesced in the
   * scaleChangeEmitter subscription).
   */
  private applyScaleChange() {
    // Keep the origin locked like redraw() does: getSize() recomputes
    // centerX/Y from the scaled content bbox, which would shift the
    // origin and make every visible element jump.
    const savedCenterX = this.context.centerX;
    const savedCenterY = this.context.centerY;
    const newSize = this.getSize();
    this.context.centerX = savedCenterX ?? this.context.centerX;
    this.context.centerY = savedCenterY ?? this.context.centerY;
    this.context.size = newSize;
    this.svg.attr('width', newSize.width).attr('height', newSize.height);

    // Canonical transform construction (same code graphLayout.draw uses).
    this.svg
      .selectAll<SVGGElement, Context>('g.canvas')
      .data([this.context])
      .attr('transform', this.graphLayout.canvasTransform(this.context));
    // The tile scales with k — re-anchor the grid to the new transform.
    this.applyGridAnchor();
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
      // Count the drawing's box (parsed from its svg root), not just the
      // origin point — text/shapes extend right/down from (x, y) and a
      // point-only bbox lets the canvas edge clip them (e.g. multi-line text
      // at the bottom of the content).
      const drawingWidth = (drawing.element?.width ?? 0) * scale;
      const drawingHeight = (drawing.element?.height ?? 0) * scale;
      minX = Math.min(minX, drawing.x * scale);
      maxX = Math.max(maxX, drawing.x * scale + drawingWidth);
      minY = Math.min(minY, drawing.y * scale);
      maxY = Math.max(maxY, drawing.y * scale + drawingHeight);
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
    this.scheduleRedraw();
  }

  private onSymbolsChange(change: SimpleChange) {
    this.graphDataManager.setSymbols(this.symbols());
  }

  private redraw(gated = false) {
    if (gated) {
      // Data-driven redraw (signal effect): skip the expensive full draw
      // (graphDataManager conversion + D3 data-join + getBBox/getTotalLength
      // reflows) when no canvas-rendered field changed since the last draw.
      // This is what stops a flood of non-visual updates — e.g. per-def marker
    }

    // setNodes/setLinks/setDrawings perform incremental diff internally
    // (per-item visual-signature comparison) and return AffectedIds describing
    // exactly which items changed and in what visual groups.  If nothing
    // changed and this is a data-driven (gated) redraw, skip entirely — same
    // semantic as the old signature gate, but per-item instead of one blob.
    const affected = emptyAffectedIds();
    mergeAffected(affected, this.graphDataManager.setNodes(this.nodes()));
    mergeAffected(affected, this.graphDataManager.setLinks(this.links()));
    mergeAffected(affected, this.graphDataManager.setDrawings(this.drawings()));

    if (gated && affectedIsEmpty(affected)) {
      return;
    }

    // Save current origin before getSize() potentially changes it — when new
    // content extends beyond the current canvas boundary getSize() grows the
    // canvas and shifts centerX/Y, which would make every visible element jump.
    const savedCenterX = this.context.centerX;
    const savedCenterY = this.context.centerY;

    // Recalculate after setNodes/Drawings so graphDataManager has current positions.
    this.context.size = this.getSize();

    // Origin anchor. On the FIRST redraw savedCenterX is null (createGraph
    // reset), so adopt getSize()'s freshly-computed leftSpace/topSpace — the
    // content-centered origin — rather than width()/2 (scene center). Scene
    // center leaves content off-center whenever the content bbox ≠ scene center.
    // Worse: the ngOnInit getSize() (:206) reads the app-singleton
    // graphDataManager BEFORE this redraw's setNodes clears it, so the old
    // width()/2 fallback anchored the first visit at scene center (off-center)
    // while a re-visit — with leftover graphDataManager data — accidentally
    // anchored at the previous content center. That was the "first open wrong,
    // re-open right" symptom. Anchoring to the current getSize() result removes
    // the dependency on leftover state and centers content on every open.
    // On later redraws savedCenterX is non-null and stays locked (drag-lock).
    this.context.centerX = savedCenterX ?? this.context.centerX;
    this.context.centerY = savedCenterY ?? this.context.centerY;

    // Anchor the background grid to the (possibly new) scene origin/size.
    // Runs after the origin lock and before the incremental-patch early
    // return so position-only updates re-anchor the grid too.
    this.applyGridAnchor();

    // For gated (data-driven) redraws try incremental DOM patches first.
    // When only node xY positions changed, targeted transform updates on the
    // affected g.node elements are enough — no D3 data-join, no getBBox /
    // getTotalLength reflows.  Structural changes (add/remove) and non-xY
    // updates fall through to full graphLayout.draw below.
    if (gated && !applyIncrementalPatches(this.svg, affected, this.graphDataManager, this.context)) {
      this.textEditor().activateTextEditingForDrawings();
      this.textEditor().activateTextEditingForNodeLabels();
      this.mapSettingsService.mapRenderedEmitter.emit(true);
      return;
    }

    this.graphLayout.draw(this.svg, this.context);
    this.textEditor().activateTextEditingForDrawings();
    this.textEditor().activateTextEditingForNodeLabels();
    this.mapSettingsService.mapRenderedEmitter.emit(true);
  }

  /** Re-anchor the background grid patterns to the current canvas transform. */
  private applyGridAnchor() {
    const svgNode = this.svg?.node();
    if (svgNode) {
      this.gridAnchor.apply(svgNode, this.context, this.project());
    }
  }

  @HostListener('window:resize', ['$event'])
  onResize(event) {
    this.changeLayout();
  }

  /**
   * Signature of the canvas-rendered fields of all nodes. Excludes non-visual
   * fields (console*, command_line, node_directory, compute_id, properties,
   * usage) so that e.g. a startup node.updated changing only console/properties
   * does not re-render the map.
   */


}
