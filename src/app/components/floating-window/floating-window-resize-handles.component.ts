import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { ResizeHandleDirective } from 'angular-resizable-element';

/** BEM prefixes of the window families that share the handle kit. */
export type FloatingWindowPrefix = 'gns3-window' | 'gns3-replay';

/**
 * The eight resize handles of the floating-window standard, one
 * implementation instead of ten copy-pasted blocks — adding or renaming an
 * edge is a single edit here, and no window can silently lose one.
 *
 * The handle elements reach the host window's ResizableDirective through
 * the element injector, so this component must be rendered as a DESCENDANT
 * of the `mwlResizable` element (every window places it directly inside).
 *
 * The hit-zone styles (invisible, straddling the border box — see the
 * gns3-floating-window skill) live in this component's SCSS for both
 * window-family prefixes; hosts no longer `@use` a per-family partial.
 */
@Component({
  selector: 'app-floating-window-resize-handles',
  standalone: true,
  imports: [ResizeHandleDirective],
  template: `
    <div [class]="handleClass('top')" mwlResizeHandle [resizeEdges]="{ top: true }"></div>
    <div [class]="handleClass('right')" mwlResizeHandle [resizeEdges]="{ right: true }"></div>
    <div [class]="handleClass('bottom')" mwlResizeHandle [resizeEdges]="{ bottom: true }"></div>
    <div [class]="handleClass('left')" mwlResizeHandle [resizeEdges]="{ left: true }"></div>
    <!-- Corners: 16×16 straddling the corner — the only allowed inward reach. -->
    <div [class]="handleClass('top-left')" mwlResizeHandle [resizeEdges]="{ top: true, left: true }"></div>
    <div [class]="handleClass('top-right')" mwlResizeHandle [resizeEdges]="{ top: true, right: true }"></div>
    <div [class]="handleClass('bottom-left')" mwlResizeHandle [resizeEdges]="{ bottom: true, left: true }"></div>
    <div [class]="handleClass('bottom-right')" mwlResizeHandle [resizeEdges]="{ bottom: true, right: true }"></div>
  `,
  styleUrl: './floating-window-resize-handles.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FloatingWindowResizeHandlesComponent {
  /** BEM prefix of the host window family (kit windows vs the replay fleet). */
  readonly prefix = input<FloatingWindowPrefix>('gns3-window');

  private readonly baseClass = computed(() => `${this.prefix()}__resize-handle`);

  handleClass(
    edge: 'top' | 'right' | 'bottom' | 'left' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right',
  ): string {
    const base = this.baseClass();
    return `${base} ${base}--${edge}`;
  }
}
