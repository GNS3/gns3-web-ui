import { EventEmitter, Injectable } from '@angular/core';
import { event, mouse, select } from 'd3-selection';
import { Subject } from 'rxjs';

import { SelectionEventSource } from '../events/selection-event-source';
import { Context } from '../models/context';
import { Rectangle } from '../models/rectangle';
import { SVGSelection } from '../models/types';

@Injectable()
export class SelectionTool {
  static readonly SELECTABLE_CLASS = '.selectable';

  public rectangleSelected = new Subject<Rectangle>();
  public contextMenuOpened = new EventEmitter<any>();

  private path;
  private enabled = false;

  public constructor(
    private context: Context, 
    private selectionEventSource: SelectionEventSource
  ) {}

  public disableContextMenu() {

  }

  public setEnabled(enabled) {
    this.enabled = enabled;
    this.contextMenuOpened.emit(true);
  }

  private activate(selection) {
    const self = this;

    selection.on('mousedown', function() {
      // prevent deselection on right click
      if (event.button == 2) {
        selection.on('contextmenu', () => {
          event.preventDefault();
        });

        self.contextMenuOpened.emit(event);
        return;
      }

      const subject = select(window);
      const parent = this.parentElement;

      const start = self.transformation(mouse(parent));
      self.startSelection(start);

      // clear selection
      selection.selectAll(SelectionTool.SELECTABLE_CLASS).classed('selected', false);

      subject
        .on('mousemove.selection', function() {
          const end = self.transformation(mouse(parent));
          self.moveSelection(start, end);
        })
        .on('mouseup.selection', function() {
          const end = self.transformation(mouse(parent));
          self.endSelection(start, end);
          subject.on('mousemove.selection', null).on('mouseup.selection', null);
        });
    });
  }

  private deactivate(selection) {
    selection.on('mousedown', null);
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
      tool.attr('activated');
    }
    if (status !== 'deactivated' && !this.enabled) {
      this.deactivate(selection);
      tool.attr('deactivated');
    }
  }

  private startSelection(start) {
    this.path.attr('d', this.rect(start[0], start[1], 0, 0)).attr('visibility', 'visible');
  }

  private moveSelection(start, move) {
    const x = start[0] / this.context.transformation.k;
    const y = start[1] / this.context.transformation.k;
    this.path.attr('d', this.rect(x, y, move[0] / this.context.transformation.k - x, move[1] / this.context.transformation.k - y));
    this.selectedEvent(start, move);
  }

  private endSelection(start, end) {
    this.path.attr('visibility', 'hidden');
    this.selectedEvent(start, end);
  }

  private selectedEvent(start, end) {
    const x = Math.min(start[0], end[0]);
    const y = Math.min(start[1], end[1]);
    const width = Math.abs(start[0] - end[0]);
    const height = Math.abs(start[1] - end[1]);
    this.selectionEventSource.selected.next(new Rectangle(x, y, width, height));
  }

  private rect(x: number, y: number, w: number, h: number) {
    return 'M' + [x, y] + ' l' + [w, 0] + ' l' + [0, h] + ' l' + [-w, 0] + 'z';
  }

  private transformation(point) {
    const transformation_point = this.context.getZeroZeroTransformationPoint();
    return [
      point[0] - transformation_point.x - this.context.transformation.x,
      point[1] - transformation_point.y - this.context.transformation.y
    ];
  }
}
