import { Component, OnInit, OnDestroy, Input, Output, EventEmitter, SimpleChange } from '@angular/core';
import { DrawingsDataSource } from '../../../cartography/datasources/drawings-datasource';
import { DrawingsEventSource } from '../../../cartography/events/drawings-event-source';
import { DefaultDrawingsFactory } from '../../../cartography/helpers/default-drawings-factory';
import { Server } from '../../../models/server';
import { Project } from '../../../models/project';
import { Subscription } from 'rxjs';
import { DrawingService } from '../../../services/drawing.service';
import { Drawing } from '../../../cartography/models/drawing';
import { MapDrawingToSvgConverter } from '../../../cartography/converters/map/map-drawing-to-svg-converter';
import { AddedDataEvent } from '../../../cartography/events/event-source';

@Component({
  selector: 'app-drawing-added',
  templateUrl: './drawing-added.component.html',
  styleUrls: ['./drawing-added.component.css']
})
export class DrawingAddedComponent implements OnInit, OnDestroy {
  @Input() server: Server;
  @Input() project: Project;
  @Input() selectedDrawing: string;
  @Output() drawingSaved = new EventEmitter<boolean>();
  private pointToAddSelected: Subscription;

  constructor(
    private drawingService: DrawingService,
    private drawingsDataSource: DrawingsDataSource,
    private drawingsEventSource: DrawingsEventSource,
    private drawingsFactory: DefaultDrawingsFactory,
    private mapDrawingToSvgConverter: MapDrawingToSvgConverter
  ) {}

  ngOnInit() {
    this.pointToAddSelected = this.drawingsEventSource.pointToAddSelected.subscribe(evt => this.onDrawingSaved(evt));
  }

  ngOnChanges(changes: { [propKey: string]: SimpleChange }) {
    if (changes['selectedDrawing'] && !changes['selectedDrawing'].isFirstChange()) {
      this.selectedDrawing = changes['selectedDrawing'].currentValue;

      if (this.selectedDrawing !== 'text') {
        this.drawingsEventSource.selected.emit(this.selectedDrawing);
      }
    }
  }

  onDrawingSaved(evt: AddedDataEvent) {
    let drawing = this.drawingsFactory.getDrawingMock(this.selectedDrawing);
    let svgText = this.mapDrawingToSvgConverter.convert(drawing);

    this.drawingService
      .add(this.server, this.project.project_id, evt.x, evt.y, svgText)
      .subscribe((serverDrawing: Drawing) => {
        this.drawingsDataSource.add(serverDrawing);
        this.drawingSaved.emit(true);
      });
  }

  ngOnDestroy() {
    this.pointToAddSelected.unsubscribe();
  }
}
