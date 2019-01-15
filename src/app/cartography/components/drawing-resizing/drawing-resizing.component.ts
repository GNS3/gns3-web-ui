import { Component, OnInit, ElementRef, OnDestroy, Input, Output, EventEmitter } from '@angular/core';
import { Subscription } from 'rxjs';
import { DrawingsEventSource } from '../../events/drawings-event-source';
import { DrawingsWidget } from '../../widgets/drawings';
import { MapDrawing } from '../../models/map/map-drawing';
import { ResizedDataEvent } from '../../events/event-source';
import { ResizingEnd } from '../../events/resizing';

@Component({
  selector: 'app-drawing-resizing',
  template: `
    <ng-content></ng-content>
  `,
  styleUrls: ['./drawing-resizing.component.scss']
})
export class DrawingResizingComponent implements OnInit, OnDestroy {
  resizingFinished: Subscription;

  constructor(private drawingsWidget: DrawingsWidget, private drawingsEventSource: DrawingsEventSource) {}

  ngOnInit() {
    this.resizingFinished = this.drawingsWidget.resizingFinished.subscribe((evt: ResizingEnd<MapDrawing>) => {
      this.drawingsEventSource.resized.emit(
        new ResizedDataEvent<MapDrawing>(evt.datum, evt.x, evt.y, evt.width, evt.height)
      );
    });
  }

  ngOnDestroy() {
    this.resizingFinished.unsubscribe();
  }
}
