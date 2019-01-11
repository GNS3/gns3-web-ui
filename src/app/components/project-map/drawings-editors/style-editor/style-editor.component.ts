import { Component, OnInit } from "@angular/core";
import { Server } from '../../../../models/server';
import { Project } from '../../../../models/project';
import { Drawing } from '../../../../cartography/models/drawing';
import { MatDialogRef, MatDialog } from '@angular/material';
import { DrawingToMapDrawingConverter } from '../../../../cartography/converters/map/drawing-to-map-drawing-converter';
import { MapDrawingToSvgConverter } from '../../../../cartography/converters/map/map-drawing-to-svg-converter';
import { DrawingService } from '../../../../services/drawing.service';
import { DrawingsDataSource } from '../../../../cartography/datasources/drawings-datasource';


@Component({
    selector: 'app-style-editor',
    templateUrl: './style-editor.component.html',
    styleUrls: ['./style-editor.component.scss']
})
export class StyleEditorDialogComponent implements OnInit {
    server: Server;
    project: Project;
    drawing: Drawing;

    constructor(
        public dialogRef: MatDialogRef<StyleEditorDialogComponent>,
        private dialog: MatDialog,
        private drawingToMapDrawingConverter: DrawingToMapDrawingConverter,
        private mapDrawingToSvgConverter: MapDrawingToSvgConverter,
        private drawingService: DrawingService,
        private drawingsDataSource: DrawingsDataSource
    ){}

    ngOnInit() {
        console.log(this.drawing.element);
    }

    onNoClick() {
        this.dialogRef.close();
    }

    onYesClick() {
        let mapDrawing = this.drawingToMapDrawingConverter.convert(this.drawing);
        this.drawing.svg = this.mapDrawingToSvgConverter.convert(mapDrawing);
        this.drawingService
            .update(this.server, this.drawing).subscribe((serverDrawing: Drawing) => {
                this.drawingsDataSource.update(serverDrawing);
                this.dialogRef.close();
            });
    }
}
