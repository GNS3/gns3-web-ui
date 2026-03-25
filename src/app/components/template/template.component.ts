import { OverlayContainer } from '@angular/cdk/overlay';
import { ChangeDetectionStrategy, Component, EventEmitter, OnDestroy, OnInit, Output, inject, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatListModule } from '@angular/material/list';
import { DragAndDropModule } from 'angular-draggable-droppable';
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
  selector: 'app-template',
  templateUrl: './template.component.html',
  styleUrl: './template.component.scss',
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatOptionModule,
    MatListModule,
    DragAndDropModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TemplateComponent implements OnInit, OnDestroy {
  private dialog = inject(MatDialog);
  private templateService = inject(TemplateService);
  private symbolService = inject(SymbolService);
  private domSanitizer = inject(DomSanitizer);
  private themeService = inject(ThemeService);
  private overlayContainer = inject(OverlayContainer);
  private context = inject(Context);

  readonly controller = input<Controller>(undefined);
  readonly project = input<Project>(undefined);
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

  constructor() {
    this.overlay = this.overlayContainer.getContainerElement();
  }

  ngOnInit() {
    this.subscription = this.templateService.newTemplateCreated.subscribe((template: Template) => {
      this.templates.push(template);
    });

    this.templateService.list(this.controller()).subscribe((listOfTemplates: Template[]) => {
      this.filteredTemplates = listOfTemplates;
      this.sortTemplates();
      this.templates = listOfTemplates;
    });
    this.symbolService.list(this.controller());
    this.isLightThemeEnabled = this.themeService.getThemeType() === 'light';
    this.themeSubscription = this.themeService.themeChanged.subscribe(() => {
      this.isLightThemeEnabled = this.themeService.getThemeType() === 'light';
    });
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
    this.symbolService.raw(this.controller(), template.symbol.substring(1)).subscribe((symbolSvg: string) => {
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
        controller: this.controller(),
        project: this.project(),
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
    return this.symbolService.getSymbolFromTemplate(this.controller(), template);
    // let symbol = this.symbolService.getSymbolFromTemplate(template);
    // if (symbol) return this.domSanitizer.bypassSecurityTrustUrl(`data:image/svg+xml;base64,${btoa(symbol.raw)}`);
    // return this.domSanitizer.bypassSecurityTrustUrl('data:image/svg+xml;base64,');
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }
}
