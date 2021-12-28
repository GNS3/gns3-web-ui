import { ChangeDetectionStrategy, Component, Input, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { select } from 'd3-selection';
import * as svg from 'save-svg-as-png';
import downloadSvg from 'svg-crowbar';
import { Project } from '../../../models/project';
import { Server } from '../../../models/server';
import { DrawingService } from '../../../services/drawing.service';
import { MapSettingsService } from '../../../services/mapsettings.service';
import { SymbolService } from '../../../services/symbol.service';
import { ThemeService } from '../../../services/theme.service';
import { ToolsService } from '../../../services/tools.service';
import { Screenshot, ScreenshotDialogComponent } from '../screenshot-dialog/screenshot-dialog.component';

@Component({
  selector: 'app-project-map-menu',
  templateUrl: './project-map-menu.component.html',
  styleUrls: ['./project-map-menu.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectMapMenuComponent implements OnInit, OnDestroy {
  @Input() project: Project;
  @Input() server: Server;

  public selectedDrawing: string;
  public drawTools = {
    isRectangleChosen: false,
    isEllipseChosen: false,
    isLineChosen: false,
    isTextChosen: false,
  };
  public isLocked: boolean = false;
  public isLightThemeEnabled: boolean = false;

  constructor(
    private toolsService: ToolsService,
    private mapSettingsService: MapSettingsService,
    private drawingService: DrawingService,
    private symbolService: SymbolService,
    private dialog: MatDialog,
    private themeService: ThemeService
  ) {}

  ngOnInit() {
    this.themeService.getActualTheme() === 'light'
      ? (this.isLightThemeEnabled = true)
      : (this.isLightThemeEnabled = false);
  }

  getCssClassForIcon(type: string) {
    if (type === 'text') {
      return {
        unmarkedLight: !this.drawTools.isTextChosen && this.isLightThemeEnabled,
        marked: this.drawTools.isTextChosen,
      };
    } else if (type === 'rectangle') {
      return {
        unmarkedLight: !this.drawTools.isRectangleChosen && this.isLightThemeEnabled,
        marked: this.drawTools.isRectangleChosen,
      };
    }
    return {
      unmarkedLight: !this.drawTools.isEllipseChosen && this.isLightThemeEnabled,
      marked: this.drawTools.isEllipseChosen,
    };
  }

  public takeScreenshot() {
    const dialogRef = this.dialog.open(ScreenshotDialogComponent, {
      width: '400px',
      autoFocus: false,
      disableClose: true,
    });
    dialogRef.afterClosed().subscribe((result: Screenshot) => {
      if (result) this.saveImage(result);
    });
  }

  private async saveImage(screenshotProperties: Screenshot) {
    if (screenshotProperties.filetype === 'png') {
      let splittedSvg = document.getElementsByTagName('svg')[0].outerHTML.split('image');
      let i = 1;

      while (i < splittedSvg.length) {
        let splittedImage = splittedSvg[i].split('"');
        let splittedUrl = splittedImage[1].split('/');

        let elem = await this.symbolService.raw(this.server, splittedUrl[7]).toPromise();
        let splittedElement = elem.split('-->');
        splittedSvg[i] = splittedElement[1].substring(2);
        i += 2;
      }
      let svgString = splittedSvg.join();

      let placeholder = document.createElement('div');
      placeholder.innerHTML = svgString;
      let element = placeholder.firstChild;

      svg.saveSvgAsPng(element, `${screenshotProperties.name}.png`);
    } else {
      var svg_el = select('svg').attr('version', 1.1).attr('xmlns', 'http://www.w3.org/2000/svg').node();
      downloadSvg(select('svg').node(), `${screenshotProperties.name}`);
    }
  }

  public addDrawing(selectedObject: string) {
    if ((selectedObject === 'rectangle' && this.drawTools.isRectangleChosen) || (selectedObject === 'ellipse' && this.drawTools.isEllipseChosen) ||
    (selectedObject === 'line' && this.drawTools.isLineChosen) || (selectedObject === 'text' && this.drawTools.isTextChosen)) {
      document.documentElement.style.cursor = "default";
    } else {
      document.documentElement.style.cursor = "crosshair";
    }

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
    document.documentElement.style.cursor = "default";

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
      this.drawingService
        .add(this.server, this.project.project_id, -(imageToUpload.width / 2), -(imageToUpload.height / 2), svg)
        .subscribe(() => {});
    };

    imageToUpload.onload = () => {
      fileReader.readAsDataURL(file);
    };
    imageToUpload.src = window.URL.createObjectURL(file);
  }

  private createSvgFileForImage(image: string | ArrayBuffer, imageToUpload: HTMLImageElement) {
    return `<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" height=\"${imageToUpload.height}\" 
                width=\"${imageToUpload.width}\">\n<image height=\"${imageToUpload.height}\" width=\"${imageToUpload.width}\" xlink:href=\"${image}\"/>\n</svg>`;
  }

  ngOnDestroy() {}
}
