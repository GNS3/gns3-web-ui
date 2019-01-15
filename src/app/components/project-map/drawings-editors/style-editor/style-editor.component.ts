import { Component, OnInit } from "@angular/core";
import { Server } from '../../../../models/server';
import { Project } from '../../../../models/project';
import { Drawing } from '../../../../cartography/models/drawing';
import { MatDialogRef } from '@angular/material';
import { DrawingToMapDrawingConverter } from '../../../../cartography/converters/map/drawing-to-map-drawing-converter';
import { MapDrawingToSvgConverter } from '../../../../cartography/converters/map/map-drawing-to-svg-converter';
import { DrawingService } from '../../../../services/drawing.service';
import { DrawingsDataSource } from '../../../../cartography/datasources/drawings-datasource';
import { EllipseElement } from '../../../../cartography/models/drawings/ellipse-element';
import { LineElement } from '../../../../cartography/models/drawings/line-element';
import { RectElement } from '../../../../cartography/models/drawings/rect-element';


@Component({
    selector: 'app-style-editor',
    templateUrl: './style-editor.component.html',
    styleUrls: ['./style-editor.component.scss']
})
export class StyleEditorDialogComponent implements OnInit {
    server: Server;
    project: Project;
    drawing: Drawing;
    element: ElementData;
    rotation: string;

    constructor(
        public dialogRef: MatDialogRef<StyleEditorDialogComponent>,
        private drawingToMapDrawingConverter: DrawingToMapDrawingConverter,
        private mapDrawingToSvgConverter: MapDrawingToSvgConverter,
        private drawingService: DrawingService,
        private drawingsDataSource: DrawingsDataSource
    ){}

    ngOnInit() {
        this.element = new ElementData();
        this.rotation = this.drawing.rotation.toString();

        if (this.drawing.element instanceof RectElement || this.drawing.element instanceof EllipseElement) {
            this.element.fill = this.drawing.element.fill;
            this.element.stroke = this.drawing.element.stroke;
            this.element.stroke_dasharray = this.drawing.element.stroke_dasharray;
            this.element.stroke_width = this.drawing.element.stroke_width;
        } else if (this.drawing.element instanceof LineElement) {
            this.element.stroke = this.drawing.element.stroke;
            this.element.stroke_dasharray = this.drawing.element.stroke_dasharray;
            this.element.stroke_width = this.drawing.element.stroke_width
        }
    }

    onNoClick() {
        this.dialogRef.close();
    }

    onYesClick() {
        this.drawing.rotation = +this.rotation;
        if (this.drawing.element instanceof RectElement || this.drawing.element instanceof EllipseElement) {
            this.drawing.element.fill = this.element.fill;
            this.drawing.element.stroke = this.element.stroke;
            this.drawing.element.stroke_dasharray = this.element.stroke_dasharray;
            this.drawing.element.stroke_width = this.element.stroke_width;
        } else if (this.drawing.element instanceof LineElement) {
            this.drawing.element.stroke = this.element.stroke;
            this.drawing.element.stroke_dasharray = this.element.stroke_dasharray;
            this.drawing.element.stroke_width = this.element.stroke_width
        }

        let mapDrawing = this.drawingToMapDrawingConverter.convert(this.drawing);
        mapDrawing.element = this.drawing.element;

        this.drawing.svg = this.mapDrawingToSvgConverter.convert(mapDrawing);

        this.drawingService
            .update(this.server, this.drawing).subscribe((serverDrawing: Drawing) => {
                this.drawingsDataSource.update(serverDrawing);
                this.dialogRef.close();
            });
    }
}

export class ElementData {
    fill: string;
    stroke: string;
    stroke_width: number;
    stroke_dasharray: string;
}
