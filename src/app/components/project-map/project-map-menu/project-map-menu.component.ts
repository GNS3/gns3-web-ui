import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  Output,
  EventEmitter,
  ChangeDetectorRef,
  inject,
  input,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { MatMenuModule } from '@angular/material/menu';
import { DrawingAddedComponent } from '../../drawings-listeners/drawing-added/drawing-added.component';
import { NodeService } from '@services/node.service';
import { Subscription } from 'rxjs';
import * as svg from 'save-svg-as-png';
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
import { ToasterService } from '@services/toaster.service';
import { Screenshot, ScreenshotDialogComponent } from '../screenshot-dialog/screenshot-dialog.component';
import { ProjectMapLockConfirmationDialogComponent } from './project-map-lock-confirmation-dialog/project-map-lock-confirmation-dialog.component';
import { DrawingsDataSource } from '../../../cartography/datasources/drawings-datasource';
import { NodesDataSource } from '../../../cartography/datasources/nodes-datasource';
import { AiChatStore } from '../../../stores/ai-chat.store';
@Component({
  standalone: true,
  selector: 'app-project-map-menu',
  templateUrl: './project-map-menu.component.html',
  styleUrls: ['./project-map-menu.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatDividerModule,
    MatMenuModule,
    DrawingAddedComponent,
  ],
})
export class ProjectMapMenuComponent implements OnInit, OnDestroy {
  private toolsService = inject(ToolsService);
  private mapSettingsService = inject(MapSettingsService);
  private drawingService = inject(DrawingService);
  private symbolService = inject(SymbolService);
  private dialog = inject(MatDialog);
  private themeService = inject(ThemeService);
  private projectServices = inject(ProjectService);
  private nodeService = inject(NodeService);
  private nodesDataSource = inject(NodesDataSource);
  private drawingsDataSource = inject(DrawingsDataSource);
  private aiChatStore = inject(AiChatStore);
  private cdr = inject(ChangeDetectorRef);
  private toaster = inject(ToasterService);
  readonly project = input<Project>(undefined);
  readonly controller = input<Controller>(undefined);
  @Output() aiChatOpened = new EventEmitter<void>();
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
  public isAIChatOpen: boolean = false;
  public isAIMinimized: boolean = false;
  private projectSubscription: Subscription;
  private aiChatStateSubscription: Subscription;

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

    // Subscribe to AI Chat panel state
    this.aiChatStateSubscription = this.aiChatStore.getPanelState().subscribe((panelState) => {
      this.isAIChatOpen = panelState.isOpen;
      this.isAIMinimized = panelState.isMinimized;
      // Trigger change detection for OnPush strategy
      this.cdr.markForCheck();
    });
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
      panelClass: ['base-dialog-panel', 'simple-dialog-panel'],
      autoFocus: false,
      disableClose: true,
    });
    dialogRef.afterClosed().subscribe((result: Screenshot) => {
      if (result) this.saveImage(result);
    });
  }

  private async saveImage(screenshotProperties: Screenshot) {
    const originalSvg = document.getElementById('map');
    const svgClone = originalSvg.cloneNode(true) as SVGElement;

    // Process embedded images (node symbols) to inline SVG content
    await this.processEmbeddedImages(svgClone);

    if (screenshotProperties.filetype === 'png') {
      try {
        svg.saveSvgAsPng(svgClone, `${screenshotProperties.name}.png`);
      } catch (err) {
        console.error('Failed to save PNG:', err);
        this.toaster.error('Failed to save screenshot as PNG');
        throw err;
      }
    } else {
      // Serialize processed SVG and trigger download
      const serializer = new XMLSerializer();
      const svgStr = serializer.serializeToString(svgClone);
      const blob = new Blob([svgStr], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${screenshotProperties.name}.svg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  }

  private async processEmbeddedImages(svgClone: SVGElement): Promise<void> {
    const images = Array.from(svgClone.getElementsByTagName('image'));

    for (let i = 0; i < images.length; i++) {
      const image = images[i];
      const href = image.getAttribute('href') || image.getAttribute('xlink:href');
      if (!href) continue;

      try {
        let svgContent: string;

        // Check if it's a blob URL (cached custom symbols)
        if (href.startsWith('blob:')) {
          // Fetch the blob content directly
          const response = await fetch(href);
          const blob = await response.blob();
          svgContent = await blob.text();
        } else {
          // Server-hosted symbol URL
          const urlParts = href.split('/symbols/');
          if (urlParts.length > 1) {
            const symbolId = urlParts[urlParts.length - 1].replace('/raw', '');
            const rawSvg = await this.symbolService.raw(this.controller(), symbolId).toPromise();
            if (rawSvg) {
              svgContent = rawSvg.includes('-->') ? rawSvg.split('-->')[1].trim() : rawSvg.trim();
            }
          }
        }

        if (svgContent) {
          // Parse the SVG content and import it
          const parser = new DOMParser();
          const svgDoc = parser.parseFromString(svgContent, 'image/svg+xml');
          const importedSvg = svgDoc.documentElement;
          let importedNode = svgClone.ownerDocument.importNode(importedSvg, true) as unknown as SVGElement;

          // Ensure the imported node is a proper SVG element with correct namespace
          if (importedNode.nodeName !== 'svg') {
            // Wrapped in a non-svg element (e.g., from parser), create svg manually
            const svgWrapper = svgClone.ownerDocument.createElementNS('http://www.w3.org/2000/svg', 'svg');
            svgWrapper.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
            // Copy all children
            while (importedNode.firstChild) {
              svgWrapper.appendChild(importedNode.firstChild);
            }
            importedNode = svgWrapper;
          }

          // Preserve viewport attributes from the original <image> element
          const width = image.getAttribute('width');
          const height = image.getAttribute('height');
          importedNode.setAttribute('width', width || '60');
          importedNode.setAttribute('height', height || '60');
          importedNode.setAttribute('x', image.getAttribute('x') || '0');
          importedNode.setAttribute('y', image.getAttribute('y') || '0');

          image.parentNode.replaceChild(importedNode, image);
        }
      } catch (err) {
        console.warn(`Failed to process embedded image: ${href}`, err);
      }
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
    this.projectServices.getProjectStatus(this.controller(), this.project().project_id).subscribe((status) => {
      if (status) {
        this.isLocked = true;
        this.lock = 'lock';
      } else {
        this.isLocked = false;
        this.lock = 'lock_open';
      }
    });
    this.projectServices.nodes(this.controller(), this.project().project_id).subscribe((response) => {
      this.nodes = response;
      this.nodes.forEach((node) => {
        this.nodeService.updateNode(this.controller(), node).subscribe((node) => {
          this.nodesDataSource.update(node);
        });
      });
    });

    this.projectServices.drawings(this.controller(), this.project().project_id).subscribe((response) => {
      this.drawing = response;
      this.drawing.forEach((drawing) => {
        this.drawingService.update(this.controller(), drawing).subscribe((drawing) => {
          this.drawingsDataSource.update(drawing);
        });
      });
    });
  }

  public changeLockValue() {
    this.isLocked = !this.isLocked;
    this.mapSettingsService.changeMapLockValue(this.isLocked);
    const dialogRef = this.dialog.open(ProjectMapLockConfirmationDialogComponent, {
      panelClass: ['base-confirmation-dialog-panel', 'confirmation-warning-panel'],
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
    this.drawingService.lockAllNodes(this.controller(), this.project()).subscribe((res) => {
      this.getAllNodesAndDrawingStatus();
    });
  }

  unlockAllNode() {
    this.lock = 'lock_open';
    this.drawingService.unLockAllNodes(this.controller(), this.project()).subscribe((res) => {
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
        .add(this.controller(), this.project().project_id, -(imageToUpload.width / 2), -(imageToUpload.height / 2), svg)
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
    if (this.aiChatStateSubscription) {
      this.aiChatStateSubscription.unsubscribe();
    }
  }

  /**
   * Open AI Chat panel
   */
  public openAIChat() {
    if (!this.project() || !this.controller()) {
      return;
    }

    if (!this.isAIChatOpen) {
      // First click: open the panel (emit event to parent)
      this.aiChatOpened.emit();
    } else if (this.isAIMinimized) {
      // Panel is minimized: restore it
      this.aiChatStore.restorePanel();
    } else {
      // Panel is open: minimize it
      this.aiChatStore.minimizePanel();
    }
  }
}
