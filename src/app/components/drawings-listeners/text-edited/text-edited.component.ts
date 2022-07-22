import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { MapDrawingToSvgConverter } from '../../../cartography/converters/map/map-drawing-to-svg-converter';
import { DrawingsDataSource } from '../../../cartography/datasources/drawings-datasource';
import { DrawingsEventSource } from '../../../cartography/events/drawings-event-source';
import { TextEditedDataEvent } from '../../../cartography/events/event-source';
import { Drawing } from '../../../cartography/models/drawing';
import { TextElement } from '../../../cartography/models/drawings/text-element';
import { MapDrawing } from '../../../cartography/models/map/map-drawing';
import{ Controller } from '../../../models/controller';
import { DrawingService } from '../../../services/drawing.service';

@Component({
  selector: 'app-text-edited',
  templateUrl: './text-edited.component.html',
  styleUrls: ['./text-edited.component.scss'],
})
export class TextEditedComponent implements OnInit, OnDestroy {
  @Input() controller: Controller;
  private textEdited: Subscription;

  constructor(
    private drawingService: DrawingService,
    private drawingsDataSource: DrawingsDataSource,
    private drawingsEventSource: DrawingsEventSource,
    private mapDrawingToSvgConverter: MapDrawingToSvgConverter
  ) {}

  ngOnInit() {
    this.textEdited = this.drawingsEventSource.textEdited.subscribe((evt) => this.onTextEdited(evt));
  }

  onTextEdited(evt: TextEditedDataEvent) {
    let mapDrawing: MapDrawing = new MapDrawing();
    mapDrawing.element = evt.textElement;
    (mapDrawing.element as TextElement).text = evt.editedText;
    let svgString = this.mapDrawingToSvgConverter.convert(mapDrawing);

    let drawing = this.drawingsDataSource.get(evt.textDrawingId);

    this.drawingService.updateText(this.controller, drawing, svgString).subscribe((controllerDrawing: Drawing) => {
      this.drawingsDataSource.update(controllerDrawing);
      this.drawingsEventSource.textSaved.emit(true);
    });
  }

  ngOnDestroy() {
    this.textEdited.unsubscribe();
  }
}
