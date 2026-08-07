import { EventEmitter, Injectable } from '@angular/core';
import { select, pointer } from 'd3-selection';
import { SelectionEventSource } from '../events/selection-event-source';
import { Context } from '../models/context';
import { Rectangle } from '../models/rectangle';
import { SVGSelection } from '../models/types';

@Injectable()
export class SelectionTool {
  public contextMenuOpened = new EventEmitter<MouseEvent>();

  private path;
  private enabled = false;

  public constructor(private context: Context, private selectionEventSource: SelectionEventSource) {}

  public setEnabled(enabled) {
    this.enabled = enabled;
  }

  private activate(selection) {
    const self = this;
    const svgNode = selection.node();

    selection
      .on('contextmenu.selection', (event: MouseEvent) => event.preventDefault())
      .on('mousedown.selection', function (event: MouseEvent) {
        // prevent deselection on right click
        if (event.button === 2) {
          self.contextMenuOpened.emit(event);
          return;
        }

        const subject = select(window);
        const start = self.transformation(pointer(event, svgNode));
        self.startSelection(start);

        // In zoneless mode, mousemove events don't trigger Angular CD automatically
        subject
          .on('mousemove.selection', function (event: any) {
            const end = self.transformation(pointer(event, svgNode));
            self.moveSelection(start, end);
          })
          .on('mouseup.selection', function (event: any) {
            const end = self.transformation(pointer(event, svgNode));
            self.endSelection(start, end);
            subject.on('mousemove.selection', null).on('mouseup.selection', null);
          });
      });
  }

  private deactivate(selection) {
    selection.on('mousedown.selection', null).on('contextmenu.selection', null);
  }

  public draw(selection: SVGSelection, context: Context) {
    const canvas = selection.select<SVGGElement>('g.canvas');

    if (!canvas.select<SVGGElement>('g.selection-line-tool').node()) {
      const g = canvas.append<SVGGElement>('g');
      g.attr('class', 'selection-line-tool');

      this.path = g.append('path');
      this.path.attr('class', 'selection').attr('visibility', 'hidden');
    }

    const tool = canvas.select<SVGGElement>('g.selection-line-tool');
    const status = tool.attr('status');

    if (status !== 'activated' && this.enabled) {
      this.activate(selection);
      tool.attr('status', 'activated');
    }
    if (status !== 'deactivated' && !this.enabled) {
      this.deactivate(selection);
      tool.attr('status', 'deactivated');
    }
  }

  private startSelection(start) {
    // Validate coordinates before creating path
    if (start[0] == null || start[1] == null || isNaN(start[0]) || isNaN(start[1])) {
      return;
    }
    this.path.attr('d', this.rect(start[0], start[1], 0, 0)).attr('visibility', 'visible');
  }

  private moveSelection(start, move) {
    // Validate transformation.k to prevent NaN
    const k = this.context.transformation.k;
    if (!k || k === 0 || isNaN(k)) {
      return;
    }

    let x = start[0] / k;
    let y = start[1] / k;

    // Validate coordinates
    if (isNaN(x) || isNaN(y)) {
      return;
    }

    const moveX = move[0] / k - x;
    const moveY = move[1] / k - y;

    if (isNaN(moveX) || isNaN(moveY)) {
      return;
    }

    this.path.attr('d', this.rect(x, y, moveX, moveY));
    this.selectedEvent(start, move);
  }

  private endSelection(start, end) {
    this.path.attr('visibility', 'hidden');
    this.selectedEvent(start, end);
  }

  private selectedEvent(start, end) {
    // `start`/`end` come from `transformation()`, which subtracts the pan
    // (zeroZero + transformation.x/y) but does NOT divide by the scale k — so
    // they are in screen-pixel space, not canvas space. Node/link coordinates
    // live in canvas space, so we must divide by k before hit-testing.
    // Without this, the emitted Rectangle is the wrong size and position
    // whenever the canvas is zoomed: zoomed-out selection captures too few
    // nodes, zoomed-in captures too many. (`moveSelection` already divides by
    // k for the visible path, which is why the drawn box looks correct.)
    const k = this.context.transformation.k;
    if (!k || k === 0 || isNaN(k)) {
      return;
    }
    const sx = start[0] / k;
    const sy = start[1] / k;
    const ex = end[0] / k;
    const ey = end[1] / k;
    const x = Math.min(sx, ex);
    const y = Math.min(sy, ey);
    const width = Math.abs(sx - ex);
    const height = Math.abs(sy - ey);
    this.selectionEventSource.selected.next(new Rectangle(x, y, width, height));
  }

  private rect(x: number, y: number, w: number, h: number) {
    return 'M' + [x, y] + ' l' + [w, 0] + ' l' + [0, h] + ' l' + [-w, 0] + 'z';
  }

  private transformation(point) {
    const transformation_point = this.context.getZeroZeroTransformationPoint();
    return [
      point[0] - transformation_point.x - this.context.transformation.x,
      point[1] - transformation_point.y - this.context.transformation.y,
    ];
  }
}
