import { OverlayContainer } from '@angular/cdk/overlay';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  OnDestroy,
  OnInit,
  Output,
  inject,
  input,
  Inject,
  signal,
} from '@angular/core';
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
import { DOCUMENT } from '@angular/common';

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

  // Expose body element for drag ghost element
  readonly bodyElement: HTMLElement;

  constructor(@Inject(DOCUMENT) private document: Document) {
    this.overlay = this.overlayContainer.getContainerElement();
    this.bodyElement = this.document.body;
  }
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

  // Track mouse position during drag using signals (zoneless compatible)
  private lastPageX = signal<number>(0);
  private lastPageY = signal<number>(0);
  private isDragging = signal<boolean>(false);

  // Track mouse offset from the icon's top-left corner for natural placement
  private mouseOffsetX: number = 0;
  private mouseOffsetY: number = 0;

  // Store the element being dragged to calculate offset
  private dragElement: HTMLElement | null = null;

  private subscription: Subscription;
  private themeSubscription: Subscription;
  private isLightThemeEnabled: boolean = false;

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

  dragStart(ev: any, template: Template) {
    // mwlDraggable's DragStartEvent doesn't contain mouse position data
    // Use window.event (the browser's global event) to access mouse position
    const mouseEvent = window.event as MouseEvent | undefined;
    const clientX = mouseEvent?.clientX || 0;
    const clientY = mouseEvent?.clientY || 0;

    // Get the element being dragged
    const sourceEl = mouseEvent?.target as HTMLElement | undefined;
    if (sourceEl) {
      const elemRect = sourceEl.getBoundingClientRect();
      // Calculate the offset of the mouse from the icon's top-left corner
      // This ensures the node maintains the same relative position when dropped
      this.mouseOffsetX = clientX - elemRect.left;
      this.mouseOffsetY = clientY - elemRect.top;
      this.dragElement = sourceEl;
    }

    // Start tracking mouse position to get the final drop position
    this.isDragging.set(true);
    this.lastPageX.set(clientX);
    this.lastPageY.set(clientY);

    // Add document-level mouse move listener to track position during drag
    const trackMouseMove = (e: MouseEvent) => {
      if (this.isDragging()) {
        this.lastPageX.set(e.clientX);
        this.lastPageY.set(e.clientY);
      }
    };

    // Add one-time mouseup listener to stop tracking
    const stopTracking = () => {
      this.isDragging.set(false);
      document.removeEventListener('mousemove', trackMouseMove);
      document.removeEventListener('mouseup', stopTracking);
    };

    document.addEventListener('mousemove', trackMouseMove);
    document.addEventListener('mouseup', stopTracking, { once: true });
  }

  dragEnd(ev: any, template: Template) {
    // Calculate coordinates directly without unnecessary HTTP request
    const pageX = this.lastPageX();
    const pageY = this.lastPageY();

    // Use scene dimensions as fallback for context size
    const centerX = this.context.size.width > 0 ? this.context.size.width / 2 : this.project().scene_width / 2;
    const centerY = this.context.size.height > 0 ? this.context.size.height / 2 : this.project().scene_height / 2;

    // Convert screen coordinates to world coordinates using D3 transformation
    const worldX = (pageX - (centerX + this.context.transformation.x)) / this.context.transformation.k;
    const worldY = (pageY - (centerY + this.context.transformation.y)) / this.context.transformation.k;

    // Subtract the mouse offset to position the node correctly
    // The offset represents where the mouse was relative to the icon's top-left when dragging started
    const finalX = Math.round(worldX - this.mouseOffsetX);
    const finalY = Math.round(worldY - this.mouseOffsetY);

    const nodeAddedEvent: NodeAddedEvent = {
      template: template,
      controller: 'local',
      numberOfNodes: 1,
      x: finalX,
      y: finalY,
    };

    this.onNodeCreation.emit(nodeAddedEvent);
  }

  openDialog() {
    const dialogRef = this.dialog.open(TemplateListDialogComponent, {
      width: '600px',
      data: {
        controller: this.controller(),
        project: this.project(),
      },
      autoFocus: false,
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
