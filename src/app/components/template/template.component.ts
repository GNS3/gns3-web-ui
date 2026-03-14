import { OverlayContainer } from '@angular/cdk/overlay';
import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ThemeService } from '@services/theme.service';
import { Subscription } from 'rxjs';
import { NgZone } from '@angular/core';
import { Project } from '@models/project';
import { Controller } from '@models/controller';
import { Template } from '@models/template';
import { MapScaleService } from '@services/mapScale.service';
import { SymbolService } from '@services/symbol.service';
import { TemplateService } from '@services/template.service';
import { NodeAddedEvent, TemplateListDialogComponent } from './template-list-dialog/template-list-dialog.component';
import { DomSanitizer } from '@angular/platform-browser';
import { Context } from '../../cartography/models/context';

@Component({
  selector: 'app-template',
  templateUrl: './template.component.html',
  styleUrls: ['./template.component.scss'],
})
export class TemplateComponent implements OnInit, OnDestroy {
  @Input() controller: Controller;
  @Input() project: Project;
  @Output() onNodeCreation = new EventEmitter<any>();
  overlay;
  templates: Template[] = [];
  filteredTemplates: Template[] = [];
  searchText: string = '';
  templateTypes: string[] = [
    'all',
    'cloud',
    'ethernet_hub',
    'ethernet_switch',
    'docker',
    'dynamips',
    'vpcs',
    'virtualbox',
    'vmware',
    'iou',
    'qemu',
  ];
  selectedType: string;

  // Track mouse position during drag
  private lastPageX: number = 0;
  private lastPageY: number = 0;
  private isDragging: boolean = false;

  // Track mouse offset from the icon's top-left corner
  private mouseOffsetX: number = 0;
  private mouseOffsetY: number = 0;

  private subscription: Subscription;
  private themeSubscription: Subscription;
  private isLightThemeEnabled: boolean = false;

  constructor(
    private dialog: MatDialog,
    private templateService: TemplateService,
    private scaleService: MapScaleService,
    private symbolService: SymbolService,
    private domSanitizer: DomSanitizer,
    private themeService: ThemeService,
    private overlayContainer: OverlayContainer,
    private context: Context,
    private ngZone: NgZone,
  ) {
    this.overlay = overlayContainer.getContainerElement();
  }

  ngOnInit() {
    this.subscription = this.templateService.newTemplateCreated.subscribe((template: Template) => {
      this.templates.push(template);
    });

    this.templateService.list(this.controller).subscribe((listOfTemplates: Template[]) => {
      this.filteredTemplates = listOfTemplates;
      this.sortTemplates();
      this.templates = listOfTemplates;
    });
    this.symbolService.list(this.controller);
    if (this.themeService.getActualTheme()  === 'light') this.isLightThemeEnabled = true;
    this.themeSubscription = this.themeService.themeChanged.subscribe((value: string) => {
      if (value === 'light-theme') this.isLightThemeEnabled = true;
      this.toggleTheme();
    });
  }

  toggleTheme(): void {
    if (this.overlay.classList.contains("dark-theme")) {
        this.overlay.classList.remove("dark-theme");
        this.overlay.classList.add("light-theme");
    } else if (this.overlay.classList.contains("light-theme")) {
        this.overlay.classList.remove("light-theme");
        this.overlay.classList.add("dark-theme");
    } else {
        this.overlay.classList.add("light-theme");
    }
  }

  sortTemplates() {
    this.filteredTemplates = this.filteredTemplates.sort((a, b) => (a.name < b.name ? -1 : 1));
  }

  filterTemplates(event) {
    let temporaryTemplates = this.templates.filter((item) => {
      return item.name.toLowerCase().includes(this.searchText.toLowerCase());
    });

    if (this.selectedType === 'all' || !this.selectedType) {
      this.filteredTemplates = temporaryTemplates;
    } else {
      this.filteredTemplates = temporaryTemplates.filter((t) => t.template_type === this.selectedType);
    }
    this.sortTemplates();
  }

  dragStart(ev, template: Template) {
    const elemRect = (event.target as HTMLElement).getBoundingClientRect();

    // Calculate the offset of the mouse from the icon's top-left corner
    // This ensures the node maintains the same relative position when dropped
    this.mouseOffsetX = (event as MouseEvent).clientX - elemRect.left;
    this.mouseOffsetY = (event as MouseEvent).clientY - elemRect.top;

    // Start tracking mouse position outside Angular zone to prevent excessive change detection
    this.ngZone.runOutsideAngular(() => {
      this.isDragging = true;
      const trackMouseMove = (e: MouseEvent) => {
        if (this.isDragging) {
          this.lastPageX = e.pageX;
          this.lastPageY = e.pageY;
        }
      };
      window.addEventListener('mousemove', trackMouseMove);
      window.addEventListener('mouseup', () => {
        this.isDragging = false;
        window.removeEventListener('mousemove', trackMouseMove);
      }, { once: true });
    });
  }

  dragEnd(ev, template: Template) {
    // Calculate coordinates directly without unnecessary HTTP request
    const pageX = this.lastPageX;
    const pageY = this.lastPageY;

    // Use scene dimensions as fallback for context size
    const centerX = this.context.size.width > 0 ? this.context.size.width / 2 : this.project.scene_width / 2;
    const centerY = this.context.size.height > 0 ? this.context.size.height / 2 : this.project.scene_height / 2;

    // Convert screen coordinates to world coordinates using D3 transformation
    const worldX = (pageX - (centerX + this.context.transformation.x)) / this.context.transformation.k;
    const worldY = (pageY - (centerY + this.context.transformation.y)) / this.context.transformation.k;

    // Subtract the mouse offset to position the node correctly
    // The offset represents where the mouse was relative to the icon's top-left when dragging started
    const finalX = Math.round(worldX - this.mouseOffsetX);
    const finalY = Math.round(worldY - this.mouseOffsetY);

    let nodeAddedEvent: NodeAddedEvent = {
      template: template,
      controller: 'local',
      numberOfNodes: 1,
      x: finalX,
      y: finalY,
    };

    // Emit event inside Angular zone to ensure proper change detection
    this.ngZone.run(() => {
      this.onNodeCreation.emit(nodeAddedEvent);
    });
  }

  openDialog() {
    const dialogRef = this.dialog.open(TemplateListDialogComponent, {
      width: '600px',
      data: {
        controller: this.controller,
        project: this.project,
      },
      autoFocus: false,
      disableClose: true,
    });

    dialogRef.afterClosed().subscribe((nodeAddedEvent: NodeAddedEvent) => {
      if (nodeAddedEvent !== null) {
        this.onNodeCreation.emit(nodeAddedEvent);
      }
    });
  }

  getImageSourceForTemplate(template: Template) {
    return this.symbolService.getSymbolFromTemplate(this.controller, template);
    // let symbol = this.symbolService.getSymbolFromTemplate(template);
    // if (symbol) return this.domSanitizer.bypassSecurityTrustUrl(`data:image/svg+xml;base64,${btoa(symbol.raw)}`);
    // return this.domSanitizer.bypassSecurityTrustUrl('data:image/svg+xml;base64,');
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }
}
