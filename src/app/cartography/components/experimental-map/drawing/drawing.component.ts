import { Component, OnInit, Input, ChangeDetectorRef } from '@angular/core';
import { EllipseElement } from '../../../models/drawings/ellipse-element';
import { ImageElement } from '../../../models/drawings/image-element';
import { LineElement } from '../../../models/drawings/line-element';
import { RectElement } from '../../../models/drawings/rect-element';
import { TextElement } from '../../../models/drawings/text-element';
import { SvgToDrawingConverter } from '../../../helpers/svg-to-drawing-converter';
import { DraggedDataEvent } from '../../../events/event-source';
import { MapDrawing } from '../../../models/map/map-drawing';
import { DrawingsEventSource } from '../../../events/drawings-event-source';

@Component({
  selector: '[app-drawing]',
  templateUrl: './drawing.component.html',
  styleUrls: ['./drawing.component.scss']
})
export class DrawingComponent implements OnInit {
  @Input('app-drawing') drawing: MapDrawing;

  constructor(
    private svgToDrawingConverter: SvgToDrawingConverter,
    private drawingsEventSource: DrawingsEventSource,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit() {
    try {
      this.drawing.element = this.svgToDrawingConverter.convert(this.drawing.svg);
    } catch (error) {
      console.log(`Cannot convert due to Error: '${error}'`);
    }
  }

  OnDragging(evt) {
    this.drawing.x = evt.x;
    this.drawing.y = evt.y;
    this.cd.detectChanges();
  }

  OnDragged(evt) {
    this.cd.detectChanges();
    this.drawingsEventSource.dragged.emit(new DraggedDataEvent<MapDrawing>(this.drawing, evt.dx, evt.dy));
  }

  is(element, type: string) {
    if (!element) {
      return false;
    }

    if (type === 'ellipse') {
      return element instanceof EllipseElement;
    }
    if (type === 'image') {
      return element instanceof ImageElement;
    }
    if (type === 'line') {
      return element instanceof LineElement;
    }
    if (type === 'rect') {
      return element instanceof RectElement;
    }
    if (type === 'text') {
      return element instanceof TextElement;
    }
    return false;
  }

  get transformation() {
    return `translate(${this.drawing.x},${this.drawing.y}) rotate(${this.drawing.rotation})`;
  }
}
