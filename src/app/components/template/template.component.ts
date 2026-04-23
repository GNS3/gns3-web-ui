import { OverlayContainer } from '@angular/cdk/overlay';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  OnDestroy,
  OnInit,
  Output,
  inject,
  input,
  Inject,
  signal,
  model,
  effect,
  ViewChild,
  computed,
} from '@angular/core';
import { MatMenuTrigger } from '@angular/material/menu';
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
import { forkJoin } from 'rxjs';
import { Project } from '@models/project';
import { Controller } from '@models/controller';
import { Template } from '@models/template';
import { SymbolService } from '@services/symbol.service';
import { TemplateService } from '@services/template.service';
import { NodeAddedEvent, TemplateListDialogComponent } from './template-list-dialog/template-list-dialog.component';
import { DomSanitizer } from '@angular/platform-browser';
import { Context } from '../../cartography/models/context';
import { DOCUMENT } from '@angular/common';
import { ComputeService } from '@services/compute.service';
import { Compute } from '@models/compute';
import { ComputeSelectorComponent } from './compute-selector/compute-selector.component';
import { NotificationService } from '@services/notification.service';
import { ToasterService } from '@services/toaster.service';

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
    ComputeSelectorComponent,
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
  private cd = inject(ChangeDetectorRef);
  private computeService = inject(ComputeService);
  private notificationService = inject(NotificationService);
  private toasterService = inject(ToasterService);

  readonly controller = input<Controller>(undefined);
  readonly project = input<Project>(undefined);
  @Output() nodeCreationChange = new EventEmitter<any>();
  @ViewChild('menuTrigger') menuTrigger!: MatMenuTrigger;
  overlay;
  templates: Template[] = [];
  filteredTemplates: Template[] = [];

  // Store blob URLs for template symbols to enable JWT authentication
  templateSymbolBlobUrls = new Map<string, string>();

  // Expose body element for drag ghost element
  readonly bodyElement: HTMLElement;

  constructor(@Inject(DOCUMENT) private document: Document) {
    this.overlay = this.overlayContainer.getContainerElement();
    this.bodyElement = this.document.body;
  }
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

  // Model signals for two-way binding
  searchText = model('');
  selectedType = model('all');

  // Track mouse position during drag using signals (zoneless compatible)
  private lastPageX = signal<number>(0);
  private lastPageY = signal<number>(0);
  private isDragging = signal<boolean>(false);

  // Track mouse offset from the icon's top-left corner for natural placement
  private mouseOffsetX: number = 0;
  private mouseOffsetY: number = 0;

  // Store the element being dragged to calculate offset
  private dragElement: HTMLElement | null = null;

  // Compute selector state
  showComputeSelector = signal<boolean>(false);
  availableComputes = signal<Compute[]>([]);
  pendingNodePosition = signal<{ x: number; y: number } | null>(null);
  pendingTemplate = signal<Template | null>(null);
  cachedComputes = signal<Compute[]>([]);

  // Ghost icon screen position: converts world coordinates to screen coordinates
  ghostIconScreenPosition = computed(() => {
    const pos = this.pendingNodePosition();
    if (!pos) {
      return { x: 0, y: 0 };
    }

    // Get transformation values
    const k = this.context.transformation.k;
    const zeroZero = this.context.getZeroZeroTransformationPoint();

    // Convert world coordinates to screen coordinates
    // screen = world * scale + center + offset
    const screenX = pos.x * k + zeroZero.x + this.context.transformation.x;
    const screenY = pos.y * k + zeroZero.y + this.context.transformation.y;

    return { x: screenX, y: screenY };
  });

  private subscription: Subscription;
  private themeSubscription: Subscription;
  private isLightThemeEnabled: boolean = false;

  // Watch for controller changes and reload templates when it becomes available
  private controllerWatcher = effect(() => {
    const ctrl = this.controller();
    if (ctrl && ctrl.id && this.templates.length === 0) {
      this.loadTemplates();
    }
  });

  ngOnInit() {
    this.subscription = this.templateService.newTemplateCreated.subscribe((template: Template) => {
      this.templates.push(template);
      // Load the symbol blob for the new template
      this.loadTemplateSymbolBlobs([template]);
      this.cd.markForCheck();
    });

    // Subscribe to compute cache updates
    this.subscription.add(
      this.notificationService.computeCacheUpdated.subscribe((computes: Compute[]) => {
        this.cachedComputes.set(computes);
        this.cd.markForCheck();
      })
    );

    // Load initial computes from cache
    if (this.notificationService.hasCachedData()) {
      this.cachedComputes.set(this.notificationService.getCachedComputes());
    }

    // Only load templates if controller is available
    if (this.controller() && this.controller().id) {
      this.loadTemplates();
    }
    this.symbolService.list(this.controller());
    this.isLightThemeEnabled = this.themeService.getThemeType() === 'light';
    this.themeSubscription = this.themeService.themeChanged.subscribe(() => {
      this.isLightThemeEnabled = this.themeService.getThemeType() === 'light';
    });
  }

  private loadTemplates() {
    this.templateService.list(this.controller()).subscribe({
      next: (listOfTemplates: Template[]) => {
        this.filteredTemplates = listOfTemplates;
        this.sortTemplates();
        this.templates = listOfTemplates;
        this.loadTemplateSymbolBlobs(listOfTemplates);
        this.cd.markForCheck();
      },
      error: (err) => {
        const message = err.error?.message || err.message || 'Failed to load templates';
        this.toasterService.error(message);
        this.cd.markForCheck();
      },
    });
  }

  private loadTemplateSymbolBlobs(templates: Template[]) {
    // Build list of unique symbol paths
    const symbolPathMap = new Map<string, string>();
    templates.forEach((template) => {
      const symbol = template.symbol;
      let path: string;

      if (symbol.startsWith(':/')) {
        // Builtin symbol: e.g., :/symbols/affinity/circle/blue/router.svg
        // Keep the full symbol path including :/ prefix to match API format
        path = `/symbols/${symbol}/raw`;
      } else {
        // Custom symbol: e.g., firefox.svg
        path = `/symbols/${symbol}/raw`;
      }

      symbolPathMap.set(symbol, path);
    });

    // Fetch all blob URLs in parallel
    const uniquePaths = Array.from(symbolPathMap.values());
    forkJoin(uniquePaths.map((path) => this.symbolService.getSymbolBlobUrl(this.controller(), path))).subscribe({
      next: (blobUrls: string[]) => {
        uniquePaths.forEach((path, index) => {
          // Find which symbol this path belongs to
          for (const [symbol, symbolPath] of symbolPathMap.entries()) {
            if (symbolPath === path) {
              this.templateSymbolBlobUrls.set(symbol, blobUrls[index]);
              break;
            }
          }
        });
        this.cd.markForCheck();
      },
      error: (err) => {
        const message = err.error?.message || err.message || 'Failed to load template symbols';
        this.toasterService.error(message);
        this.cd.markForCheck();
      },
    });
  }

  sortTemplates() {
    this.filteredTemplates = this.filteredTemplates.sort((a, b) => (a.name < b.name ? -1 : 1));
  }

  filterTemplates() {
    let temporaryTemplates = this.templates.filter((item) => {
      return item.name.toLowerCase().includes(this.searchText().toLowerCase());
    });

    if (this.selectedType() === 'all' || !this.selectedType()) {
      this.filteredTemplates = temporaryTemplates;
    } else {
      this.filteredTemplates = temporaryTemplates.filter((t) => t.template_type === this.selectedType());
    }
    this.sortTemplates();
  }

  dragStart(ev: any, template: Template) {
    // Close the mat-menu to remove its overlay that blocks focus
    if (this.menuTrigger) {
      this.menuTrigger.closeMenu();
    }

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

    // Get computes from cache (instant, no HTTP request)
    const computes = this.cachedComputes();

    if (computes.length === 0) {
      // No cached data, fallback to HTTP request
      this.computeService.getComputes(this.controller()).subscribe({
        next: (loadedComputes: Compute[]) => {
          // Set to cache for future use
          this.notificationService.setInitialComputes(loadedComputes);
          this.cachedComputes.set(loadedComputes);

          // Now process with loaded data
          this.processNodeCreation(template, finalX, finalY, loadedComputes);
        },
        error: (err) => {
          const message = err.error?.message || err.message || 'Failed to load computes';
          this.toasterService.error(message);
          this.cd.markForCheck();
          // Fallback to local on error
          const nodeAddedEvent: NodeAddedEvent = {
            template: template,
            controller: 'local',
            numberOfNodes: 1,
            x: finalX,
            y: finalY,
          };
          this.nodeCreationChange.emit(nodeAddedEvent);
        },
      });
    } else {
      // Use cached data (instant)
      this.processNodeCreation(template, finalX, finalY, computes);
    }
  }

  private processNodeCreation(template: Template, x: number, y: number, computes: Compute[]) {
    if (computes.length === 1) {
      // Only one compute node, proceed directly
      const nodeAddedEvent: NodeAddedEvent = {
        template: template,
        controller: computes[0].compute_id,
        numberOfNodes: 1,
        x: x,
        y: y,
      };
      this.nodeCreationChange.emit(nodeAddedEvent);
    } else {
      // Multiple compute nodes, show selector
      this.pendingNodePosition.set({ x, y });
      this.pendingTemplate.set(template);
      // Sort computes: local first, then by name
      const sortedComputes = [...computes].sort((a, b) => {
        if (a.compute_id === 'local') return -1;
        if (b.compute_id === 'local') return 1;
        return (a.name || '').localeCompare(b.name || '');
      });
      this.availableComputes.set(sortedComputes);
      this.showComputeSelector.set(true);
      this.cd.markForCheck();
    }
  }

  clearPendingState() {
    this.showComputeSelector.set(false);
    this.pendingNodePosition.set(null);
    this.pendingTemplate.set(null);
  }

  onComputeSelected(computeId: string) {
    const position = this.pendingNodePosition();
    const template = this.pendingTemplate();

    if (position && template) {
      const nodeAddedEvent: NodeAddedEvent = {
        template: template,
        controller: computeId,
        numberOfNodes: 1,
        x: position.x,
        y: position.y,
      };
      this.nodeCreationChange.emit(nodeAddedEvent);
    }

    this.clearPendingState();
  }

  onComputeSelectorCancelled() {
    this.clearPendingState();
  }

  openDialog() {
    const dialogRef = this.dialog.open(TemplateListDialogComponent, {
      panelClass: ['base-dialog-panel', 'template-dialog-panel'],
      data: {
        controller: this.controller(),
        project: this.project(),
      },
      autoFocus: false,
    });

    dialogRef.afterClosed().subscribe((nodeAddedEvent: NodeAddedEvent) => {
      if (nodeAddedEvent !== null) {
        this.nodeCreationChange.emit(nodeAddedEvent);
      }
    });
  }

  getImageSourceForTemplate(template: Template): string {
    return this.templateSymbolBlobUrls.get(template.symbol) || '';
  }

  onMenuClosed() {
    // Menu closed event handler - can be used for cleanup if needed
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }
}
