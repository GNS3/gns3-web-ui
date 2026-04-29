import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  UntypedFormBuilder,
  UntypedFormControl,
  UntypedFormGroup,
  Validators,
} from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { DrawingToMapDrawingConverter } from '../../../../cartography/converters/map/drawing-to-map-drawing-converter';
import { MapDrawingToSvgConverter } from '../../../../cartography/converters/map/map-drawing-to-svg-converter';
import { DrawingsDataSource } from '../../../../cartography/datasources/drawings-datasource';
import { QtDasharrayFixer } from '../../../../cartography/helpers/qt-dasharray-fixer';
import { Drawing } from '../../../../cartography/models/drawing';
import { CurveElement, CurveType } from '../../../../cartography/models/drawings/curve-element';
import { EllipseElement } from '../../../../cartography/models/drawings/ellipse-element';
import { LineElement } from '../../../../cartography/models/drawings/line-element';
import { RectElement } from '../../../../cartography/models/drawings/rect-element';
import { Controller } from '@models/controller';
import { Project } from '@models/project';
import { DrawingService } from '@services/drawing.service';
import { ToasterService } from '@services/toaster.service';
import { NonNegativeValidator } from '../../../../validators/non-negative-validator';
import { RotationValidator } from '../../../../validators/rotation-validator';

@Component({
  selector: 'app-style-editor',
  templateUrl: './style-editor.component.html',
  styleUrl: './style-editor.component.scss',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatOptionModule,
    MatButtonModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StyleEditorDialogComponent implements OnInit {
  private dialogRef = inject(MatDialogRef<StyleEditorDialogComponent>);
  private drawingToMapDrawingConverter = inject(DrawingToMapDrawingConverter);
  private mapDrawingToSvgConverter = inject(MapDrawingToSvgConverter);
  private drawingService = inject(DrawingService);
  private drawingsDataSource = inject(DrawingsDataSource);
  private formBuilder = inject(UntypedFormBuilder);
  private toasterService = inject(ToasterService);
  private nonNegativeValidator = inject(NonNegativeValidator);
  private rotationValidator = inject(RotationValidator);
  private qtDasharrayFixer = inject(QtDasharrayFixer);
  private cd = inject(ChangeDetectorRef);

  controller: Controller;
  project: Project;
  drawing: Drawing;
  element: ElementData;
  formGroup: UntypedFormGroup;
  borderTypes = [
    { qt: 'none', value: 'none', name: 'Solid' },
    { qt: '10, 2', value: '25, 25', name: 'Dash' },
    { qt: '4, 2', value: '5, 25', name: 'Dot' },
    { qt: '12, 3, 5, 3', value: '5, 25, 25', name: 'Dash Dot' },
    { qt: '12, 3, 5, 3, 5, 3', value: '25, 25, 5, 25, 5', name: 'Dash Dot Dot' },
    { qt: '', value: '', name: 'No border' },
  ];
  curveTypes = [
    { value: 'catmullrom', name: 'Catmull-Rom (Smooth)' },
    { value: 'basis', name: 'Basis (B-spline)' },
    { value: 'monotone', name: 'Monotone' },
  ];
  arrowDirections = [
    { value: 'none', name: 'No Arrow' },
    { value: 'end', name: 'End Arrow' },
    { value: 'start', name: 'Start Arrow' },
    { value: 'both', name: 'Both Arrows' },
  ];
  lineDrawingTypes = [
    { value: 'straight', name: 'Straight Line' },
    { value: 'freeform', name: 'Freeform (Control Point)' },
  ];

  constructor() {
    this.formGroup = this.formBuilder.group({
      borderWidth: new UntypedFormControl('', [Validators.required, this.nonNegativeValidator.get]),
      rotation: new UntypedFormControl('', [Validators.required, this.rotationValidator.get]),
    });
  }

  ngOnInit() {
    let dasharray_find_value;
    this.element = new ElementData();
    if (this.drawing.element instanceof RectElement || this.drawing.element instanceof EllipseElement) {
      this.element.fill = this.drawing.element.fill;
      this.element.width = this.drawing.element.width;
      this.element.height = this.drawing.element.height;
      this.element.stroke = this.drawing.element.stroke;
      this.element.stroke_dasharray =
        this.drawing.element.stroke_dasharray == undefined && this.drawing.element.stroke_width == undefined
          ? ''
          : this.drawing.element.stroke_dasharray ?? 'none';
      this.element.stroke_width = this.drawing.element.stroke_width;
    } else if (this.drawing.element instanceof LineElement) {
      this.element.stroke = this.drawing.element.stroke;
      this.element.stroke_dasharray =
        this.drawing.element.stroke_dasharray == undefined && this.drawing.element.stroke_width == undefined
          ? ''
          : this.drawing.element.stroke_dasharray ?? 'none';
      this.element.stroke_width = this.drawing.element.stroke_width;

      // Initialize arrow direction for line
      if (this.drawing.element.arrow_start && this.drawing.element.arrow_end) {
        this.element.line_arrow_direction = 'both';
      } else if (this.drawing.element.arrow_start) {
        this.element.line_arrow_direction = 'start';
      } else if (this.drawing.element.arrow_end) {
        this.element.line_arrow_direction = 'end';
      } else {
        this.element.line_arrow_direction = 'none';
      }

      // Initialize drawing type
      this.element.line_drawing_type = this.drawing.element.drawing_type || 'straight';
    } else if (this.drawing.element instanceof CurveElement) {
      this.element.stroke = this.drawing.element.stroke;
      this.element.stroke_dasharray =
        this.drawing.element.stroke_dasharray == undefined && this.drawing.element.stroke_width == undefined
          ? ''
          : this.drawing.element.stroke_dasharray ?? 'none';
      this.element.stroke_width = this.drawing.element.stroke_width;
      this.element.curve_type = this.drawing.element.curve_type || 'catmullrom';
      if (this.drawing.element.arrow_start && this.drawing.element.arrow_end) {
        this.element.arrow_direction = 'both';
      } else if (this.drawing.element.arrow_start) {
        this.element.arrow_direction = 'start';
      } else if (this.drawing.element.arrow_end) {
        this.element.arrow_direction = 'end';
      } else {
        this.element.arrow_direction = 'none';
      }
    }

    if (this.drawing.element instanceof RectElement) {
      this.element.rx = this.drawing.element.rx;
      this.element.ry = this.drawing.element.ry;
    }

    if (this.element.stroke_width === undefined) this.element.stroke_width = 0;
    this.formGroup.controls['borderWidth'].setValue(this.element.stroke_width);
    this.formGroup.controls['rotation'].setValue(this.drawing.rotation);
  }

  onFillChange(value: string) {
    this.element.fill = value;
    this.cd.markForCheck();
  }

  onStrokeChange(value: string) {
    this.element.stroke = value;
    this.cd.markForCheck();
  }

  onStrokeDasharrayChange(value: string) {
    this.element.stroke_dasharray = value;
    this.cd.markForCheck();
  }

  onWidthChange(value: number) {
    this.element.width = value;
    this.cd.markForCheck();
  }

  onHeightChange(value: number) {
    this.element.height = value;
    this.cd.markForCheck();
  }

  onRxChange(value: number) {
    this.element.rx = value;
    this.cd.markForCheck();
  }

  onCurveTypeChange(value: string) {
    this.element.curve_type = value;
    this.cd.markForCheck();
  }

  onArrowDirectionChange(value: string) {
    this.element.arrow_direction = value;
    this.cd.markForCheck();
  }

  onLineArrowDirectionChange(value: string) {
    this.element.line_arrow_direction = value;
    this.cd.markForCheck();
  }

  onLineDrawingTypeChange(value: string) {
    this.element.line_drawing_type = value;
    this.cd.markForCheck();
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
        this.drawing.element.width = this.element.width;
        this.drawing.element.height = this.element.height;
        this.drawing.element.stroke = this.element.stroke ?? '#000000';
        this.drawing.element.stroke_dasharray = this.element.stroke_dasharray;
        this.drawing.element.stroke_width = this.element.stroke_width;
      } else if (this.drawing.element instanceof LineElement) {
        if (this.element.stroke_dasharray != '') {
          this.drawing.element.stroke = this.element.stroke ?? '#000000';
          this.drawing.element.stroke_dasharray =
            this.element.stroke_dasharray === '' ? 'none' : this.element.stroke_dasharray;
          this.drawing.element.stroke_width = this.element.stroke_width === 0 ? 2 : this.element.stroke_width;
        } else {
          this.toasterService.warning(`No border style line element not supported`);
        }
        this.drawing.element.stroke = this.element.stroke;
        this.drawing.element.stroke_dasharray = this.element.stroke_dasharray;
        this.drawing.element.stroke_width = this.element.stroke_width === 0 ? 2 : this.element.stroke_width;

        // Update arrow properties
        this.drawing.element.arrow_start =
          this.element.line_arrow_direction === 'start' || this.element.line_arrow_direction === 'both';
        this.drawing.element.arrow_end =
          this.element.line_arrow_direction === 'end' || this.element.line_arrow_direction === 'both';

        // Update drawing type
        this.drawing.element.drawing_type = (this.element.line_drawing_type || 'straight') as any;

        // Initialize control_offset if switching to freeform
        if (this.drawing.element.drawing_type === 'freeform' && !this.drawing.element.control_offset) {
          this.drawing.element.control_offset = [0, 0];
        }
      } else if (this.drawing.element instanceof CurveElement) {
        this.drawing.element.stroke = this.element.stroke ?? '#000000';
        this.drawing.element.stroke_dasharray =
          this.element.stroke_dasharray === '' ? 'none' : this.element.stroke_dasharray;
        this.drawing.element.stroke_width = this.element.stroke_width === 0 ? 2 : this.element.stroke_width;
        this.drawing.element.curve_type = (this.element.curve_type || 'catmullrom') as CurveType;
        this.drawing.element.arrow_start = this.element.arrow_direction === 'start' || this.element.arrow_direction === 'both';
        this.drawing.element.arrow_end = this.element.arrow_direction === 'end' || this.element.arrow_direction === 'both';
      }

      if (this.drawing.element instanceof RectElement) {
        this.drawing.element.rx = this.element.rx;
        this.drawing.element.ry = this.element.rx; // set ry with rx because we don't have ry in the form
      } else if (this.drawing.element instanceof EllipseElement) {
        this.drawing.element.rx = this.element.width / 2;
        this.drawing.element.ry = this.element.height / 2;
      }

      let mapDrawing = this.drawingToMapDrawingConverter.convert(this.drawing);
      mapDrawing.element = this.drawing.element;

      this.drawing.svg = this.mapDrawingToSvgConverter.convert(mapDrawing);

      this.drawingService.update(this.controller, this.drawing).subscribe({
        next: (controllerDrawing: Drawing) => {
          this.drawingsDataSource.update(controllerDrawing);
          this.dialogRef.close();
        },
        error: (err) => {
          const message = err.error?.message || err.message || 'Failed to update drawing';
          this.toasterService.error(message);
          this.cd.markForCheck();
        },
      });
    } else {
      this.toasterService.error(`Entered data is incorrect`);
    }
  }
}

export class ElementData {
  fill: string;
  width: number;
  height: number;
  stroke: string;
  stroke_width: number;
  stroke_dasharray: string;
  rx: number;
  ry: number;
  curve_type: string;
  arrow_direction: string;
  line_arrow_direction: string;
  line_drawing_type: string;
}
