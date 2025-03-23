import { ChangeDetectionStrategy, Component, Input, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { NodeService } from '@services/node.service';
import { select } from 'd3-selection';
import { Subscription } from 'rxjs';
import * as svg from 'save-svg-as-png';
import downloadSvg from 'svg-crowbar';
import { Drawing } from '../../../cartography/models/drawing';
import { Node } from '../../../cartography/models/node';
import { Controller } from '@models/controller';
import { Project } from '@models/project';
import { DrawingService } from '@services/drawing.service';
import { MapSettingsService } from '@services/mapsettings.service';
import { ProjectService } from '@services/project.service';
import { SymbolService } from '@services/symbol.service';
import { ThemeService } from '@services/theme.service';
import { ToolsService } from '@services/tools.service';
import { Screenshot, ScreenshotDialogComponent } from '../screenshot-dialog/screenshot-dialog.component';
import { ProjectMapLockConfirmationDialogComponent } from './project-map-lock-confirmation-dialog/project-map-lock-confirmation-dialog.component';
import { DrawingsDataSource } from '../../../cartography/datasources/drawings-datasource';
import { NodesDataSource } from '../../../cartography/datasources/nodes-datasource';
@Component({
  selector: 'app-project-map-menu',
  templateUrl: './project-map-menu.component.html',
  styleUrls: ['./project-map-menu.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectMapMenuComponent implements OnInit, OnDestroy {
  @Input() project: Project;
  @Input() controller: Controller;
  private nodes: Node[] = [];
  private drawing: Drawing[] = [];

  public selectedDrawing: string;
  public lock: string = 'lock_open';
  public drawTools = {
    isRectangleChosen: false,
    isEllipseChosen: false,
    isLineChosen: false,
    isTextChosen: false,
  };
  public isLocked: boolean = false;
  public isLightThemeEnabled: boolean = false;
  private projectSubscription: Subscription;
  constructor(
    private toolsService: ToolsService,
    private mapSettingsService: MapSettingsService,
    private drawingService: DrawingService,
    private symbolService: SymbolService,
    private dialog: MatDialog,
    private themeService: ThemeService,
    private projectServices: ProjectService,
    private nodeService : NodeService,
    private nodesDataSource: NodesDataSource,
    private drawingsDataSource: DrawingsDataSource,
  ) {}

  ngOnInit() {
    this.themeService.getActualTheme() === 'light'
      ? (this.isLightThemeEnabled = true)
      : (this.isLightThemeEnabled = false);
    this.projectSubscription = this.projectServices.projectLockIconSubject.subscribe((isRedraw: boolean) => {
      if (isRedraw) {
        this.getAllNodesAndDrawingStatus();
      }
    });
    this.getAllNodesAndDrawingStatus();
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
      try {
        // Get the SVG element and clone it to avoid modifying the original
        const originalSvg = document.getElementsByTagName('svg')[0];
        const svgClone = originalSvg.cloneNode(true) as SVGElement;

        // Process any embedded images
        const images = svgClone.getElementsByTagName('image');
        for (let i = 0; i < images.length; i++) {
          const image = images[i];
          const href = image.getAttribute('href') || image.getAttribute('xlink:href');
          if (href) {
            const urlParts = href.split('/');
            const symbolId = urlParts[urlParts.length - 1];
            try {
              const rawSvg = await this.symbolService.raw(this.controller, symbolId).toPromise();
              if (rawSvg) {
                // Extract SVG content, fallback to raw content if parsing fails
                const svgContent = rawSvg.includes('-->') ?
                  rawSvg.split('-->')[1].trim() :
                  rawSvg.trim();
                image.outerHTML = svgContent;
              }
            } catch (err) {
              console.warn(`Failed to process embedded image: ${symbolId}`, err);
            }
          }
        }

        // Create a temporary container and save as PNG
        const container = document.createElement('div');
        container.appendChild(svgClone);
        svg.saveSvgAsPng(svgClone, `${screenshotProperties.name}.png`);
      } catch (err) {
        console.error('Failed to save PNG:', err);
        throw err;
      }
    } else {
      var svg_el = select('svg').attr('version', 1.1).attr('xmlns', 'http://www.w3.org/2000/svg').node();
      downloadSvg(select('svg').node(), `${screenshotProperties.name}`);
    }
  }

  public addDrawing(selectedObject: string) {
    if (
      (selectedObject === 'rectangle' && this.drawTools.isRectangleChosen) ||
      (selectedObject === 'ellipse' && this.drawTools.isEllipseChosen) ||
      (selectedObject === 'line' && this.drawTools.isLineChosen) ||
      (selectedObject === 'text' && this.drawTools.isTextChosen)
    ) {
      document.documentElement.style.cursor = 'default';
    } else {
      document.documentElement.style.cursor = 'crosshair';
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
    document.documentElement.style.cursor = 'default';
    this.drawTools.isRectangleChosen = false;
    this.drawTools.isEllipseChosen = false;
    this.drawTools.isLineChosen = false;
    this.drawTools.isTextChosen = false;
    this.selectedDrawing = '';
    this.toolsService.textAddingToolActivation(this.drawTools.isTextChosen);
  }
  getAllNodesAndDrawingStatus() {
   this.projectServices.getProjectStatus(this.controller,this.project.project_id).subscribe((status)=>{
     if (status) {
          this.isLocked = true;
          this.lock = 'lock';
        } else {
          this.isLocked = false;
          this.lock = 'lock_open';
        }
   })
    this.projectServices.nodes(this.controller, this.project.project_id).subscribe((response) => {
      this.nodes = response;
      this.nodes.forEach((node) => {
        this.nodeService.updateNode(this.controller, node).subscribe((node) => {
          this.nodesDataSource.update(node);
        });
      });
    });

    this.projectServices.drawings(this.controller, this.project.project_id).subscribe((response) => {
      this.drawing = response;
      this.drawing.forEach((drawing) => {
        this.drawingService.update(this.controller, drawing).subscribe((drawing) => {
          this.drawingsDataSource.update(drawing);
        });
      });
    });
  }

  public changeLockValue() {
    this.isLocked = !this.isLocked;
    this.mapSettingsService.changeMapLockValue(this.isLocked);
    const dialogRef = this.dialog.open(ProjectMapLockConfirmationDialogComponent, {
      width: '500px',
      maxHeight: '200px',
      autoFocus: false,
      disableClose: true,
      data: { isAction: this.isLocked, actionType: this.isLocked == true ? 'Lock' : 'Unlock' },
    });

    dialogRef.afterClosed().subscribe((confirmAction_result) => {
      if (confirmAction_result && confirmAction_result != '') {
        if (confirmAction_result.actionType == 'Lock' && confirmAction_result.isAction) {
          this.lockAllNode();
        } else {
          this.unlockAllNode();
        }
      } else {
      }
    });
  }

  lockAllNode() {
    this.lock = 'lock';
    this.drawingService.lockAllNodes(this.controller, this.project).subscribe((res) => {
      this.getAllNodesAndDrawingStatus();
    });
  }

  unlockAllNode() {
    this.lock = 'lock_open';
    this.drawingService.unLockAllNodes(this.controller, this.project).subscribe((res) => {
      this.getAllNodesAndDrawingStatus();
    });
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
        .add(this.controller, this.project.project_id, -(imageToUpload.width / 2), -(imageToUpload.height / 2), svg)
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

  ngOnDestroy() {
    // this.projectSubscription.unsubscribe();
  }
}
