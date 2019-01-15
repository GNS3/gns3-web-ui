import { Component, OnInit, ViewChild, ElementRef, Renderer2 } from "@angular/core";
import { Project } from '../../../../models/project';
import { Drawing } from '../../../../cartography/models/drawing';
import { Server } from '../../../../models/server';
import { MatDialogRef } from '@angular/material';
import { DrawingToMapDrawingConverter } from '../../../../cartography/converters/map/drawing-to-map-drawing-converter';
import { MapDrawingToSvgConverter } from '../../../../cartography/converters/map/map-drawing-to-svg-converter';
import { DrawingService } from '../../../../services/drawing.service';
import { DrawingsDataSource } from '../../../../cartography/datasources/drawings-datasource';
import { TextElement } from '../../../../cartography/models/drawings/text-element';


@Component({
    selector: 'app-text-editor',
    templateUrl: './text-editor.component.html',
    styleUrls: ['./text-editor.component.scss']
})
export class TextEditorDialogComponent implements OnInit {
    @ViewChild('textArea') textArea : ElementRef;

    server: Server;
    project: Project;
    drawing: Drawing;
    rotation: string;

    constructor(
        private dialogRef: MatDialogRef<TextEditorDialogComponent>,
        private drawingToMapDrawingConverter: DrawingToMapDrawingConverter,
        private mapDrawingToSvgConverter: MapDrawingToSvgConverter,
        private drawingService: DrawingService,
        private drawingsDataSource: DrawingsDataSource,
        private renderer: Renderer2
    ){}

    ngOnInit() {
        this.rotation = this.drawing.rotation.toString();

        let textElement = this.drawing.element as TextElement;
        this.renderer.setStyle(this.textArea.nativeElement, 'color', textElement.fill);
        this.renderer.setStyle(this.textArea.nativeElement, 'font-family', textElement.font_family);
        this.renderer.setStyle(this.textArea.nativeElement, 'font-size', `${textElement.font_size}pt`);
        this.renderer.setStyle(this.textArea.nativeElement, 'font-weight', textElement.font_weight);
    }

    onNoClick() {
        this.dialogRef.close();
    }

    onYesClick() {
        this.drawing.rotation = +this.rotation;
        let mapDrawing = this.drawingToMapDrawingConverter.convert(this.drawing);
        mapDrawing.element = this.drawing.element;

        this.drawing.svg = this.mapDrawingToSvgConverter.convert(mapDrawing);

        this.drawingService
            .update(this.server, this.drawing).subscribe((serverDrawing: Drawing) => {
                this.drawingsDataSource.update(serverDrawing);
                this.dialogRef.close();
            });
    }

    changeTextColor(changedColor) {
        this.renderer.setStyle(this.textArea.nativeElement, 'color', changedColor);
    }
}
