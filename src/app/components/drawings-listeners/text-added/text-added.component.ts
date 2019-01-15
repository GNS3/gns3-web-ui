import { Component, OnInit, OnDestroy, Input, Output, EventEmitter } from '@angular/core';
import { Subscription } from 'rxjs';
import { DrawingService } from '../../../services/drawing.service';
import { DrawingsDataSource } from '../../../cartography/datasources/drawings-datasource';
import { DrawingsEventSource } from '../../../cartography/events/drawings-event-source';
import { MapDrawingToSvgConverter } from '../../../cartography/converters/map/map-drawing-to-svg-converter';
import { TextAddedDataEvent } from '../../../cartography/events/event-source';
import { DefaultDrawingsFactory } from '../../../cartography/helpers/default-drawings-factory';
import { TextElement } from '../../../cartography/models/drawings/text-element';
import { Server } from '../../../models/server';
import { Project } from '../../../models/project';
import { Drawing } from '../../../cartography/models/drawing';
import { Context } from '../../../cartography/models/context';

@Component({
  selector: 'app-text-added',
  templateUrl: './text-added.component.html',
  styleUrls: ['./text-added.component.css']
})
export class TextAddedComponent implements OnInit, OnDestroy {
  @Input() server: Server;
  @Input() project: Project;
  @Output() drawingSaved = new EventEmitter<boolean>();
  private textAdded: Subscription;

  constructor(
    private drawingService: DrawingService,
    private drawingsDataSource: DrawingsDataSource,
    private drawingsEventSource: DrawingsEventSource,
    private drawingsFactory: DefaultDrawingsFactory,
    private mapDrawingToSvgConverter: MapDrawingToSvgConverter,
    private context: Context
  ) {}

  ngOnInit() {
    this.textAdded = this.drawingsEventSource.textAdded.subscribe(evt => this.onTextAdded(evt));
  }

  onTextAdded(evt: TextAddedDataEvent) {
    let drawing = this.drawingsFactory.getDrawingMock('text');
    (drawing.element as TextElement).text = evt.savedText;
    let svgText = this.mapDrawingToSvgConverter.convert(drawing);

    this.drawingService
      .add(
        this.server,
        this.project.project_id,
        evt.x - this.context.getZeroZeroTransformationPoint().x,
        evt.y - this.context.getZeroZeroTransformationPoint().y,
        svgText
      )
      .subscribe((serverDrawing: Drawing) => {
        this.drawingsDataSource.add(serverDrawing);
        this.drawingSaved.emit(true);
      });
  }

  ngOnDestroy() {
    this.textAdded.unsubscribe();
  }
}
