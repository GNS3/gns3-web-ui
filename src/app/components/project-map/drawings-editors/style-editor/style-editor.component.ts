import { Component, OnInit, Injectable } from '@angular/core';
import { Server } from '../../../../models/server';
import { Project } from '../../../../models/project';
import { Drawing } from '../../../../cartography/models/drawing';
import { MatDialogRef } from '@angular/material/dialog';
import { DrawingToMapDrawingConverter } from '../../../../cartography/converters/map/drawing-to-map-drawing-converter';
import { MapDrawingToSvgConverter } from '../../../../cartography/converters/map/map-drawing-to-svg-converter';
import { DrawingService } from '../../../../services/drawing.service';
import { DrawingsDataSource } from '../../../../cartography/datasources/drawings-datasource';
import { EllipseElement } from '../../../../cartography/models/drawings/ellipse-element';
import { LineElement } from '../../../../cartography/models/drawings/line-element';
import { RectElement } from '../../../../cartography/models/drawings/rect-element';
import { FormGroup, FormBuilder, FormControl, Validators } from '@angular/forms';
import { ToasterService } from '../../../../services/toaster.service';
import { NonNegativeValidator } from '../../../../validators/non-negative-validator';
import { RotationValidator } from '../../../../validators/rotation-validator';

@Component({
  selector: 'app-style-editor',
  templateUrl: './style-editor.component.html',
  styleUrls: ['./style-editor.component.scss'],
})
export class StyleEditorDialogComponent implements OnInit {
  server: Server;
  project: Project;
  drawing: Drawing;
  element: ElementData;
  formGroup: FormGroup;

  constructor(
    public dialogRef: MatDialogRef<StyleEditorDialogComponent>,
    private drawingToMapDrawingConverter: DrawingToMapDrawingConverter,
    private mapDrawingToSvgConverter: MapDrawingToSvgConverter,
    private drawingService: DrawingService,
    private drawingsDataSource: DrawingsDataSource,
    private formBuilder: FormBuilder,
    private toasterService: ToasterService,
    private nonNegativeValidator: NonNegativeValidator,
    private rotationValidator: RotationValidator
  ) {
    this.formGroup = this.formBuilder.group({
      borderWidth: new FormControl('', [Validators.required, nonNegativeValidator.get]),
      rotation: new FormControl('', [Validators.required, rotationValidator.get]),
    });
  }

  ngOnInit() {
    this.element = new ElementData();

    if (this.drawing.element instanceof RectElement || this.drawing.element instanceof EllipseElement) {
      this.element.fill = this.drawing.element.fill;
      this.element.stroke = this.drawing.element.stroke;
      this.element.stroke_dasharray = this.drawing.element.stroke_dasharray;
      this.element.stroke_width = this.drawing.element.stroke_width;
    } else if (this.drawing.element instanceof LineElement) {
      this.element.stroke = this.drawing.element.stroke;
      this.element.stroke_dasharray = this.drawing.element.stroke_dasharray;
      this.element.stroke_width = this.drawing.element.stroke_width;
    }

    if (this.element.stroke_width === undefined) this.element.stroke_width = 0;
    this.formGroup.controls['borderWidth'].setValue(this.element.stroke_width);
    this.formGroup.controls['rotation'].setValue(this.drawing.rotation);
  }

  onNoClick() {
    this.dialogRef.close();
  }

  onYesClick() {
    if (this.formGroup.valid) {
      this.element.stroke_width = this.formGroup.get('borderWidth').value;
      this.drawing.rotation = this.formGroup.get('rotation').value;

      if (this.drawing.element instanceof RectElement || this.drawing.element instanceof EllipseElement) {
        this.drawing.element.fill = this.element.fill;
        this.drawing.element.stroke = this.element.stroke;
        this.drawing.element.stroke_dasharray = this.element.stroke_dasharray;
        this.drawing.element.stroke_width = this.element.stroke_width;
      } else if (this.drawing.element instanceof LineElement) {
        this.drawing.element.stroke = this.element.stroke;
        this.drawing.element.stroke_dasharray = this.element.stroke_dasharray;
        this.drawing.element.stroke_width = this.element.stroke_width;
      }

      let mapDrawing = this.drawingToMapDrawingConverter.convert(this.drawing);
      mapDrawing.element = this.drawing.element;

      this.drawing.svg = this.mapDrawingToSvgConverter.convert(mapDrawing);

      this.drawingService.update(this.server, this.drawing).subscribe((serverDrawing: Drawing) => {
        this.drawingsDataSource.update(serverDrawing);
        this.dialogRef.close();
      });
    } else {
      this.toasterService.error(`Entered data is incorrect`);
    }
  }
}

export class ElementData {
  fill: string;
  stroke: string;
  stroke_width: number;
  stroke_dasharray: string;
}
