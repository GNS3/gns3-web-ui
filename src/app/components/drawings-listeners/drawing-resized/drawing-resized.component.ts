import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, inject, input } from '@angular/core';
import { Subscription } from 'rxjs';
import { MapDrawingToSvgConverter } from '../../../cartography/converters/map/map-drawing-to-svg-converter';
import { DrawingsDataSource } from '../../../cartography/datasources/drawings-datasource';
import { DrawingsEventSource } from '../../../cartography/events/drawings-event-source';
import { ResizedDataEvent } from '../../../cartography/events/event-source';
import { Drawing } from '../../../cartography/models/drawing';
import { MapDrawing } from '../../../cartography/models/map/map-drawing';
import { Controller } from '@models/controller';
import { DrawingService } from '@services/drawing.service';

@Component({
  standalone: true,
  selector: 'app-drawing-resized',
  templateUrl: './drawing-resized.component.html',
  styleUrls: ['./drawing-resized.component.scss'],
  imports: [],
  // TODO: This component has been partially migrated to be zoneless-compatible.
  // After testing, this should be updated to ChangeDetectionStrategy.OnPush.
  changeDetection: ChangeDetectionStrategy.Default,
})
export class DrawingResizedComponent implements OnInit, OnDestroy {
  readonly controller = input<Controller>(undefined);
  private drawingResized: Subscription;

  private drawingService = inject(DrawingService);
  private drawingsDataSource = inject(DrawingsDataSource);
  private drawingsEventSource = inject(DrawingsEventSource);
  private mapDrawingToSvgConverter = inject(MapDrawingToSvgConverter);

  ngOnInit() {
    this.drawingResized = this.drawingsEventSource.resized.subscribe((evt) => this.onDrawingResized(evt));
  }

  onDrawingResized(resizedEvent: ResizedDataEvent<MapDrawing>) {
    const drawing = this.drawingsDataSource.get(resizedEvent.datum.id);
    let svgString = this.mapDrawingToSvgConverter.convert(resizedEvent.datum);

    this.drawingService
      .updateSizeAndPosition(this.controller(), drawing, resizedEvent.x, resizedEvent.y, svgString)
      .subscribe((controllerDrawing: Drawing) => {
        this.drawingsDataSource.update(controllerDrawing);
      });
  }

  ngOnDestroy() {
    this.drawingResized.unsubscribe();
  }
}
