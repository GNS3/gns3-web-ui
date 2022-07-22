import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { Subscription } from 'rxjs';
import { MapDrawingToSvgConverter } from '../../../cartography/converters/map/map-drawing-to-svg-converter';
import { DrawingsDataSource } from '../../../cartography/datasources/drawings-datasource';
import { DrawingsEventSource } from '../../../cartography/events/drawings-event-source';
import { TextAddedDataEvent } from '../../../cartography/events/event-source';
import { DefaultDrawingsFactory } from '../../../cartography/helpers/default-drawings-factory';
import { Context } from '../../../cartography/models/context';
import { Drawing } from '../../../cartography/models/drawing';
import { TextElement } from '../../../cartography/models/drawings/text-element';
import { Project } from '../../../models/project';
import{ Controller } from '../../../models/controller';
import { DrawingService } from '../../../services/drawing.service';

@Component({
  selector: 'app-text-added',
  templateUrl: './text-added.component.html',
  styleUrls: ['./text-added.component.scss'],
})
export class TextAddedComponent implements OnInit, OnDestroy {
  @Input() controller: Controller;
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
    this.textAdded = this.drawingsEventSource.textAdded.subscribe((evt) => this.onTextAdded(evt));
  }

  onTextAdded(evt: TextAddedDataEvent) {
    let drawing = this.drawingsFactory.getDrawingMock('text');
    (drawing.element as TextElement).text = evt.savedText;
    let svgText = this.mapDrawingToSvgConverter.convert(drawing);

    this.drawingService
      .add(
        this.controller,
        this.project.project_id,
        (evt.x - (this.context.getZeroZeroTransformationPoint().x + this.context.transformation.x)) /
          this.context.transformation.k,
        (evt.y - (this.context.getZeroZeroTransformationPoint().y + this.context.transformation.y)) /
          this.context.transformation.k,
        svgText
      )
      .subscribe((controllerDrawing: Drawing) => {
        this.drawingsDataSource.add(controllerDrawing);
        this.drawingSaved.emit(true);
      });
  }

  ngOnDestroy() {
    this.textAdded.unsubscribe();
  }
}
