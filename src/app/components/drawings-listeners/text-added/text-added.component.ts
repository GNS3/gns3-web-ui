import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  inject,
  input,
} from '@angular/core';
import { Subscription } from 'rxjs';
import { MapDrawingToSvgConverter } from '../../../cartography/converters/map/map-drawing-to-svg-converter';
import { DrawingsDataSource } from '../../../cartography/datasources/drawings-datasource';
import { DrawingsEventSource } from '../../../cartography/events/drawings-event-source';
import { TextAddedDataEvent } from '../../../cartography/events/event-source';
import { DefaultDrawingsFactory } from '../../../cartography/helpers/default-drawings-factory';
import { Context } from '../../../cartography/models/context';
import { Drawing } from '../../../cartography/models/drawing';
import { TextElement } from '../../../cartography/models/drawings/text-element';
import { Project } from '@models/project';
import { Controller } from '@models/controller';
import { DrawingService } from '@services/drawing.service';
import { ToasterService } from '@services/toaster.service';

@Component({
  selector: 'app-text-added',
  templateUrl: './text-added.component.html',
  styleUrl: './text-added.component.scss',
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TextAddedComponent implements OnInit, OnDestroy {
  readonly controller = input<Controller>(undefined);
  @Input() project: Project;
  @Output() drawingSaved = new EventEmitter<boolean>();
  private textAdded: Subscription;

  private drawingService = inject(DrawingService);
  private drawingsDataSource = inject(DrawingsDataSource);
  private drawingsEventSource = inject(DrawingsEventSource);
  private drawingsFactory = inject(DefaultDrawingsFactory);
  private mapDrawingToSvgConverter = inject(MapDrawingToSvgConverter);
  private context = inject(Context);
  private toasterService = inject(ToasterService);
  private cdr = inject(ChangeDetectorRef);

  ngOnInit() {
    this.textAdded = this.drawingsEventSource.textAdded.subscribe((evt) => this.onTextAdded(evt));
  }

  onTextAdded(evt: TextAddedDataEvent) {
    let drawing = this.drawingsFactory.getDrawingMock('text');
    (drawing.element as TextElement).text = evt.savedText;
    let svgText = this.mapDrawingToSvgConverter.convert(drawing);

    // evt.x and evt.y are canvas coordinates (like rectangle/circle)
    this.drawingService
      .add(
        this.controller(),
        this.project.project_id,
        evt.x,
        evt.y,
        svgText
      )
      .subscribe({
        next: (controllerDrawing: Drawing) => {
          this.drawingsDataSource.add(controllerDrawing);
          this.drawingSaved.emit(true);
        },
        error: (err) => {
          const message = err.error?.message || err.message || 'Failed to create text drawing';
          this.toasterService.error(message);
          this.cdr.markForCheck();
        },
      });
  }

  ngOnDestroy() {
    this.textAdded.unsubscribe();
  }
}
