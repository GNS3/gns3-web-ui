import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { DrawingToMapDrawingConverter } from '../../../../cartography/converters/map/drawing-to-map-drawing-converter';
import { MapDrawingToSvgConverter } from '../../../../cartography/converters/map/map-drawing-to-svg-converter';
import { DrawingsDataSource } from '../../../../cartography/datasources/drawings-datasource';
import { QtDasharrayFixer } from '../../../../cartography/helpers/qt-dasharray-fixer';
import { Drawing } from '../../../../cartography/models/drawing';
import { EllipseElement } from '../../../../cartography/models/drawings/ellipse-element';
import { LineElement } from '../../../../cartography/models/drawings/line-element';
import { RectElement } from '../../../../cartography/models/drawings/rect-element';
import { Controller } from '../../../../models/controller';
import { Project } from '../../../../models/project';
import { DrawingService } from '../../../../services/drawing.service';
import { ToasterService } from '../../../../services/toaster.service';
import { NonNegativeValidator } from '../../../../validators/non-negative-validator';
import { RotationValidator } from '../../../../validators/rotation-validator';

@Component({
  selector: 'app-style-editor',
  templateUrl: './style-editor.component.html',
  styleUrls: ['./style-editor.component.scss'],
})
export class StyleEditorDialogComponent implements OnInit {
  controller: Controller;
  project: Project;
  drawing: Drawing;
  element: ElementData;
  formGroup: FormGroup;
  borderTypes = [
    { qt: 'none', value: 'none', name: 'Solid' },
    { qt: '10, 2', value: '25, 25', name: 'Dash' },
    { qt: '4, 2', value: '5, 25', name: 'Dot' },
    { qt: '5, 5, 1, 5', value: '5, 25, 25', name: 'Dash Dot' },
    { qt: '5, 2, 5, 2, 5', value: '25, 25, 5, 25, 5', name: 'Dash Dot Dot' },
    { qt: '', value: '', name: 'No border' },
  ];

  constructor(
    public dialogRef: MatDialogRef<StyleEditorDialogComponent>,
    private drawingToMapDrawingConverter: DrawingToMapDrawingConverter,
    private mapDrawingToSvgConverter: MapDrawingToSvgConverter,
    private drawingService: DrawingService,
    private drawingsDataSource: DrawingsDataSource,
    private formBuilder: FormBuilder,
    private toasterService: ToasterService,
    private nonNegativeValidator: NonNegativeValidator,
    private rotationValidator: RotationValidator,
    private qtDasharrayFixer: QtDasharrayFixer
  ) {
    this.formGroup = this.formBuilder.group({
      borderWidth: new FormControl('', [Validators.required, nonNegativeValidator.get]),
      rotation: new FormControl('', [Validators.required, rotationValidator.get]),
    });
  }

  ngOnInit() {
    let dasharray_find_value;
    this.element = new ElementData();
    if (this.drawing.element instanceof RectElement || this.drawing.element instanceof EllipseElement) {
      this.element.fill = this.drawing.element.fill;
      this.element.stroke = this.drawing.element.stroke;  
      console.log(this.drawing.element.stroke_dasharray, this.drawing.element.stroke_width)
      this.element.stroke_dasharray = (this.drawing.element.stroke_dasharray == undefined && this.drawing.element.stroke_width == undefined ) ? '': this.drawing.element.stroke_dasharray ?? 'none' ;
      this.element.stroke_width = this.drawing.element.stroke_width;
    } else if (this.drawing.element instanceof LineElement) {
      this.element.stroke = this.drawing.element.stroke;
      this.element.stroke_dasharray = (this.drawing.element.stroke_dasharray == undefined && this.drawing.element.stroke_width == undefined ) ? '': this.drawing.element.stroke_dasharray ?? 'none' ;
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
      if (this.element.stroke_dasharray == '') {
        this.element.stroke_width = 0;
      } else {
        this.element.stroke_width =
          this.formGroup.get('borderWidth').value === 0 ? 2 : this.formGroup.get('borderWidth').value;
      }
      this.drawing.rotation = this.formGroup.get('rotation').value;

      if (this.drawing.element instanceof RectElement || this.drawing.element instanceof EllipseElement) {
        this.drawing.element.fill = this.element.fill;
        this.drawing.element.stroke = this.element.stroke ?? "#000000";
        this.drawing.element.stroke_dasharray = this.element.stroke_dasharray;
        this.drawing.element.stroke_width = this.element.stroke_width;
      } else if (this.drawing.element instanceof LineElement) {
        if (this.element.stroke_dasharray != '') {
          this.drawing.element.stroke = this.element.stroke ?? "#000000";
          this.drawing.element.stroke_dasharray =  this.element.stroke_dasharray === '' ? 'none' : this.element.stroke_dasharray;
          this.drawing.element.stroke_width = this.element.stroke_width === 0 ? 2 : this.element.stroke_width;  
        } else {
          this.toasterService.warning(`No border style line element not supported`);
        }
        this.drawing.element.stroke = this.element.stroke;
        this.drawing.element.stroke_dasharray = this.element.stroke_dasharray;
        this.drawing.element.stroke_width = this.element.stroke_width === 0 ? 2 : this.element.stroke_width;
      }
      let mapDrawing = this.drawingToMapDrawingConverter.convert(this.drawing);
      mapDrawing.element = this.drawing.element;

      this.drawing.svg = this.mapDrawingToSvgConverter.convert(mapDrawing);

      this.drawingService.update(this.controller, this.drawing).subscribe((controllerDrawing: Drawing) => {
        this.drawingsDataSource.update(controllerDrawing);
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
