import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { Project } from '../../../models/project';
import { Server } from '../../../models/server';
import { ToolsService } from '../../../services/tools.service';
import { MapSettingsService } from '../../../services/mapsettings.service';
import { DrawingService } from '../../../services/drawing.service';


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
        private drawingService: DrawingService
    ) {}

    ngOnInit() {}

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
