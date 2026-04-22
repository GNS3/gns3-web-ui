import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  SimpleChange,
  inject,
  input,
  OnChanges,
} from '@angular/core';
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
import { ToasterService } from '@services/toaster.service';

@Component({
  selector: 'app-drawing-added',
  templateUrl: './drawing-added.component.html',
  styleUrl: './drawing-added.component.scss',
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DrawingAddedComponent implements OnInit, OnDestroy, OnChanges {
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
  private toasterService = inject(ToasterService);
  private cdr = inject(ChangeDetectorRef);

  ngOnInit() {
    this.pointToAddSelected = this.drawingsEventSource.pointToAddSelected.subscribe((evt) => this.onDrawingSaved(evt));
  }

  ngOnChanges(changes: { [propKey: string]: SimpleChange }) {
    if (changes['selectedDrawing'] && !changes['selectedDrawing'].isFirstChange()) {
      this.selectedDrawing = changes['selectedDrawing'].currentValue;

      // Always emit selected event (needed for curve drawing tool activation)
      // But curve tool won't create drawings on click - only on drag
      if (this.selectedDrawing !== 'text') {
        this.drawingsEventSource.selected.emit(this.selectedDrawing);
      }
    }
  }

  onDrawingSaved(evt: AddedDataEvent) {
    // Skip curve tool - it uses drag-to-draw, not click-to-create
    if (this.selectedDrawing === 'curve') {
      return;
    }

    let drawing = this.drawingsFactory.getDrawingMock(this.selectedDrawing);
    let svgText = this.mapDrawingToSvgConverter.convert(drawing);

    this.drawingService
      .add(this.controller(), this.project.project_id, evt.x, evt.y, svgText)
      .subscribe({
        next: (controllerDrawing: Drawing) => {
          this.drawingsDataSource.add(controllerDrawing);
          this.drawingSaved.emit(true);
        },
        error: (err) => {
          const message = err.error?.message || err.message || 'Failed to create drawing';
          this.toasterService.error(message);
          this.cdr.markForCheck();
        },
      });
  }

  ngOnDestroy() {
    this.pointToAddSelected.unsubscribe();
  }
}
