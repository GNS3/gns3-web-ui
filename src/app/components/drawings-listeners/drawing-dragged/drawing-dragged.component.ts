import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, inject, input } from '@angular/core';
import { Subscription } from 'rxjs';
import { DrawingsDataSource } from '../../../cartography/datasources/drawings-datasource';
import { DrawingsEventSource } from '../../../cartography/events/drawings-event-source';
import { DraggedDataEvent } from '../../../cartography/events/event-source';
import { Drawing } from '../../../cartography/models/drawing';
import { MapDrawing } from '../../../cartography/models/map/map-drawing';
import { Project } from '@models/project';
import { Controller } from '@models/controller';
import { DrawingService } from '@services/drawing.service';
import { MapChangeDetectorRef } from '../../../cartography/services/map-change-detector-ref';
import { ToasterService } from '@services/toaster.service';

@Component({
  selector: 'app-drawing-dragged',
  templateUrl: './drawing-dragged.component.html',
  styleUrl: './drawing-dragged.component.scss',
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DrawingDraggedComponent implements OnInit, OnDestroy {
  readonly controller = input<Controller>(undefined);
  readonly project = input<Project>(undefined);
  private drawingDragged: Subscription;

  private drawingService = inject(DrawingService);
  private drawingsDataSource = inject(DrawingsDataSource);
  private drawingsEventSource = inject(DrawingsEventSource);
  private mapChangeDetectorRef = inject(MapChangeDetectorRef);
  private toasterService = inject(ToasterService);
  private cdr = inject(ChangeDetectorRef);

  ngOnInit() {
    this.drawingDragged = this.drawingsEventSource.dragged.subscribe((evt) => this.onDrawingDragged(evt));
  }

  onDrawingDragged(draggedEvent: DraggedDataEvent<MapDrawing>) {
    const drawing = this.drawingsDataSource.get(draggedEvent.datum.id);
    drawing.x += draggedEvent.dx;
    drawing.y += draggedEvent.dy;

    this.drawingService
      .updatePosition(this.controller(), this.project(), drawing, drawing.x, drawing.y)
      .subscribe({
        next: (controllerDrawing: Drawing) => {
          this.drawingsDataSource.update(controllerDrawing);
          // Force an un-gated redraw to correct the DOM. During drag the
          // graphDataManager datum was moved to the cursor; snap is computed at
          // drag end. If snap lands on the same grid point (small drag) the
          // drawings signature is unchanged and the gated redraw skips, leaving
          // the DOM at the cursor. detectChanges() → scheduleRedraw() (un-gated).
          this.mapChangeDetectorRef.detectChanges();
        },
        error: (err) => {
          const message = err.error?.message || err.message || 'Failed to update drawing position';
          this.toasterService.error(message);
          this.cdr.markForCheck();
        },
      });
  }

  ngOnDestroy() {
    this.drawingDragged.unsubscribe();
  }
}
