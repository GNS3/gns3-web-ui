import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, inject, input } from '@angular/core';
import { Subscription } from 'rxjs';
import { MapDrawingToSvgConverter } from '../../../cartography/converters/map/map-drawing-to-svg-converter';
import { DrawingsDataSource } from '../../../cartography/datasources/drawings-datasource';
import { DrawingsEventSource } from '../../../cartography/events/drawings-event-source';
import { ResizedDataEvent } from '../../../cartography/events/event-source';
import { Drawing } from '../../../cartography/models/drawing';
import { MapDrawing } from '../../../cartography/models/map/map-drawing';
import { Controller } from '@models/controller';
import { DrawingService } from '@services/drawing.service';
import { ToasterService } from '@services/toaster.service';

@Component({
  selector: 'app-drawing-resized',
  templateUrl: './drawing-resized.component.html',
  styleUrl: './drawing-resized.component.scss',
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DrawingResizedComponent implements OnInit, OnDestroy {
  readonly controller = input<Controller>(undefined);
  private drawingResized: Subscription;

  private drawingService = inject(DrawingService);
  private drawingsDataSource = inject(DrawingsDataSource);
  private drawingsEventSource = inject(DrawingsEventSource);
  private mapDrawingToSvgConverter = inject(MapDrawingToSvgConverter);
  private toasterService = inject(ToasterService);
  private cdr = inject(ChangeDetectorRef);

  ngOnInit() {
    this.drawingResized = this.drawingsEventSource.resized.subscribe((evt) => this.onDrawingResized(evt));
  }

  onDrawingResized(resizedEvent: ResizedDataEvent<MapDrawing>) {
    const drawing = this.drawingsDataSource.get(resizedEvent.datum.id);
    let svgString = this.mapDrawingToSvgConverter.convert(resizedEvent.datum);

    this.drawingService
      .updateSizeAndPosition(this.controller(), drawing, resizedEvent.x, resizedEvent.y, svgString)
      .subscribe({
        next: (controllerDrawing: Drawing) => {
          this.drawingsDataSource.update(controllerDrawing);
        },
        error: (err) => {
          const message = err.error?.message || err.message || 'Failed to update drawing size';
          this.toasterService.error(message);
          this.cdr.markForCheck();
        },
      });
  }

  ngOnDestroy() {
    this.drawingResized.unsubscribe();
  }
}
