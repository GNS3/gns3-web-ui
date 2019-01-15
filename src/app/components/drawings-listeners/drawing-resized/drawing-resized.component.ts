import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { DrawingService } from '../../../services/drawing.service';
import { DrawingsDataSource } from '../../../cartography/datasources/drawings-datasource';
import { DrawingsEventSource } from '../../../cartography/events/drawings-event-source';
import { MapDrawingToSvgConverter } from '../../../cartography/converters/map/map-drawing-to-svg-converter';
import { Server } from '../../../models/server';
import { ResizedDataEvent } from '../../../cartography/events/event-source';
import { MapDrawing } from '../../../cartography/models/map/map-drawing';
import { Drawing } from '../../../cartography/models/drawing';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-drawing-resized',
  templateUrl: './drawing-resized.component.html',
  styleUrls: ['./drawing-resized.component.css']
})
export class DrawingResizedComponent implements OnInit, OnDestroy {
  @Input() server: Server;
  private drawingResized: Subscription;

  constructor(
    private drawingService: DrawingService,
    private drawingsDataSource: DrawingsDataSource,
    private drawingsEventSource: DrawingsEventSource,
    private mapDrawingToSvgConverter: MapDrawingToSvgConverter
  ) {}

  ngOnInit() {
    this.drawingResized = this.drawingsEventSource.resized.subscribe(evt => this.onDrawingResized(evt));
  }

  onDrawingResized(resizedEvent: ResizedDataEvent<MapDrawing>) {
    const drawing = this.drawingsDataSource.get(resizedEvent.datum.id);
    let svgString = this.mapDrawingToSvgConverter.convert(resizedEvent.datum);

    this.drawingService
      .updateSizeAndPosition(this.server, drawing, resizedEvent.x, resizedEvent.y, svgString)
      .subscribe((serverDrawing: Drawing) => {
        this.drawingsDataSource.update(serverDrawing);
      });
  }

  ngOnDestroy() {
    this.drawingResized.unsubscribe();
  }
}
