import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { DrawingsDataSource } from '../../../cartography/datasources/drawings-datasource';
import { Server } from '../../../models/server';
import { DrawingService } from '../../../services/drawing.service';
import { DraggedDataEvent } from '../../../cartography/events/event-source';
import { MapDrawing } from '../../../cartography/models/map/map-drawing';
import { Drawing } from '../../../cartography/models/drawing';
import { DrawingsEventSource } from '../../../cartography/events/drawings-event-source';
import { Project } from '../../../models/project';

@Component({
  selector: 'app-drawing-dragged',
  templateUrl: './drawing-dragged.component.html',
  styleUrls: ['./drawing-dragged.component.scss']
})
export class DrawingDraggedComponent implements OnInit, OnDestroy {
  @Input() server: Server;
  @Input() project: Project;
  private drawingDragged: Subscription;

  constructor(
    private drawingService: DrawingService,
    private drawingsDataSource: DrawingsDataSource,
    private drawingsEventSource: DrawingsEventSource
  ) {}

  ngOnInit() {
    this.drawingDragged = this.drawingsEventSource.dragged.subscribe(evt => this.onDrawingDragged(evt));
  }

  onDrawingDragged(draggedEvent: DraggedDataEvent<MapDrawing>) {
    const drawing = this.drawingsDataSource.get(draggedEvent.datum.id);
    drawing.x += draggedEvent.dx;
    drawing.y += draggedEvent.dy;

    this.drawingService
      .updatePosition(this.server, this.project, drawing, drawing.x, drawing.y)
      .subscribe((serverDrawing: Drawing) => {
        this.drawingsDataSource.update(serverDrawing);
      });
  }

  ngOnDestroy() {
    this.drawingDragged.unsubscribe();
  }
}
