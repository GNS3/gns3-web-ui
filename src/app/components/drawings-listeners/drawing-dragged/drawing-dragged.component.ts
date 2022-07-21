import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { DrawingsDataSource } from '../../../cartography/datasources/drawings-datasource';
import { DrawingsEventSource } from '../../../cartography/events/drawings-event-source';
import { DraggedDataEvent } from '../../../cartography/events/event-source';
import { Drawing } from '../../../cartography/models/drawing';
import { MapDrawing } from '../../../cartography/models/map/map-drawing';
import { Project } from '../../../models/project';
import{ Controller } from '../../../models/controller';
import { DrawingService } from '../../../services/drawing.service';

@Component({
  selector: 'app-drawing-dragged',
  templateUrl: './drawing-dragged.component.html',
  styleUrls: ['./drawing-dragged.component.scss'],
})
export class DrawingDraggedComponent implements OnInit, OnDestroy {
  @Input() controller:Controller ;
  @Input() project: Project;
  private drawingDragged: Subscription;

  constructor(
    private drawingService: DrawingService,
    private drawingsDataSource: DrawingsDataSource,
    private drawingsEventSource: DrawingsEventSource
  ) {}

  ngOnInit() {
    this.drawingDragged = this.drawingsEventSource.dragged.subscribe((evt) => this.onDrawingDragged(evt));
  }

  onDrawingDragged(draggedEvent: DraggedDataEvent<MapDrawing>) {
    const drawing = this.drawingsDataSource.get(draggedEvent.datum.id);
    drawing.x += draggedEvent.dx;
    drawing.y += draggedEvent.dy;

    this.drawingService
      .updatePosition(this.controller, this.project, drawing, drawing.x, drawing.y)
      .subscribe((serverDrawing: Drawing) => {
        this.drawingsDataSource.update(serverDrawing);
      });
  }

  ngOnDestroy() {
    this.drawingDragged.unsubscribe();
  }
}
