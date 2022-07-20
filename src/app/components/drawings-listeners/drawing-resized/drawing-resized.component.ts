import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { MapDrawingToSvgConverter } from '../../../cartography/converters/map/map-drawing-to-svg-converter';
import { DrawingsDataSource } from '../../../cartography/datasources/drawings-datasource';
import { DrawingsEventSource } from '../../../cartography/events/drawings-event-source';
import { ResizedDataEvent } from '../../../cartography/events/event-source';
import { Drawing } from '../../../cartography/models/drawing';
import { MapDrawing } from '../../../cartography/models/map/map-drawing';
import { Server } from '../../../models/server';
import { DrawingService } from '../../../services/drawing.service';

@Component({
  selector: 'app-drawing-resized',
  templateUrl: './drawing-resized.component.html',
  styleUrls: ['./drawing-resized.component.scss'],
})
export class DrawingResizedComponent implements OnInit, OnDestroy {
  @Input() controller: Server;
  private drawingResized: Subscription;

  constructor(
    private drawingService: DrawingService,
    private drawingsDataSource: DrawingsDataSource,
    private drawingsEventSource: DrawingsEventSource,
    private mapDrawingToSvgConverter: MapDrawingToSvgConverter
  ) {}

  ngOnInit() {
    this.drawingResized = this.drawingsEventSource.resized.subscribe((evt) => this.onDrawingResized(evt));
  }

  onDrawingResized(resizedEvent: ResizedDataEvent<MapDrawing>) {
    const drawing = this.drawingsDataSource.get(resizedEvent.datum.id);
    let svgString = this.mapDrawingToSvgConverter.convert(resizedEvent.datum);

    this.drawingService
      .updateSizeAndPosition(this.controller, drawing, resizedEvent.x, resizedEvent.y, svgString)
      .subscribe((serverDrawing: Drawing) => {
        this.drawingsDataSource.update(serverDrawing);
      });
  }

  ngOnDestroy() {
    this.drawingResized.unsubscribe();
  }
}
