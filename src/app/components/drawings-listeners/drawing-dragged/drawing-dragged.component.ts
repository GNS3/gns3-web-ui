import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, inject, input } from '@angular/core';
import { Subscription } from 'rxjs';
import { DrawingsDataSource } from '../../../cartography/datasources/drawings-datasource';
import { DrawingsEventSource } from '../../../cartography/events/drawings-event-source';
import { DraggedDataEvent } from '../../../cartography/events/event-source';
import { Drawing } from '../../../cartography/models/drawing';
import { MapDrawing } from '../../../cartography/models/map/map-drawing';
import { Project } from '@models/project';
import { Controller } from '@models/controller';
import { DrawingService } from '@services/drawing.service';

@Component({
  standalone: true,
  selector: 'app-drawing-dragged',
  templateUrl: './drawing-dragged.component.html',
  styleUrls: ['./drawing-dragged.component.scss'],
  imports: [],
  // TODO: This component has been partially migrated to be zoneless-compatible.
  // After testing, this should be updated to ChangeDetectionStrategy.OnPush.
  changeDetection: ChangeDetectionStrategy.Default,
})
export class DrawingDraggedComponent implements OnInit, OnDestroy {
  readonly controller = input<Controller>(undefined);
  readonly project = input<Project>(undefined);
  private drawingDragged: Subscription;

  private drawingService = inject(DrawingService);
  private drawingsDataSource = inject(DrawingsDataSource);
  private drawingsEventSource = inject(DrawingsEventSource);

  ngOnInit() {
    this.drawingDragged = this.drawingsEventSource.dragged.subscribe((evt) => this.onDrawingDragged(evt));
  }

  onDrawingDragged(draggedEvent: DraggedDataEvent<MapDrawing>) {
    const drawing = this.drawingsDataSource.get(draggedEvent.datum.id);
    drawing.x += draggedEvent.dx;
    drawing.y += draggedEvent.dy;

    this.drawingService
      .updatePosition(this.controller(), this.project(), drawing, drawing.x, drawing.y)
      .subscribe((controllerDrawing: Drawing) => {
        this.drawingsDataSource.update(controllerDrawing);
      });
  }

  ngOnDestroy() {
    this.drawingDragged.unsubscribe();
  }
}
