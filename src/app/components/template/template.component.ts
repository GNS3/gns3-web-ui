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
  effect,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { Subscription } from 'rxjs';
import { forkJoin } from 'rxjs';
import { Project } from '@models/project';
import { Controller } from '@models/controller';
import { Template } from '@models/template';
import { SymbolService } from '@services/symbol.service';
import { TemplateService } from '@services/template.service';
import {
  NodeAddedEvent,
  TemplateDragStartRequest,
  TemplateListDialogComponent,
} from './template-list-dialog/template-list-dialog.component';
import { Context } from '../../cartography/models/context';
import { DOCUMENT } from '@angular/common';
import { ComputeService } from '@services/compute.service';
import { Compute } from '@models/compute';
import { ComputeSelectorComponent } from './compute-selector/compute-selector.component';
import { NotificationService } from '@services/notification.service';
import { ToasterService } from '@services/toaster.service';

export interface CreatingNodeState {
  id: string;
  template: Template;
  x: number;
  y: number;
  numberOfNodes: number;
  computeId: string | null;
  status: 'waiting_for_compute' | 'creating' | 'success' | 'error';
  errorMessage?: string;
}

@Component({
  selector: 'app-template',
  templateUrl: './template.component.html',
  styleUrl: './template.component.scss',
  imports: [CommonModule, MatDialogModule, MatIconModule, MatButtonModule, ComputeSelectorComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TemplateComponent implements OnInit, OnDestroy {
  private dialog = inject(MatDialog);
  private templateService = inject(TemplateService);
  private symbolService = inject(SymbolService);
  private context = inject(Context);
  private cd = inject(ChangeDetectorRef);
  private computeService = inject(ComputeService);
  private notificationService = inject(NotificationService);
  private toasterService = inject(ToasterService);

  readonly controller = input<Controller>(undefined);
  readonly project = input<Project>(undefined);
  @Output() nodeCreationChange = new EventEmitter<any>();
  templates: Template[] = [];

  // Store blob URLs for template symbols to enable JWT authentication
  templateSymbolBlobUrls = new Map<string, string>();

  private addNodesDialogRef?: MatDialogRef<TemplateListDialogComponent>;

  constructor(@Inject(DOCUMENT) private document: Document) {}

  // Track mouse position during drag using signals (zoneless compatible)
  private lastPageX = signal<number>(0);
  private lastPageY = signal<number>(0);
  private dragStartClientX = 0;
  private dragStartClientY = 0;
  private isDragging = signal<boolean>(false);

  // Track mouse offset from the icon's top-left corner for natural placement
  private mouseOffsetX: number = 0;
  private mouseOffsetY: number = 0;

  private activeTemplateDrag?: {
    template: Template;
    numberOfNodes: number;
    computeId?: string;
  };
  private removeNativeDragListeners?: () => void;

  // Compute selector state
  showComputeSelector = signal<boolean>(false);
  availableComputes = signal<Compute[]>([]);
  pendingNodePosition = signal<{ x: number; y: number } | null>(null);
  pendingTemplate = signal<Template | null>(null);
  cachedComputes = signal<Compute[]>([]);

  // Track multiple nodes being created concurrently
  creatingNodes = signal<Map<string, CreatingNodeState>>(new Map());
  pendingCreationId = signal<string | null>(null);

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
  }

  private loadTemplates() {
    this.templateService.list(this.controller()).subscribe({
      next: (listOfTemplates: Template[]) => {
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
        this.addNodesDialogRef?.componentInstance.refreshSymbolImages();
        this.cd.markForCheck();
      },
      error: (err) => {
        const message = err.error?.message || err.message || 'Failed to load template symbols';
        this.toasterService.error(message);
        this.cd.markForCheck();
      },
    });
  }

  dragStart(ev: DragEvent, template: Template, numberOfNodes = 1, computeId?: string) {
    const mouseEvent = ev;
    const clientX = mouseEvent?.clientX || 0;
    const clientY = mouseEvent?.clientY || 0;

    // Get the element being dragged
    const sourceEl = mouseEvent?.currentTarget as HTMLElement | undefined;
    if (sourceEl) {
      const dragImage = sourceEl.querySelector<HTMLElement>('.template-card__image-wrap');
      const dragImageRect = dragImage?.getBoundingClientRect();
      this.mouseOffsetX = dragImageRect ? dragImageRect.width / 2 : 0;
      this.mouseOffsetY = dragImageRect ? dragImageRect.height / 2 : 0;
    }

    // Start tracking mouse position to get the final drop position
    this.isDragging.set(true);
    this.dragStartClientX = clientX;
    this.dragStartClientY = clientY;
    this.lastPageX.set(clientX);
    this.lastPageY.set(clientY);
    this.activeTemplateDrag = { template, numberOfNodes, computeId };

    this.removeNativeDragListeners?.();
    const trackDragOver = (event: DragEvent) => {
      if (!this.activeTemplateDrag) {
        return;
      }
      this.lastPageX.set(event.clientX);
      this.lastPageY.set(event.clientY);
      if (this.isTopologyEventTarget(event.target)) {
        event.preventDefault();
        if (event.dataTransfer) {
          event.dataTransfer.dropEffect = 'copy';
        }
      }
    };
    const finishDrop = (event: DragEvent) => {
      if (!this.activeTemplateDrag || !this.isTopologyEventTarget(event.target)) {
        return;
      }
      event.preventDefault();
      this.lastPageX.set(event.clientX);
      this.lastPageY.set(event.clientY);
      const request = this.activeTemplateDrag;
      this.clearNativeDrag();
      this.dragEnd(undefined, request.template, request.numberOfNodes, request.computeId);
    };
    const cancelDrag = () => this.clearNativeDrag();

    this.document.addEventListener('dragover', trackDragOver, true);
    this.document.addEventListener('drop', finishDrop, true);
    this.document.addEventListener('dragend', cancelDrag, true);
    this.removeNativeDragListeners = () => {
      this.document.removeEventListener('dragover', trackDragOver, true);
      this.document.removeEventListener('drop', finishDrop, true);
      this.document.removeEventListener('dragend', cancelDrag, true);
    };
  }

  private clearNativeDrag(): void {
    this.isDragging.set(false);
    this.activeTemplateDrag = undefined;
    this.removeNativeDragListeners?.();
    this.removeNativeDragListeners = undefined;
  }

  dragEnd(ev: any, template: Template, numberOfNodes = 1, preferredComputeId?: string, requireTopologyTarget = false) {
    // Calculate coordinates directly without unnecessary HTTP request
    const hasDragDelta = Number.isFinite(ev?.x) && Number.isFinite(ev?.y);
    const pageX = hasDragDelta ? this.dragStartClientX + ev.x : this.lastPageX();
    const pageY = hasDragDelta ? this.dragStartClientY + ev.y : this.lastPageY();

    if (ev?.dragCancelled || (requireTopologyTarget && !this.isTopologyDropTarget(pageX, pageY))) {
      return;
    }

    // Use the same origin as the SVG <g> canvas transform (getZeroZeroTransformationPoint)
    // to ensure consistent screen-to-world coordinate conversion. This prevents
    // the canvas from shifting when getSize() recalculates centerX/Y after node creation.
    const origin = this.context.getZeroZeroTransformationPoint();
    const centerX = this.context.size.width > 0 ? origin.x : this.project().scene_width / 2;
    const centerY = this.context.size.height > 0 ? origin.y : this.project().scene_height / 2;

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
          this.processNodeCreation(template, finalX, finalY, loadedComputes, numberOfNodes, preferredComputeId);
        },
        error: (err) => {
          const message = err.error?.message || err.message || 'Failed to load computes';
          this.toasterService.error(message);
          this.cd.markForCheck();
          // Fallback to local on error
          const nodeAddedEvent: NodeAddedEvent = {
            template: template,
            computeId: preferredComputeId || 'local',
            numberOfNodes,
            x: finalX,
            y: finalY,
          };
          this.nodeCreationChange.emit(nodeAddedEvent);
        },
      });
    } else {
      // Use cached data (instant)
      this.processNodeCreation(template, finalX, finalY, computes, numberOfNodes, preferredComputeId);
    }
  }

  private isTopologyDropTarget(clientX: number, clientY: number): boolean {
    return Boolean(this.document.elementFromPoint(clientX, clientY)?.closest('svg#map'));
  }

  private isTopologyEventTarget(target: EventTarget | null): boolean {
    return target instanceof Element && Boolean(target.closest('svg#map'));
  }

  private processNodeCreation(
    template: Template,
    x: number,
    y: number,
    computes: Compute[],
    numberOfNodes: number,
    preferredComputeId?: string
  ) {
    // Filter out unreachable compute nodes
    const connectedComputes = computes.filter((compute) => compute.connected);

    if (connectedComputes.length === 0) {
      // No available compute nodes
      this.toasterService.error(
        'No reachable compute nodes available. Please check your compute nodes connection status.'
      );
      return;
    }

    // ✅ Immediately create independent task
    const creationId = this.generateUniqueId();
    const creatingNode: CreatingNodeState = {
      id: creationId,
      template: template,
      x: x,
      y: y,
      numberOfNodes,
      computeId: null,
      status: 'waiting_for_compute',
    };
    this.addCreatingNode(creatingNode);

    const preferredCompute = connectedComputes.find((compute) => compute.compute_id === preferredComputeId);

    if (preferredCompute) {
      this.startNodeCreation(creationId, preferredCompute.compute_id);
    } else if (connectedComputes.length === 1) {
      // Only one compute node, proceed directly
      this.startNodeCreation(creationId, connectedComputes[0].compute_id);
    } else {
      // Multiple compute nodes, show selector
      this.pendingCreationId.set(creationId);
      // Sort computes: local first, then by name
      const sortedComputes = [...connectedComputes].sort((a, b) => {
        if (a.compute_id === 'local') return -1;
        if (b.compute_id === 'local') return 1;
        return (a.name || '').localeCompare(b.name || '');
      });
      this.availableComputes.set(sortedComputes);
      this.showComputeSelector.set(true);
      this.cd.markForCheck();
    }
  }

  closeComputeSelector() {
    this.showComputeSelector.set(false);
    this.pendingCreationId.set(null);
  }

  onComputeSelected(computeId: string) {
    const creationId = this.pendingCreationId();
    if (!creationId) {
      return;
    }

    // Update the specific task with computeId
    this.updateCreatingNodeCompute(creationId, computeId);

    // Start node creation for this task
    this.startNodeCreation(creationId, computeId);

    // Close selector
    this.closeComputeSelector();
  }

  onComputeSelectorCancelled() {
    const creationId = this.pendingCreationId();
    if (creationId) {
      // Remove the waiting task
      this.removeCreatingNode(creationId);
    }
    this.closeComputeSelector();
  }

  // Helper methods
  private generateUniqueId(): string {
    return `creation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private addCreatingNode(node: CreatingNodeState) {
    const current = new Map(this.creatingNodes());
    current.set(node.id, node);
    this.creatingNodes.set(current);
    this.cd.markForCheck();
  }

  private updateCreatingNodeCompute(creationId: string, computeId: string) {
    const current = new Map(this.creatingNodes());
    const node = current.get(creationId);
    if (node) {
      node.computeId = computeId;
      node.status = 'creating';
      current.set(creationId, node);
      this.creatingNodes.set(current);
      this.cd.markForCheck();
    }
  }

  private updateCreatingNodeStatus(creationId: string, status: 'success' | 'error', errorMessage?: string) {
    const current = new Map(this.creatingNodes());
    const node = current.get(creationId);
    if (node) {
      node.status = status;
      node.errorMessage = errorMessage;
      current.set(creationId, node);
      this.creatingNodes.set(current);
      this.cd.markForCheck();
    }
  }

  private removeCreatingNode(creationId: string) {
    const current = new Map(this.creatingNodes());
    current.delete(creationId);
    this.creatingNodes.set(current);
    this.cd.markForCheck();
  }

  private getCreatingNodeScreenPosition(node: CreatingNodeState) {
    const k = this.context.transformation.k;
    const zeroZero = this.context.getZeroZeroTransformationPoint();

    const screenX = node.x * k + zeroZero.x + this.context.transformation.x;
    const screenY = node.y * k + zeroZero.y + this.context.transformation.y;

    return { x: screenX, y: screenY };
  }

  private startNodeCreation(creationId: string, computeId: string) {
    const node = this.creatingNodes().get(creationId);
    if (!node) {
      return;
    }

    const nodeAddedEvent: NodeAddedEvent = {
      template: node.template,
      computeId,
      numberOfNodes: node.numberOfNodes,
      x: node.x,
      y: node.y,
      creationId: creationId,
    };
    this.nodeCreationChange.emit(nodeAddedEvent);
  }

  // Called by project-map when node creation completes
  onNodeCreated(creationId: string, success: boolean, error?: string) {
    if (success) {
      this.removeCreatingNode(creationId);
      return;
    }

    this.updateCreatingNodeStatus(creationId, 'error', error);
    setTimeout(() => {
      this.removeCreatingNode(creationId);
    }, 3000);
  }

  openDialog() {
    if (this.addNodesDialogRef) {
      return;
    }

    const narrowViewport = this.document.defaultView?.matchMedia?.('(max-width: 720px)')?.matches ?? false;
    const projectHeaderHeight = this.document.documentElement.dataset['density'] === 'compact' ? '48px' : '56px';
    const dialogRef = this.dialog.open(TemplateListDialogComponent, {
      panelClass: ['base-dialog-panel', 'template-dialog-panel', 'add-nodes-dialog-panel'],
      data: {
        controller: this.controller(),
        project: this.project(),
        symbolUrls: this.templateSymbolBlobUrls,
        allowTopologyDrop: !narrowViewport,
      },
      autoFocus: false,
      restoreFocus: false,
      hasBackdrop: narrowViewport,
      position: narrowViewport ? undefined : { top: projectHeaderHeight },
    });
    this.addNodesDialogRef = dialogRef;

    const paletteSubscriptions = new Subscription();
    paletteSubscriptions.add(
      dialogRef.componentInstance.nodeAddRequested.subscribe((event: NodeAddedEvent) => {
        this.nodeCreationChange.emit(event);
      })
    );
    paletteSubscriptions.add(
      dialogRef.componentInstance.templateDragStarted.subscribe((request: TemplateDragStartRequest) => {
        this.dragStart(request.event, request.template, request.numberOfNodes, request.computeId);
      })
    );

    dialogRef.afterClosed().subscribe(() => {
      paletteSubscriptions.unsubscribe();
      this.addNodesDialogRef = undefined;
    });
  }

  getImageSourceForTemplate(template: Template): string {
    return this.templateSymbolBlobUrls.get(template.symbol) || '';
  }

  ngOnDestroy() {
    this.clearNativeDrag();
    this.subscription.unsubscribe();
  }
}
