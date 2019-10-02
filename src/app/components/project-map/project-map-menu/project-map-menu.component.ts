import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { Project } from '../../../models/project';
import { Server } from '../../../models/server';
import { ToolsService } from '../../../services/tools.service';
import { MapSettingsService } from '../../../services/mapsettings.service';
import { DrawingService } from '../../../services/drawing.service';
import * as svg from 'save-svg-as-png';
import { saveAs } from 'file-saver';
import { SymbolService } from '../../../services/symbol.service';
import { select } from 'd3-selection';


@Component({
    selector: 'app-project-map-menu',
    templateUrl: './project-map-menu.component.html',
    styleUrls: ['./project-map-menu.component.scss']
})
export class ProjectMapMenuComponent implements OnInit, OnDestroy {
    @Input() project: Project;
    @Input() server: Server;

    public selectedDrawing: string;
    public drawTools = {
        isRectangleChosen: false,
        isEllipseChosen: false,
        isLineChosen: false,
        isTextChosen: false
    };
    public isLocked: boolean = false;

    constructor(
        private toolsService: ToolsService,
        private mapSettingsService: MapSettingsService,
        private drawingService: DrawingService,
        private symbolService: SymbolService
    ) {}

    ngOnInit() {}

    public async takeScreenshot() {
        let splittedSvg = document.getElementsByTagName("svg")[0].outerHTML.split('image');
        let i = 1;

        while (i < splittedSvg.length) {
            let splittedImage = splittedSvg[i].split("\"");
            let splittedUrl = splittedImage[1].split("/");

            let elem = await this.symbolService.raw(this.server, splittedUrl[7]).toPromise(); 
            let splittedElement = elem.split('-->');
            splittedSvg[i] = splittedElement[1].substring(2);
            i += 2;
        }
        let svgString = splittedSvg.join();

        let placeholder = document.createElement('div');
        placeholder.innerHTML = svgString;
        let element = placeholder.firstChild;

        // svg.saveSvgAsPng(element, "screenshot.png");

        // first
        var canvas = document.createElement('canvas');
        canvas.innerHTML = svgString;
        canvas.width = 2000;
        canvas.height = 1000;

        var a = document.createElement('a');
        a.download = "image.png";
        a.href = canvas.toDataURL('image/png');
        document.body.appendChild(a);
        a.click();

        // second
        // this.svgString2Image( svgString, 2000, 1000, 'png'); // passes Blob and filesize String to the callback
    }

    // svgString2Image( svgString, width, height, format) {
    //     var format = format ? format : 'png';
    
    //     var imgsrc = 'data:image/svg+xml;base64,'+ btoa( unescape( encodeURIComponent( svgString ) ) ); // Convert SVG string to data URL
    
    //     var canvas = document.createElement("canvas");
    //     var context = canvas.getContext("2d");
    
    //     canvas.width = width;
    //     canvas.height = height;
    
    //     var image = new Image();
    //     image.src = document.getElementsByTagName("svg")[0].outerHTML;
    //     context.clearRect ( 0, 0, width, height );
    //     context.drawImage(image, 0, 0, width, height);

    //     canvas.toBlob((blob: any) => {
    //         var filesize = Math.round( blob.length/1024 ) + ' KB';
    //         saveAs( blob, 'D3 vis exported to PNG.png' );
    //     });
    // }

    public addDrawing(selectedObject: string) {
        switch (selectedObject) {
          case 'rectangle':
            this.drawTools.isTextChosen = false;
            this.drawTools.isEllipseChosen = false;
            this.drawTools.isRectangleChosen = !this.drawTools.isRectangleChosen;
            this.drawTools.isLineChosen = false;
            break;
          case 'ellipse':
            this.drawTools.isTextChosen = false;
            this.drawTools.isEllipseChosen = !this.drawTools.isEllipseChosen;
            this.drawTools.isRectangleChosen = false;
            this.drawTools.isLineChosen = false;
            break;
          case 'line':
            this.drawTools.isTextChosen = false;
            this.drawTools.isEllipseChosen = false;
            this.drawTools.isRectangleChosen = false;
            this.drawTools.isLineChosen = !this.drawTools.isLineChosen;
            break;
          case 'text':
            this.drawTools.isTextChosen = !this.drawTools.isTextChosen;
            this.drawTools.isEllipseChosen = false;
            this.drawTools.isRectangleChosen = false;
            this.drawTools.isLineChosen = false;
            this.toolsService.textAddingToolActivation(this.drawTools.isTextChosen);
            break;
        }
    
        this.selectedDrawing = this.selectedDrawing === selectedObject ? '' : selectedObject;
    }

    public onDrawingSaved() {
        this.resetDrawToolChoice();
    }

    public resetDrawToolChoice() {
        this.drawTools.isRectangleChosen = false;
        this.drawTools.isEllipseChosen = false;
        this.drawTools.isLineChosen = false;
        this.drawTools.isTextChosen = false;
        this.selectedDrawing = '';
        this.toolsService.textAddingToolActivation(this.drawTools.isTextChosen);
    }

    public changeLockValue() {
        this.isLocked = !this.isLocked;
        this.mapSettingsService.changeMapLockValue(this.isLocked);
    }

    public uploadImageFile(event) {
        this.readImageFile(event.target);
    }
    
    private readImageFile(fileInput) {
        let file: File = fileInput.files[0];
        let fileReader: FileReader = new FileReader();
        let imageToUpload = new Image();
    
        fileReader.onloadend = () => {
            let image = fileReader.result;
            let svg = this.createSvgFileForImage(image, imageToUpload);
            this.drawingService.add(this.server, this.project.project_id, -(imageToUpload.width/2), -(imageToUpload.height/2), svg).subscribe(() => {});
        }
            
        imageToUpload.onload = () => { fileReader.readAsDataURL(file) };
        imageToUpload.src = window.URL.createObjectURL(file);
    }

    private createSvgFileForImage(image: string|ArrayBuffer, imageToUpload: HTMLImageElement) {
        return `<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" height=\"${imageToUpload.height}\" 
                width=\"${imageToUpload.width}\">\n<image height=\"${imageToUpload.height}\" width=\"${imageToUpload.width}\" xlink:href=\"${image}\"/>\n</svg>`
    }

    ngOnDestroy() {}
}
