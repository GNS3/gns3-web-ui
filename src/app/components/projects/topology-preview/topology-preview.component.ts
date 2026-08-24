import {
  ChangeDetectionStrategy,
  Component,
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
  private readonly destroyRef = inject(DestroyRef);
  private resizeObserver: ResizeObserver | null = null;

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

  /** Uniformly scale the svg (already content-centered) to fit the viewport. Idempotent and cheap. */
  private recomputeScale(): void {
    const viewport = this.viewport()?.nativeElement;
    if (!viewport) return;
    const svg = viewport.querySelector('svg');
    if (!svg) return;
    const width = parseFloat(svg.getAttribute('width') ?? '');
    const height = parseFloat(svg.getAttribute('height') ?? '');
    if (!width || !height) return;

    if (this.variant() === 'panel') {
      // The thumbnail card follows the map's actually-rendered aspect ratio
      // (width fills the panel, height = width × svgH/svgW), clamped so an
      // extreme topology cannot blow up the details panel. The dialog variant
      // instead fills whatever height its container gives it.
      const maxHeight = Math.min(PANEL_MAX_HEIGHT, Math.round(window.innerHeight * 0.45));
      const heightByRatio = Math.round((viewport.clientWidth * height) / width);
      viewport.style.height = `${Math.max(PANEL_MIN_HEIGHT, Math.min(heightByRatio, maxHeight))}px`;
    }

    const scale = Math.min(viewport.clientWidth / width, viewport.clientHeight / height);
    viewport.style.setProperty('--topology-preview-scale', String(scale));
  }
}
