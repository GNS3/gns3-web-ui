import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnDestroy, OnInit, Output, SimpleChange, inject, input } from '@angular/core';
import { Subscription } from 'rxjs';
import { MapDrawingToSvgConverter } from '../../../cartography/converters/map/map-drawing-to-svg-converter';
import { DrawingsDataSource } from '../../../cartography/datasources/drawings-datasource';
import { DrawingsEventSource } from '../../../cartography/events/drawings-event-source';
import { AddedDataEvent } from '../../../cartography/events/event-source';
import { DefaultDrawingsFactory } from '../../../cartography/helpers/default-drawings-factory';
import { Drawing } from '../../../cartography/models/drawing';
import { Project } from '@models/project';
import { Controller } from '@models/controller';
import { DrawingService } from '@services/drawing.service';

@Component({
  standalone: true,
  selector: 'app-drawing-added',
  templateUrl: './drawing-added.component.html',
  styleUrls: ['./drawing-added.component.scss'],
  imports: [],
  // TODO: This component has been partially migrated to be zoneless-compatible.
  // After testing, this should be updated to ChangeDetectionStrategy.OnPush.
  changeDetection: ChangeDetectionStrategy.Default,
})
export class DrawingAddedComponent implements OnInit, OnDestroy {
  readonly controller = input<Controller>(undefined);
  @Input() project: Project;
  @Input() selectedDrawing: string;
  @Output() drawingSaved = new EventEmitter<boolean>();
  private pointToAddSelected: Subscription;

  private drawingService = inject(DrawingService);
  private drawingsDataSource = inject(DrawingsDataSource);
  private drawingsEventSource = inject(DrawingsEventSource);
  private drawingsFactory = inject(DefaultDrawingsFactory);
  private mapDrawingToSvgConverter = inject(MapDrawingToSvgConverter);

  ngOnInit() {
    this.pointToAddSelected = this.drawingsEventSource.pointToAddSelected.subscribe((evt) => this.onDrawingSaved(evt));
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
      .add(this.controller(), this.project.project_id, evt.x, evt.y, svgText)
      .subscribe((controllerDrawing: Drawing) => {
        this.drawingsDataSource.add(controllerDrawing);
        this.drawingSaved.emit(true);
      });
  }

  ngOnDestroy() {
    this.pointToAddSelected.unsubscribe();
  }
}
