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
import { DrawingsEventSource } from '../../../cartography/events/drawings-event-source';
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
  private drawingsEventSource = inject(DrawingsEventSource);
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
    isCurveChosen: false,
    isTextChosen: false,
  };
  public isLocked: boolean = false;
  public isLightThemeEnabled: boolean = false;
  public isAIChatOpen: boolean = false;
  public isAIMinimized: boolean = false;
  private projectSubscriptions: Subscription[] = [];
  private aiChatStateSubscription: Subscription;

  ngOnInit() {
    this.themeService.getActualTheme() === 'light'
      ? (this.isLightThemeEnabled = true)
      : (this.isLightThemeEnabled = false);
    this.projectSubscriptions.push(
      this.projectServices.projectLockIconSubject.subscribe((isRedraw: boolean) => {
        if (isRedraw) {
          this.getAllNodesAndDrawingStatus();
        }
      })
    );
    this.getAllNodesAndDrawingStatus();

    // Subscribe to drawing completed event to reset tool state
    this.projectSubscriptions.push(
      this.drawingsEventSource.drawingCompleted.subscribe((toolType) => {
        if (toolType === 'curve') {
          this.resetDrawToolChoice();
        }
      })
    );

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

    // Apply computed background from .project-map to the SVG clone
    // This ensures the background is captured when exporting to PNG
    const projectMap = document.querySelector('.project-map') as HTMLElement;
    if (projectMap) {
      const background = this.resolveBackground(projectMap);
      if (background) {
        svgClone.style.background = background;
      }

      // Resolve CSS custom properties to actual colors for both PNG and SVG export
      const canvasColors = this.getCanvasColors(projectMap);
      this.applyCanvasColors(svgClone, canvasColors.label, canvasColors.link);
    }

    // Process embedded images (node symbols) to inline SVG content
    await this.processEmbeddedImages(svgClone);

    // For SVG export, resolve all remaining CSS variables to computed values
    // This ensures exported SVG works standalone without external CSS dependencies
    if (screenshotProperties.filetype === 'svg') {
      this.resolveAllCssVariables(svgClone, projectMap);
    }

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
      let linkAdded = false;

      try {
        link.href = url;
        link.download = `${screenshotProperties.name}.svg`;
        document.body.appendChild(link);
        linkAdded = true;
        link.click();
      } catch (err) {
        console.error('Failed to save SVG:', err);
        this.toaster.error('Failed to save screenshot as SVG');
        throw err;
      } finally {
        // Clean up resources even if an error occurs
        if (linkAdded) {
          document.body.removeChild(link);
        }
        URL.revokeObjectURL(url);
      }
    }
  }

  /**
   * Resolve the background of .project-map to an actual color/gradient string.
   * Uses getComputedStyle to properly resolve CSS custom properties.
   */
  private resolveBackground(projectMap: HTMLElement): string | null {
    const computedStyle = window.getComputedStyle(projectMap);

    // Try to get resolved background color/gradient
    const computedBg = computedStyle.background;
    if (computedBg && computedBg !== 'none') return computedBg;

    // Fallback: check inline style for --gns3-map-bg variable
    const inlineBg = projectMap.style.getPropertyValue('--gns3-map-bg');
    if (inlineBg && inlineBg.startsWith('var(--')) {
      // Extract variable name and resolve it
      const varName = inlineBg.slice(4, -1); // Remove 'var(' and ')'
      const resolved = computedStyle.getPropertyValue(varName).trim();
      if (resolved) return resolved;
    }

    return null;
  }

  /**
   * Get resolved canvas colors from CSS custom properties.
   * Uses getComputedStyle to properly resolve CSS variable values.
   */
  private getCanvasColors(element: HTMLElement): { label: string; link: string } {
    const computedStyle = window.getComputedStyle(element);
    const labelColor = computedStyle.getPropertyValue('--gns3-canvas-label-color').trim();
    const linkColor = computedStyle.getPropertyValue('--gns3-canvas-link-color').trim();
    return { label: labelColor, link: linkColor };
  }

  /**
   * Apply resolved canvas colors to SVG elements as inline CSS.
   * This ensures colors are preserved when SVG is cloned/exported.
   */
  private applyCanvasColors(svgClone: SVGElement, labelColor: string, linkColor: string): void {
    // Apply label colors to text elements
    const textElements = svgClone.querySelectorAll('text.label');
    textElements.forEach((text) => {
      const textEl = text as SVGTextElement;
      textEl.style.setProperty('fill', labelColor);
    });

    // Apply link colors to ethernet links (preserve custom colors)
    // D3.js sets stroke via attr() which creates SVG attribute (not inline style).
    // Custom colors are hex values, default uses CSS variable var(--...).
    const linkElements = svgClone.querySelectorAll('path.ethernet_link');
    linkElements.forEach((link) => {
      const linkEl = link as SVGPathElement;
      const svgStroke = linkEl.getAttribute('stroke');

      // If stroke is CSS variable (default), apply resolved color
      // If stroke is a custom color (hex/rgb), preserve it - do nothing
      if (!svgStroke || svgStroke.startsWith('var(--')) {
        linkEl.style.setProperty('stroke', linkColor);
      }
      // Custom colors are kept as-is
    });
  }

  /**
   * Resolve all CSS variables in SVG elements to their computed values.
   * This ensures the exported SVG works standalone without external CSS dependencies.
   * Only processes var() references, preserving custom colors (hex/rgb).
   */
  private resolveAllCssVariables(svgClone: SVGElement, contextElement: HTMLElement | null): void {
    if (!contextElement) return;

    const computedStyle = window.getComputedStyle(contextElement);

    // Process all SVG elements that may have CSS variables in their styles
    const styledElements = svgClone.querySelectorAll('*[style]');

    styledElements.forEach((element) => {
      const el = element as SVGElement;
      const style = el.getAttribute('style');
      if (!style) return;

      // Find and replace all var(--xxx) references with computed values
      const resolvedStyle = style.replace(/var\(([^)]+)\)/g, (match, varName) => {
        const computedValue = computedStyle.getPropertyValue(varName).trim();
        return computedValue || match;
      });

      // Only update if changes were made
      if (resolvedStyle !== style) {
        el.setAttribute('style', resolvedStyle);
      }
    });

    // Also process SVG attributes that might contain CSS variables (like stroke, fill)
    const svgElements = svgClone.querySelectorAll('*');
    svgElements.forEach((element) => {
      const el = element as SVGElement;
      ['stroke', 'fill', 'color', 'background', 'background-color'].forEach((attr) => {
        const value = el.getAttribute(attr);
        if (value && value.startsWith('var(')) {
          const varName = value.match(/var\(([^)]+)\)/)?.[1];
          if (varName) {
            const computedValue = computedStyle.getPropertyValue(varName).trim();
            if (computedValue) {
              el.setAttribute(attr, computedValue);
            }
          }
        }
      });
    });
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
    // Set cursor on both document element and SVG
    const svgElement = document.getElementById('map');

    if (
      (selectedObject === 'rectangle' && this.drawTools.isRectangleChosen) ||
      (selectedObject === 'ellipse' && this.drawTools.isEllipseChosen) ||
      (selectedObject === 'line' && this.drawTools.isLineChosen) ||
      (selectedObject === 'curve' && this.drawTools.isCurveChosen) ||
      (selectedObject === 'text' && this.drawTools.isTextChosen)
    ) {
      document.documentElement.style.cursor = 'default';
      if (svgElement) {
        svgElement.style.cursor = 'default';
      }
    } else {
      document.documentElement.style.cursor = 'crosshair';
      if (svgElement) {
        svgElement.style.cursor = 'crosshair';
      }
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
      case 'curve':
        this.drawTools.isTextChosen = false;
        this.drawTools.isEllipseChosen = false;
        this.drawTools.isRectangleChosen = false;
        this.drawTools.isLineChosen = false;
        this.drawTools.isCurveChosen = !this.drawTools.isCurveChosen;
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
    // Reset cursor on both document element and SVG
    const svgElement = document.getElementById('map');
    document.documentElement.style.cursor = 'default';
    if (svgElement) {
      svgElement.style.cursor = 'default';
    }

    this.drawTools.isRectangleChosen = false;
    this.drawTools.isEllipseChosen = false;
    this.drawTools.isLineChosen = false;
    this.drawTools.isCurveChosen = false;
    this.drawTools.isTextChosen = false;
    this.selectedDrawing = '';
    this.toolsService.textAddingToolActivation(this.drawTools.isTextChosen);
  }
  getAllNodesAndDrawingStatus() {
    const controller = this.controller();
    const project = this.project();

    if (!controller || !project || !project.project_id) {
      return;
    }

    this.projectServices.getProjectStatus(controller, project.project_id).subscribe({
      next: (status) => {
        if (status) {
          this.isLocked = true;
          this.lock = 'lock';
        } else {
          this.isLocked = false;
          this.lock = 'lock_open';
        }
        this.cdr.markForCheck();
      },
      error: (err) => {
        const message = err.error?.message || err.message || 'Failed to get project status';
        this.toaster.error(message);
        this.cdr.markForCheck();
      },
    });
    this.projectServices.nodes(controller, project.project_id).subscribe({
      next: (response) => {
        this.nodes = response;
        this.nodes.forEach((node) => {
          this.nodeService.updateNode(controller, node).subscribe({
            next: (node) => {
              this.nodesDataSource.update(node);
            },
            error: (err) => {
              const message = err.error?.message || err.message || 'Failed to update node';
              this.toaster.error(message);
              this.cdr.markForCheck();
            },
          });
        });
      },
      error: (err) => {
        const message = err.error?.message || err.message || 'Failed to load nodes';
        this.toaster.error(message);
        this.cdr.markForCheck();
      },
    });

    this.projectServices.drawings(this.controller(), this.project().project_id).subscribe({
      next: (response) => {
        this.drawing = response;
        this.drawing.forEach((drawing) => {
          this.drawingService.update(this.controller(), drawing).subscribe({
            next: (drawing) => {
              this.drawingsDataSource.update(drawing);
            },
            error: (err) => {
              const message = err.error?.message || err.message || 'Failed to update drawing';
              this.toaster.error(message);
              this.cdr.markForCheck();
            },
          });
        });
      },
      error: (err) => {
        const message = err.error?.message || err.message || 'Failed to load drawings';
        this.toaster.error(message);
        this.cdr.markForCheck();
      },
    });
  }

  public changeLockValue() {
    const dialogRef = this.dialog.open(ProjectMapLockConfirmationDialogComponent, {
      panelClass: ['base-confirmation-dialog-panel', 'confirmation-warning-panel'],
      autoFocus: false,
      disableClose: true,
      data: { actionType: this.isLocked ? 'Unlock' : 'Lock' },
    });

    dialogRef.afterClosed().subscribe((confirmAction_result) => {
      if (confirmAction_result && confirmAction_result != '') {
        if (confirmAction_result.actionType == 'Lock' && confirmAction_result.isAction) {
          this.isLocked = true;
          this.mapSettingsService.changeMapLockValue(this.isLocked);
          this.cdr.markForCheck();
          this.lockAllNode();
        } else {
          this.isLocked = false;
          this.mapSettingsService.changeMapLockValue(this.isLocked);
          this.cdr.markForCheck();
          this.unlockAllNode();
        }
      }
    });
  }

  lockAllNode() {
    this.lock = 'lock';
    this.isLocked = true;
    this.cdr.markForCheck();
    this.drawingService.lockAllNodes(this.controller(), this.project()).subscribe({
      next: (res) => {
        // Ensure update happens in next tick
        setTimeout(() => {
          this.lock = 'lock';
          this.isLocked = true;
          this.cdr.markForCheck();
        });
      },
      error: (err) => {
        const message = err.error?.message || err.message || 'Failed to lock nodes';
        this.toaster.error(message);
        this.cdr.markForCheck();
      },
    });
  }

  unlockAllNode() {
    this.lock = 'lock_open';
    this.isLocked = false;
    this.cdr.markForCheck();
    this.drawingService.unLockAllNodes(this.controller(), this.project()).subscribe({
      next: (res) => {
        // Ensure update happens in next tick
        setTimeout(() => {
          this.lock = 'lock_open';
          this.isLocked = false;
          this.cdr.markForCheck();
        });
      },
      error: (err) => {
        const message = err.error?.message || err.message || 'Failed to unlock nodes';
        this.toaster.error(message);
        this.cdr.markForCheck();
      },
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
        .subscribe({
          next: () => {},
          error: (err) => {
            const message = err.error?.message || err.message || 'Failed to add image';
            this.toaster.error(message);
            this.cdr.markForCheck();
          },
        });
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
    this.projectSubscriptions.forEach(subscription => subscription.unsubscribe());
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
