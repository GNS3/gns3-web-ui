import { OverlayContainer } from '@angular/cdk/overlay';
import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ThemeService } from '../../services/theme.service';
import { Subscription } from 'rxjs';
import { Project } from '../../models/project';
import { Server } from '../../models/server';
import { Template } from '../../models/template';
import { MapScaleService } from '../../services/mapScale.service';
import { SymbolService } from '../../services/symbol.service';
import { TemplateService } from '../../services/template.service';
import { NodeAddedEvent, TemplateListDialogComponent } from './template-list-dialog/template-list-dialog.component';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
  selector: 'app-template',
  templateUrl: './template.component.html',
  styleUrls: ['./template.component.scss'],
})
export class TemplateComponent implements OnInit, OnDestroy {
  @Input() controller: Server;
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

  movementX: number;
  movementY: number;

  startX: number;
  startY: number;

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

  dragStart(ev) {
    let elemRect = (event.target as HTMLElement).getBoundingClientRect();

    this.startX = (event as MouseEvent).clientX;
    this.startY = (event as MouseEvent).clientY;

    this.movementY = elemRect.top - (event as MouseEvent).clientY;
    this.movementX = elemRect.left - (event as MouseEvent).clientX;
  }

  dragEnd(ev, template: Template) {
    this.symbolService.raw(this.controller, template.symbol.substring(1)).subscribe((symbolSvg: string) => {
      let width = +symbolSvg.split('width="')[1].split('"')[0] ? +symbolSvg.split('width="')[1].split('"')[0] : 0;
      let scale = this.scaleService.getScale();

      let nodeAddedEvent: NodeAddedEvent = {
        template: template,
        controller: 'local',
        numberOfNodes: 1,
        x: (this.startX + ev.x - this.project.scene_width / 2 - width / 2) * scale + window.scrollX,
        y: (this.startY + ev.y - this.project.scene_height / 2) * scale + window.scrollY,
      };
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
