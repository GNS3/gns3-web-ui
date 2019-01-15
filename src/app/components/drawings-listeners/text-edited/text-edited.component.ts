import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { TextEditedDataEvent } from '../../../cartography/events/event-source';
import { MapDrawing } from '../../../cartography/models/map/map-drawing';
import { TextElement } from '../../../cartography/models/drawings/text-element';
import { Drawing } from '../../../cartography/models/drawing';
import { Server } from '../../../models/server';
import { Subscription } from 'rxjs';
import { DrawingService } from '../../../services/drawing.service';
import { DrawingsDataSource } from '../../../cartography/datasources/drawings-datasource';
import { DrawingsEventSource } from '../../../cartography/events/drawings-event-source';
import { MapDrawingToSvgConverter } from '../../../cartography/converters/map/map-drawing-to-svg-converter';

@Component({
  selector: 'app-text-edited',
  templateUrl: './text-edited.component.html',
  styleUrls: ['./text-edited.component.css']
})
export class TextEditedComponent implements OnInit, OnDestroy {
  @Input() server: Server;
  private textEdited: Subscription;

  constructor(
    private drawingService: DrawingService,
    private drawingsDataSource: DrawingsDataSource,
    private drawingsEventSource: DrawingsEventSource,
    private mapDrawingToSvgConverter: MapDrawingToSvgConverter
  ) {}

  ngOnInit() {
    this.textEdited = this.drawingsEventSource.textEdited.subscribe(evt => this.onTextEdited(evt));
  }

  onTextEdited(evt: TextEditedDataEvent) {
    let mapDrawing: MapDrawing = new MapDrawing();
    mapDrawing.element = evt.textElement;
    (mapDrawing.element as TextElement).text = evt.editedText;
    let svgString = this.mapDrawingToSvgConverter.convert(mapDrawing);

    let drawing = this.drawingsDataSource.get(evt.textDrawingId);

    this.drawingService.updateText(this.server, drawing, svgString).subscribe((serverDrawing: Drawing) => {
      this.drawingsDataSource.update(serverDrawing);
      this.drawingsEventSource.textSaved.emit(true);
    });
  }

  ngOnDestroy() {
    this.textEdited.unsubscribe();
  }
}
