import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  afterNextRender,
  inject,
  input,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Project } from '@models/project';
import { Controller } from '@models/controller';
import { Link } from '@models/link';
import { Drawing } from '../../../cartography/models/drawing';
import { Node } from '../../../cartography/models/node';
import { D3MapComponent } from '../../../cartography/components/d3-map/d3-map.component';
import { MapSettingsService } from '@services/mapsettings.service';
import { ThemeService } from '@services/theme.service';

// Height clamp (px) for the panel thumbnail's aspect-driven height.
const PANEL_MIN_HEIGHT = 160;
const PANEL_MAX_HEIGHT = 400;

/**
 * Static, readonly topology preview rendered from the raw `.gns3` file —
 * the project does not need to be open.
 *
 * The map is uniformly scaled to fit the viewport (no pan/zoom): d3-map
 * sizes its svg imperatively to the content-centered canvas, so the scale is
 * applied as a CSS transform on the map host rather than fighting those
 * attributes with a viewBox.
 */
@Component({
  selector: 'app-topology-preview',
  standalone: true,
  imports: [D3MapComponent],
  templateUrl: './topology-preview.component.html',
  styleUrl: './topology-preview.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TopologyPreviewComponent {
  readonly controller = input.required<Controller>();
  readonly project = input.required<Project>();
  readonly nodes = input<Node[]>([]);
  readonly links = input<Link[]>([]);
  readonly drawings = input<Drawing[]>([]);
  /** 'panel' disables pointer events so clicks reach the enlarge button. */
  readonly variant = input<'panel' | 'dialog'>('panel');

  private readonly viewport = viewChild.required<ElementRef<HTMLElement>>('viewport');
  private readonly mapSettingsService = inject(MapSettingsService);
  private readonly themeService = inject(ThemeService);
  private readonly destroyRef = inject(DestroyRef);
  private resizeObserver: ResizeObserver | null = null;

  /**
   * The map's canvas-element color variables (--gns3-canvas-link-color etc.)
   * are scoped to .project-map--light-bg/--dark-bg. The preview hosts the
   * same svg#map, so it must apply the same light/dark class — otherwise
   * var() resolves to nothing and link strokes render as `none`.
   */
  readonly mapBgClass = computed(() => {
    const mapTheme = this.themeService.savedMapTheme;
    const isDark = mapTheme === 'auto' ? this.themeService.isDarkMode() : mapTheme.startsWith('dark-');
    return {
      'topology-preview__viewport--dark-bg': isDark,
      'topology-preview__viewport--light-bg': !isDark,
    };
  });

  constructor() {
    // Every d3-map redraw (data arrival, window resize, settings) rewrites
    // the svg width/height attributes — refit after each one.
    this.mapSettingsService.mapRenderedEmitter
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.recomputeScale());

    afterNextRender(() => {
      this.resizeObserver = new ResizeObserver(() => this.recomputeScale());
      this.resizeObserver.observe(this.viewport().nativeElement);
      this.recomputeScale();
    });

    this.destroyRef.onDestroy(() => {
      this.resizeObserver?.disconnect();
      this.resizeObserver = null;
    });
  }

  /**
   * Uniformly scale the rendered content to fit the viewport. Idempotent and
   * cheap.
   *
   * The fit box is the measured content bbox (g.canvas getBBox mapped into
   * svg coordinates), not the svg canvas itself: getSize() pads the canvas to
   * at least half the browser viewport per side, so fitting the canvas would
   * shrink small topologies into their padding and report the padded aspect
   * ratio as the topology's. Falls back to the whole svg until the first
   * draw populates the canvas group.
   */
  private recomputeScale(): void {
    const viewport = this.viewport()?.nativeElement;
    if (!viewport) return;
    const svg = viewport.querySelector('svg');
    if (!svg) return;
    const svgWidth = parseFloat(svg.getAttribute('width') ?? '');
    const svgHeight = parseFloat(svg.getAttribute('height') ?? '');
    if (!svgWidth || !svgHeight) return;

    const fit = this.measureContentBox(svg) ?? { x: 0, y: 0, width: svgWidth, height: svgHeight };

    if (this.variant() === 'panel') {
      // The thumbnail card follows the content's aspect ratio (width fills the
      // panel, height = width × contentH/contentW), clamped so an extreme
      // topology cannot blow up the details panel. The dialog variant instead
      // fills whatever height its container gives it.
      const maxHeight = Math.min(PANEL_MAX_HEIGHT, Math.round(window.innerHeight * 0.45));
      const heightByRatio = Math.round((viewport.clientWidth * fit.height) / fit.width);
      viewport.style.height = `${Math.max(PANEL_MIN_HEIGHT, Math.min(heightByRatio, maxHeight))}px`;
    }

    const padding = 16;
    const scale = Math.min(
      viewport.clientWidth / (fit.width + 2 * padding),
      viewport.clientHeight / (fit.height + 2 * padding)
    );

    // The host CSS centers the svg box at the viewport center; re-center on
    // the content bbox center, which differs from the svg center whenever the
    // canvas padding is asymmetric (left/right space are computed
    // independently in getSize()).
    const shiftX = (svgWidth / 2 - (fit.x + fit.width / 2)) * scale;
    const shiftY = (svgHeight / 2 - (fit.y + fit.height / 2)) * scale;

    viewport.style.setProperty('--topology-preview-scale', String(scale));
    viewport.style.setProperty('--topology-preview-shift-x', `${shiftX}px`);
    viewport.style.setProperty('--topology-preview-shift-y', `${shiftY}px`);
  }

  /**
   * Content bbox in svg coordinates, or null when the canvas group has not
   * been drawn yet. g.canvas holds only rendered content (grid rects and
   * tool overlays live on the svg root), and its transform
   * (translate + scale, GraphLayout.canvasTransform) maps scene coords to
   * svg coords.
   */
  private measureContentBox(svg: SVGElement): { x: number; y: number; width: number; height: number } | null {
    const canvas = svg.querySelector<SVGGElement>('g.canvas');
    if (!canvas) return null;
    const bbox = canvas.getBBox();
    if (!bbox.width || !bbox.height) return null;

    const transforms = canvas.transform.baseVal;
    const translate = transforms.numberOfItems > 0 ? transforms.getItem(0).matrix : null;
    const k = transforms.numberOfItems > 1 ? transforms.getItem(1).matrix.a || 1 : 1;
    return {
      x: bbox.x * k + (translate?.e ?? 0),
      y: bbox.y * k + (translate?.f ?? 0),
      width: bbox.width * k,
      height: bbox.height * k,
    };
  }
}
