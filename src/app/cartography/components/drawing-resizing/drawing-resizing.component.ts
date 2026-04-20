import { Component, OnDestroy, OnInit, inject, ChangeDetectionStrategy } from '@angular/core';
import { Subscription } from 'rxjs';
import { DrawingsEventSource } from '../../events/drawings-event-source';
import { ResizedDataEvent } from '../../events/event-source';
import { ResizingEnd } from '../../events/resizing';
import { MapDrawing } from '../../models/map/map-drawing';
import { DrawingsWidget } from '../../widgets/drawings';

@Component({
  selector: 'app-drawing-resizing',
  standalone: true,
  template: ` <ng-content></ng-content> `,
  styleUrl: './drawing-resizing.component.scss',
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DrawingResizingComponent implements OnInit, OnDestroy {
  resizingFinished: Subscription;

  private drawingsWidget = inject(DrawingsWidget);
  private drawingsEventSource = inject(DrawingsEventSource);

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
