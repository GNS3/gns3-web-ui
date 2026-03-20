import { OverlayContainer } from '@angular/cdk/overlay';
import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ThemeService } from '@services/theme.service';
import { Subscription } from 'rxjs';
import { Project } from '@models/project';
import { Controller } from '@models/controller';
import { Template } from '@models/template';
import { SymbolService } from '@services/symbol.service';
import { TemplateService } from '@services/template.service';
import { NodeAddedEvent, TemplateListDialogComponent } from './template-list-dialog/template-list-dialog.component';
import { DomSanitizer } from '@angular/platform-browser';
import { Context } from '../../cartography/models/context';

@Component({
  standalone: false,
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

  private startX: number;
  private startY: number;

  private subscription: Subscription;
  private themeSubscription: Subscription;
  private isLightThemeEnabled: boolean = false;

  constructor(
    private dialog: MatDialog,
    private templateService: TemplateService,
    private symbolService: SymbolService,
    private domSanitizer: DomSanitizer,
    private themeService: ThemeService,
    private overlayContainer: OverlayContainer,
    private context: Context,
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
    // mwlDraggable fires a synthetic event; capture the raw clientX/Y from the
    // native event so we can reconstruct the absolute drop position later.
    this.startX = (event as MouseEvent).clientX;
    this.startY = (event as MouseEvent).clientY;
  }

  dragEnd(ev, template: Template) {
    this.symbolService.raw(this.controller, template.symbol.substring(1)).subscribe((symbolSvg: string) => {
      let width = +symbolSvg.split('width="')[1].split('"')[0] ? +symbolSvg.split('width="')[1].split('"')[0] : 0;
      
      // mwlDraggable's DragEndEvent.x/y are displacement deltas, not absolute
      // coordinates. Add to the captured start position to get the final
      // screen position, then convert to canvas coordinates.
      const dropClientX = this.startX + ev.x;
      const dropClientY = this.startY + ev.y;
 
      const svgElement = document.getElementById('map');
      const svgRect = svgElement ? svgElement.getBoundingClientRect() : { left: 0, top: 0 };
      const k = this.context.transformation.k;

      const origin = this.context.getZeroZeroTransformationPoint();
      let nodeAddedEvent: NodeAddedEvent = {
        template: template,
        controller: 'local',
        numberOfNodes: 1,
        x: (dropClientX - svgRect.left - origin.x - this.context.transformation.x) / k - width / 2,
        y: (dropClientY - svgRect.top - origin.y - this.context.transformation.y) / k,
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
