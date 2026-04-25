import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ComponentRef,
  OnDestroy,
  OnInit,
  ViewContainerRef,
  computed,
  inject,
  viewChild,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { MatDialog } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, ParamMap, Router, RouterModule } from '@angular/router';
import { ExportPortableProjectComponent } from '@components/export-portable-project/export-portable-project.component';
import { environment } from 'environments/environment';
import * as Mousetrap from 'mousetrap';
import { forkJoin, from, Observable, Subscription } from 'rxjs';
import { map, mergeMap } from 'rxjs/operators';
import { D3MapComponent } from '../../cartography/components/d3-map/d3-map.component';
import * as d3 from 'd3';
import { MapDrawingToDrawingConverter } from '../../cartography/converters/map/map-drawing-to-drawing-converter';
import { MapLabelToLabelConverter } from '../../cartography/converters/map/map-label-to-label-converter';
import { MapLinkNodeToLinkNodeConverter } from '../../cartography/converters/map/map-link-node-to-link-node-converter';
import { MapLinkToLinkConverter } from '../../cartography/converters/map/map-link-to-link-converter';
import { MapNodeToNodeConverter } from '../../cartography/converters/map/map-node-to-node-converter';
import { DrawingsDataSource } from '../../cartography/datasources/drawings-datasource';
import { LinksDataSource } from '../../cartography/datasources/links-datasource';
import {
  Indexed,
  MapDrawingsDataSource,
  MapLinksDataSource,
  MapNodesDataSource,
  MapSymbolsDataSource,
} from '../../cartography/datasources/map-datasource';
import { NodesDataSource } from '../../cartography/datasources/nodes-datasource';
import {
  DrawingContextMenu,
  InterfaceLabelContextMenu,
  LabelContextMenu,
  LinkContextMenu,
} from '../../cartography/events/event-source';
import { MovingEventSource } from '../../cartography/events/moving-event-source';
import { NodeContextMenu } from '../../cartography/events/nodes';
import { SelectionManager } from '../../cartography/managers/selection-manager';
import { Drawing } from '../../cartography/models/drawing';
import { Label } from '../../cartography/models/label';
import { MapDrawing } from '../../cartography/models/map/map-drawing';
import { MapLabel } from '../../cartography/models/map/map-label';
import { MapLink } from '../../cartography/models/map/map-link';
import { MapNode } from '../../cartography/models/map/map-node';
import { Node } from '../../cartography/models/node';
import { MapChangeDetectorRef } from '../../cartography/services/map-change-detector-ref';
import { SelectionTool } from '../../cartography/tools/selection-tool';
import { DrawingsWidget } from '../../cartography/widgets/drawings';
import { InterfaceLabelWidget } from '../../cartography/widgets/interface-label';
import { LabelWidget } from '../../cartography/widgets/label';
import { LinkWidget } from '../../cartography/widgets/link';
import { EthernetLinkWidget } from '../../cartography/widgets/links/ethernet-link';
import { SerialLinkWidget } from '../../cartography/widgets/links/serial-link';
import { NodeWidget } from '../../cartography/widgets/node';
import { ProgressService } from '../../common/progress/progress.service';
import { ProjectWebServiceHandler } from '../../handlers/project-web-service-handler';
import { Link } from '@models/link';
import { Project } from '@models/project';
import { Controller } from '@models/controller';
import { Symbol } from '@models/symbol';
import { DrawingService } from '@services/drawing.service';
import { LinkService } from '@services/link.service';
import { MapScaleService } from '@services/mapScale.service';
import { MapSettingsService } from '@services/mapsettings.service';
import { NodeService } from '@services/node.service';
import { NodeConsoleService } from '@services/nodeConsole.service';
import { NotificationService } from '@services/notification.service';
import { ProjectService } from '@services/project.service';
import { RecentlyOpenedProjectService } from '@services/recentlyOpenedProject.service';
import { ControllerService } from '@services/controller.service';
import { Settings, SettingsService } from '@services/settings.service';
import { SymbolService } from '@services/symbol.service';
import { ToasterService } from '@services/toaster.service';
import { ToolsService } from '@services/tools.service';
import { ThemeService } from '@services/theme.service';
import { WindowManagementService } from '@services/window-management.service';
import { AddBlankProjectDialogComponent } from '../projects/add-blank-project-dialog/add-blank-project-dialog.component';
import { ConfirmationBottomSheetComponent } from '../projects/confirmation-bottomsheet/confirmation-bottomsheet.component';
import { EditProjectDialogComponent } from '../projects/edit-project-dialog/edit-project-dialog.component';
import { ImportProjectDialogComponent } from '../projects/import-project-dialog/import-project-dialog.component';
import { NavigationDialogComponent } from '../projects/navigation-dialog/navigation-dialog.component';
import { SaveProjectDialogComponent } from '../projects/save-project-dialog/save-project-dialog.component';
import { NodeAddedEvent } from '../template/template-list-dialog/template-list-dialog.component';
import { TopologySummaryComponent } from '../topology-summary/topology-summary.component';
import { ContextMenuComponent } from './context-menu/context-menu.component';
import { NodeCreatedLabelStylesFixer } from './helpers/node-created-label-styles-fixer';
import { NewTemplateDialogComponent } from './new-template-dialog/new-template-dialog.component';
import { ProjectMapMenuComponent } from './project-map-menu/project-map-menu.component';
import { ProjectReadmeComponent } from './project-readme/project-readme.component';
import { AiChatStore } from '../../stores/ai-chat.store';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { AiChatComponent } from './ai-chat/ai-chat.component';
import { ConsoleWrapperComponent } from './console-wrapper/console-wrapper.component';
import { WebWiresharkInlineComponent } from './web-wireshark-inline/web-wireshark-inline.component';
import { WebConsoleInlineComponent } from './web-console-inline/web-console-inline.component';
import { DrawLinkToolComponent } from './draw-link-tool/draw-link-tool.component';
import { ImportApplianceComponent } from './import-appliance/import-appliance.component';
import { NodesMenuComponent } from './nodes-menu/nodes-menu.component';
import { ProgressComponent } from '../../common/progress/progress.component';
import { TemplateComponent } from '../template/template.component';
import { SnapshotMenuItemComponent } from '../snapshots/snapshot-menu-item/snapshot-menu-item.component';
import { DrawingDraggedComponent } from '../drawings-listeners/drawing-dragged/drawing-dragged.component';
import { DrawingResizedComponent } from '../drawings-listeners/drawing-resized/drawing-resized.component';
import { InterfaceLabelDraggedComponent } from '../drawings-listeners/interface-label-dragged/interface-label-dragged.component';
import { LinkCreatedComponent } from '../drawings-listeners/link-created/link-created.component';
import { NodeDraggedComponent } from '../drawings-listeners/node-dragged/node-dragged.component';
import { NodeLabelDraggedComponent } from '../drawings-listeners/node-label-dragged/node-label-dragged.component';
import { TextAddedComponent } from '../drawings-listeners/text-added/text-added.component';
import { TextEditedComponent } from '../drawings-listeners/text-edited/text-edited.component';

@Component({
  selector: 'app-project-map',
  templateUrl: './project-map.component.html',
  styleUrls: ['./project-map.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatCheckboxModule,
    MatIconModule,
    MatMenuModule,
    MatTooltipModule,
    RouterModule,
    D3MapComponent,
    ContextMenuComponent,
    ProjectMapMenuComponent,
    DrawLinkToolComponent,
    NodesMenuComponent,
    SnapshotMenuItemComponent,
    TemplateComponent,
    ImportApplianceComponent,
    ConsoleWrapperComponent,
    AiChatComponent,
    WebWiresharkInlineComponent,
    WebConsoleInlineComponent,
    ProgressComponent,
    DrawingDraggedComponent,
    DrawingResizedComponent,
    InterfaceLabelDraggedComponent,
    LinkCreatedComponent,
    NodeDraggedComponent,
    NodeLabelDraggedComponent,
    TextAddedComponent,
    TextEditedComponent,
  ],
})
export class ProjectMapComponent implements OnInit, OnDestroy {
  public nodes = signal<Node[]>([]);
  public links: Link[] = [];
  public drawings: Drawing[] = [];
  public symbols: Symbol[] = [];
  public project: Project = {} as Project;
  public controller: Controller = {} as Controller;
  public projectws: WebSocket;
  public ws: WebSocket;
  public isProjectMapMenuVisible: boolean = false;
  public isConsoleVisible: boolean = true;
  public isTopologySummaryVisible: boolean = true;
  public isInterfaceLabelVisible: boolean = false;
  public notificationsVisibility: boolean = false;
  public layersVisibility: boolean = false;
  public itemLockStatusVisibility: boolean = false;
  public gridVisibility: boolean = false;
  public toolbarVisibility: boolean = true;
  public symbolScaling: boolean = true;
  public isAIChatVisible: boolean = false;

  // Track multiple Web Wireshark inline windows
  // Key is link_id, value is the Link object
  public webWiresharkInlineWindows = new Map<string, Link>();
  // Track z-index for each window
  public webWiresharkInlineZIndex = new Map<string, number>();
  // Track multiple Web Console inline windows
  // Key is node_id, value is the Node object
  public webConsoleInlineWindows = new Map<string, Node>();
  // Track z-index for each console window
  public webConsoleInlineZIndex = new Map<string, number>();
  // Base z-index for windows
  private baseZIndex = 1000;
  // Counter for generating unique z-indices
  private zIndexCounter = 0;

  // Z-index for console and AI chat windows
  public consoleZIndex: number = this.baseZIndex;
  public aiChatZIndex: number = this.baseZIndex;

  // Taskbar icon positioning
  private readonly TASKBAR_BASE_LEFT = 20;
  private readonly TASKBAR_ICON_WIDTH = 180;
  private readonly TASKBAR_ICON_GAP = 8;

  readonly mapBgClass = computed(() => {
    const mapTheme = this.themeService.savedMapTheme;
    const isDark = mapTheme === 'auto' ? this.themeService.isDarkMode() : mapTheme.startsWith('dark-');

    // Auto mode: use light/dark class instead of auto class
    if (mapTheme === 'auto') {
      const themeType = this.themeService.isDarkMode() ? 'dark' : 'light';
      return {
        [`gns3-map-bg-${themeType}`]: true,
        'project-map--light-bg': !isDark,
        'project-map--dark-bg': isDark,
      };
    }

    return {
      [`gns3-map-bg-${mapTheme}`]: true,
      'project-map--light-bg': !isDark,
      'project-map--dark-bg': isDark,
    };
  });
  private instance: ComponentRef<TopologySummaryComponent>;
  // private instance: any

  tools = {
    selection: true,
    moving: false,
    draw_link: false,
    text_editing: true,
  };

  protected settings: Settings;
  inReadOnlyMode = false;
  readonly contextMenu = viewChild(ContextMenuComponent);
  readonly mapChild = viewChild(D3MapComponent);
  readonly projectMapMenuComponent = viewChild.required(ProjectMapMenuComponent);
  readonly topologySummaryContainer = viewChild.required('topologySummaryContainer', { read: ViewContainerRef });
  readonly templateComponent = viewChild(TemplateComponent);

  private projectMapSubscription: Subscription = new Subscription();

  private route = inject(ActivatedRoute);
  private controllerService = inject(ControllerService);
  private projectService = inject(ProjectService);
  private nodeService = inject(NodeService);
  private linkService = inject(LinkService);
  public drawingService = inject(DrawingService);
  private progressService = inject(ProgressService);
  private projectWebServiceHandler = inject(ProjectWebServiceHandler);
  private mapChangeDetectorRef = inject(MapChangeDetectorRef);
  private nodeWidget = inject(NodeWidget);
  private drawingsWidget = inject(DrawingsWidget);
  private linkWidget = inject(LinkWidget);
  private labelWidget = inject(LabelWidget);
  private interfaceLabelWidget = inject(InterfaceLabelWidget);
  private mapNodeToNode = inject(MapNodeToNodeConverter);
  private mapDrawingToDrawing = inject(MapDrawingToDrawingConverter);
  private mapLabelToLabel = inject(MapLabelToLabelConverter);
  private mapLinkToLink = inject(MapLinkToLinkConverter);
  private mapLinkNodeToLinkNode = inject(MapLinkNodeToLinkNodeConverter);
  private nodesDataSource = inject(NodesDataSource);
  private linksDataSource = inject(LinksDataSource);
  private drawingsDataSource = inject(DrawingsDataSource);
  private settingsService = inject(SettingsService);
  private toolsService = inject(ToolsService);
  private selectionManager = inject(SelectionManager);
  private selectionTool = inject(SelectionTool);
  private recentlyOpenedProjectService = inject(RecentlyOpenedProjectService);
  private movingEventSource = inject(MovingEventSource);
  private mapScaleService = inject(MapScaleService);
  private nodeCreatedLabelStylesFixer = inject(NodeCreatedLabelStylesFixer);
  private toasterService = inject(ToasterService);
  private dialog = inject(MatDialog);
  private router = inject(Router);
  private mapNodesDataSource = inject(MapNodesDataSource);
  private mapLinksDataSource = inject(MapLinksDataSource);
  private mapDrawingsDataSource = inject(MapDrawingsDataSource);
  private mapSymbolsDataSource = inject(MapSymbolsDataSource);
  private mapSettingsService = inject(MapSettingsService);
  private ethernetLinkWidget = inject(EthernetLinkWidget);
  private serialLinkWidget = inject(SerialLinkWidget);
  private bottomSheet = inject(MatBottomSheet);
  private notificationService = inject(NotificationService);
  private title = inject(Title);
  private nodeConsoleService = inject(NodeConsoleService);
  private symbolService = inject(SymbolService);
  private themeService = inject(ThemeService);
  private cd = inject(ChangeDetectorRef);
  private aiChatStore = inject(AiChatStore);
  public windowManagement = inject(WindowManagementService);
  private viewContainerRef = inject(ViewContainerRef);
  // private cfr: ComponentFactoryResolver,
  // private injector: Injector,

  // constructor(private viewContainerRef: ViewContainerRef) {}
  // createMyComponent() {this.viewContainerRef.createComponent(MyComponent);}

  ngOnInit() {
    this.getSettings();
    this.progressService.activate();

    if (this.controllerService.isServiceInitialized) {
      this.getData();
    } else {
      this.projectMapSubscription.add(
        this.controllerService.serviceInitialized.subscribe((val) => {
          if (val) this.getData();
        })
      );
    }

    this.addSubscriptions();
    this.addKeyboardListeners();
  }

  getSettings() {
    this.settings = this.settingsService.getAll();
    this.symbolScaling = this.mapSettingsService.getSymbolScaling();
    this.cd.markForCheck();
    this.isConsoleVisible = this.mapSettingsService.isLogConsoleVisible;
    this.mapSettingsService.logConsoleSubject.subscribe((value) => (this.isConsoleVisible = value));
    this.notificationsVisibility = localStorage.getItem('notificationsVisibility') === 'true' ? true : false;
    this.layersVisibility = localStorage.getItem('layersVisibility') === 'true' ? true : false;
    this.gridVisibility = localStorage.getItem('gridVisibility') === 'true' ? true : false;
  }

  async lazyLoadTopologySummary() {
    if (this.isTopologySummaryVisible) {
      // In zoneless mode, we need to explicitly notify Angular after async operations
      const { TopologySummaryComponent } = await import('../topology-summary/topology-summary.component');
      this.instance = this.topologySummaryContainer().createComponent(TopologySummaryComponent);

      // const componentFactory = this.cfr.resolveComponentFactory(TopologySummaryComponent);
      // this.instance = this.topologySummaryContainer().createComponent(componentFactory, null, this.injector);
      this.instance.instance.controller = this.controller;
      this.instance.instance.project = this.project;
      // In zoneless mode, createComponent doesn't automatically trigger change detection
      // We need to explicitly detect changes to ensure the component is rendered
      this.instance.changeDetectorRef.detectChanges();
    } else if (this.instance) {
      if (this.instance.instance) {
        this.instance.instance.ngOnDestroy();
        this.instance.destroy();
        this.instance = null;
      }
    }
  }

  addSubscriptions() {
    this.projectMapSubscription.add(
      this.drawingsDataSource.changes.subscribe((drawings: Drawing[]) => {
        this.drawings = drawings;
        this.mapChangeDetectorRef.detectChanges();
      })
    );

    // Track previous symbol for each node to detect symbol changes
    const nodeSymbolCache = new Map<string, string>();

    this.projectMapSubscription.add(
      this.nodesDataSource.changes.subscribe((nodes: Node[]) => {
        if (!this.controller) return;

        // Check if symbol changed for any node and invalidate symbol_url if so
        for (const node of nodes) {
          const cachedSymbol = nodeSymbolCache.get(node.node_id);
          if (cachedSymbol !== undefined && cachedSymbol !== node.symbol) {
            // Symbol changed, clear symbol_url so it will be recalculated
            node.symbol_url = null;
          }
          nodeSymbolCache.set(node.node_id, node.symbol);
        }

        const nodesToLoad = nodes.filter((node: Node) => !node.symbol_url);

        // Fetch dimensions for any node with unknown size
        nodesToLoad.forEach((node: Node) => {
          if (node.width == 0 && node.height == 0) {
            this.symbolService.getDimensions(this.controller, node.symbol).subscribe({
              next: (symbolDimensions) => {
                node.width = symbolDimensions.width;
                node.height = symbolDimensions.height;
              },
              error: (err) => {
                console.error('Failed to get symbol dimensions:', err);
              },
            });
          }
        });

        if (nodesToLoad.length === 0) {
          this.nodes.set(nodes);
          if (this.mapSettingsService.getSymbolScaling()) this.applyScalingOfNodeSymbols();
          this.mapChangeDetectorRef.detectChanges();
          return;
        }

        // Build a map from node -> rawUrl for all nodes that need loading
        const nodeRawUrlMap = new Map<Node, string>();
        nodesToLoad.forEach((node: Node) => {
          nodeRawUrlMap.set(node, `/symbols/${node.symbol}/raw`);
        });

        // Deduplicate: only 1 fetch per unique symbol URL (shareReplay(1) in getSymbolBlobUrl handles concurrent callers)
        const uniqueRawUrls = Array.from(new Set(nodeRawUrlMap.values()));
        forkJoin(uniqueRawUrls.map((url) => this.symbolService.getSymbolBlobUrl(this.controller, url))).subscribe(
          (blobUrls: string[]) => {
            const blobUrlMap = new Map(uniqueRawUrls.map((url, i) => [url, blobUrls[i]]));
            nodesToLoad.forEach((node: Node) => {
              node.symbol_url = blobUrlMap.get(nodeRawUrlMap.get(node));
            });
            this.nodes.set(nodes);
            if (this.mapSettingsService.getSymbolScaling()) this.applyScalingOfNodeSymbols();
            this.mapChangeDetectorRef.detectChanges();
          },
          () => {
            // Fallback to raw URLs if blob fetch fails
            nodesToLoad.forEach((node: Node) => {
              node.symbol_url = `${this.controller.protocol}//${this.controller.host}:${this.controller.port}/${
                environment.current_version
              }${nodeRawUrlMap.get(node)}`;
            });
            this.nodes.set(nodes);
            if (this.mapSettingsService.getSymbolScaling()) this.applyScalingOfNodeSymbols();
            this.mapChangeDetectorRef.detectChanges();
          }
        );
      })
    );

    this.projectMapSubscription.add(
      this.linksDataSource.changes.subscribe((links: Link[]) => {
        this.links = links;
        this.mapChangeDetectorRef.detectChanges();
      })
    );

    this.projectMapSubscription.add(
      this.projectWebServiceHandler.errorNotificationEmitter.subscribe((message) => {
        this.showMessage({
          type: 'error',
          message: message,
        });
      })
    );

    this.projectMapSubscription.add(
      this.projectWebServiceHandler.warningNotificationEmitter.subscribe((message) => {
        this.showMessage({
          type: 'warning',
          message: message,
        });
      })
    );

    this.projectMapSubscription.add(
      this.mapSettingsService.symbolScalingSubject.subscribe((value) => {
        if (value) this.applyScalingOfNodeSymbols();
      })
    );
  }

  applyScalingOfNodeSymbols() {
    this.nodesDataSource.getItems().forEach((node) => {
      if (node.height > this.symbolService.getMaximumSymbolSize()) {
        let newDimensions = this.symbolService.scaleDimensionsForNode(node);
        node.width = newDimensions.width;
        node.height = newDimensions.height;
      }
    });
  }

  getData() {
    const routeSub = this.route.paramMap.subscribe((paramMap: ParamMap) => {
      const controller_id = parseInt(paramMap.get('controller_id'), 10);
      const project_id = paramMap.get('project_id');

      if (!project_id) {
        this.router.navigate(['/controllers']);
        return;
      }

      from(this.controllerService.get(controller_id))
        .pipe(
          mergeMap((controller: Controller) => {
            if (!controller) this.router.navigate(['/controllers']);
            this.controller = controller;
            this.cd.markForCheck();
            return this.projectService.get(controller, project_id).pipe(
              map((project) => {
                return project;
              })
            );
          }),
          mergeMap((project: Project) => {
            this.project = project;
            this.cd.markForCheck();
            if (!project || !project.project_id) {
              this.router.navigate(['/controllers']);
              return new Observable<Project>((observer) => observer.complete());
            }

            this.projectService.open(this.controller, this.project.project_id);
            this.title.setTitle(this.project.name);
            this.isInterfaceLabelVisible = this.mapSettingsService.showInterfaceLabels;
            this.toggleShowTopologySummary(this.mapSettingsService.isTopologySummaryVisible);
            const lockKey = `itemLockStatusVisibility_${this.project.project_id}`;
            this.itemLockStatusVisibility = localStorage.getItem(lockKey) === 'true';
            this.mapSettingsService.toggleItemLockStatus(this.itemLockStatusVisibility);

            this.recentlyOpenedProjectService.setcontrollerId(this.controller.id.toString());

            if (this.project.status === 'opened') {
              return new Observable<Project>((observer) => {
                observer.next(this.project);
              });
            } else {
              return this.projectService.open(this.controller, this.project.project_id);
            }
          })
        )
        .subscribe(
          (project: Project) => {
            if (project && project.project_id) {
              this.onProjectLoad(project);
            }
            this.cd.markForCheck();
            if (this.mapSettingsService.openReadme) this.showReadme();
          },
          // Note: Not using error-handler skill pattern because:
          // 1. The error is wrapped by ControllerErrorHandler, so message is at error.message (not err.error?.message)
          // 2. For 404 errors, we redirect to projects page with error message via queryParams since toast won't persist
          (error) => {
            this.progressService.setError(error);
            const message = error?.message || error?.originalError?.message || 'Failed to load project';
            // Redirect to projects page if project not found (404)
            const status = error?.originalError?.status;
            if (status === 404) {
              this.router.navigate(['/controller', controller_id, 'projects'], {
                queryParams: { error: message },
              });
            } else {
              this.toasterService.error(message);
            }
            this.cd.markForCheck();
          },
          () => {
            this.progressService.deactivate();
            this.cd.markForCheck();
          }
        );
    });

    this.projectMapSubscription.add(routeSub);
  }

  addKeyboardListeners() {
    Mousetrap.bind('ctrl++', (event: Event) => {
      event.preventDefault();
      this.zoomIn();
    });

    Mousetrap.bind('ctrl+-', (event: Event) => {
      event.preventDefault();
      this.zoomOut();
    });

    Mousetrap.bind('ctrl+0', (event: Event) => {
      event.preventDefault();
      this.resetZoom();
    });

    Mousetrap.bind('ctrl+a', (event: Event) => {
      event.preventDefault();
      let allNodes: Indexed[] = this.mapNodesDataSource.getItems();
      let allDrawings: Indexed[] = this.mapDrawingsDataSource.getItems();
      let allLinks: Indexed[] = this.mapLinksDataSource.getItems();
      let allSymbols: Indexed[] = this.mapSymbolsDataSource.getItems();
      this.selectionManager.setSelected(allNodes.concat(allDrawings).concat(allLinks).concat(allSymbols));
    });

    Mousetrap.bind('ctrl+h', (event: Event) => {
      event.preventDefault();
      this.toolbarVisibility = !this.toolbarVisibility;
    });

    Mousetrap.bind('ctrl+shift+a', (event: Event) => {
      event.preventDefault();
      this.selectionManager.setSelected([]);
    });

    Mousetrap.bind('ctrl+shift+s', (event: Event) => {
      event.preventDefault();
      this.router.navigate(['/controller', this.controller.id, 'preferences']);
    });

    Mousetrap.bind('del', (event: Event) => {
      event.preventDefault();
      // Note: In zoneless mode, explicit change detection is required
      this.deleteItems();
    });
  }

  deleteItems() {
    const bottomSheetRef = this.bottomSheet.open(ConfirmationBottomSheetComponent, {
      data: { message: 'Do you want to delete all selected objects?' },
      panelClass: 'confirmation-bottom-sheet',
    });
    const bottomSheetSubscription = bottomSheetRef.afterDismissed().subscribe((result: boolean) => {
      if (result) {
        const selected = this.selectionManager.getSelected();

        selected
          .filter((item) => item instanceof MapNode)
          .forEach((item: MapNode) => {
            const node = this.mapNodeToNode.convert(item);
            this.nodeService.delete(this.controller, node).subscribe({
              next: () => this.toasterService.success('Node has been deleted'),
              error: (err) => {
                const message = err.error?.message || err.message || 'Failed to delete node';
                this.toasterService.error(message);
                this.cd.markForCheck();
              },
            });
          });

        selected
          .filter((item) => item instanceof MapLink)
          .forEach((item: MapLink) => {
            const link = this.mapLinkToLink.convert(item);
            this.linkService.deleteLink(this.controller, link).subscribe({
              next: () => this.toasterService.success('Link has been deleted'),
              error: (err) => {
                const message = err.error?.message || err.message || 'Failed to delete link';
                this.toasterService.error(message);
                this.cd.markForCheck();
              },
            });
          });

        selected
          .filter((item) => item instanceof MapDrawing)
          .forEach((item: MapDrawing) => {
            const drawing = this.mapDrawingToDrawing.convert(item);
            this.drawingService.delete(this.controller, drawing).subscribe({
              next: () => this.toasterService.success('Drawing has been deleted'),
              error: (err) => {
                const message = err.error?.message || err.message || 'Failed to delete drawing';
                this.toasterService.error(message);
                this.cd.markForCheck();
              },
            });
          });
      }
    });
  }

  onProjectLoad(project: Project) {
    if (!project || !project.project_id) {
      this.progressService.setError('Invalid project data');
      this.router.navigate(['/controllers']);
      return;
    }

    this.readonly = this.projectService.isReadOnly(project);
    this.recentlyOpenedProjectService.setProjectId(this.project.project_id);

    const subscription = this.projectService
      .nodes(this.controller, project.project_id)
      .pipe(
        mergeMap((nodes: Node[]) => {
          this.nodesDataSource.set(nodes);
          return this.projectService.links(this.controller, project.project_id);
        }),
        mergeMap((links: Link[]) => {
          this.linksDataSource.set(links);
          return this.projectService.drawings(this.controller, project.project_id);
        })
      )
      .subscribe({
        next: (drawings: Drawing[]) => {
          this.drawingsDataSource.set(drawings);

          this.setUpMapCallbacks();
          this.setUpProjectWS(project);

          this.progressService.deactivate();
        },
        error: (err) => {
          this.toasterService.error('Failed to load project data: ' + (err.error?.message || err.message || 'Unknown error'));
          this.progressService.deactivate();
          this.cd.markForCheck();
        },
      });
    this.projectMapSubscription.add(subscription);
  }

  setUpProjectWS(project: Project) {
    this.projectws = new WebSocket(
      this.notificationService.projectNotificationsPath(this.controller, project.project_id)
    );

    this.projectws.onmessage = (event: MessageEvent) => {
      this.projectWebServiceHandler.handleMessage(JSON.parse(event.data));
    };

    this.projectws.onerror = (event: MessageEvent) => {
      this.toasterService.error(`Connection to host lost. Error: ${event.data}`);
    };
  }

  setUpWS() {
    this.ws = new WebSocket(this.notificationService.notificationsPath(this.controller));
  }

  setUpMapCallbacks() {
    if (!this.readonly) {
      this.toolsService.selectionToolActivation(true);
    }

    const onLinkContextMenu = this.linkWidget.onContextMenu.subscribe((eventLink: LinkContextMenu) => {
      const link = this.mapLinkToLink.convert(eventLink.link);
      this.contextMenu().openMenuForListOfElements(
        [],
        [],
        [],
        [link],
        eventLink.event.clientY,
        eventLink.event.clientX
      );
    });

    const onEthernetLinkContextMenu = this.ethernetLinkWidget.onContextMenu.subscribe((eventLink: LinkContextMenu) => {
      const link = this.mapLinkToLink.convert(eventLink.link);
      this.contextMenu().openMenuForListOfElements(
        [],
        [],
        [],
        [link],
        eventLink.event.clientY,
        eventLink.event.clientX
      );
    });

    const onSerialLinkContextMenu = this.serialLinkWidget.onContextMenu.subscribe((eventLink: LinkContextMenu) => {
      const link = this.mapLinkToLink.convert(eventLink.link);
      this.contextMenu().openMenuForListOfElements(
        [],
        [],
        [],
        [link],
        eventLink.event.clientY,
        eventLink.event.clientX
      );
    });

    const onNodeContextMenu = this.nodeWidget.onContextMenu.subscribe((eventNode: NodeContextMenu) => {
      const node = this.mapNodeToNode.convert(eventNode.node);
      this.contextMenu().openMenuForNode(node, eventNode.event.clientY, eventNode.event.clientX);
    });

    const onDrawingContextMenu = this.drawingsWidget.onContextMenu.subscribe((eventDrawing: DrawingContextMenu) => {
      const drawing = this.mapDrawingToDrawing.convert(eventDrawing.drawing);
      this.contextMenu().openMenuForDrawing(drawing, eventDrawing.event.clientY, eventDrawing.event.clientX);
    });

    const onLabelContextMenu = this.labelWidget.onContextMenu.subscribe((eventLabel: LabelContextMenu) => {
      const label = this.mapLabelToLabel.convert(eventLabel.label);
      const node = this.nodes().find((n) => n.node_id === eventLabel.label.nodeId);
      this.contextMenu().openMenuForLabel(label, node, eventLabel.event.clientY, eventLabel.event.clientX);
    });

    const onInterfaceLabelContextMenu = this.interfaceLabelWidget.onContextMenu.subscribe(
      (eventInterfaceLabel: InterfaceLabelContextMenu) => {
        const linkNode = this.mapLinkNodeToLinkNode.convert(eventInterfaceLabel.interfaceLabel);
        const link = this.links.find((l) => l.link_id === eventInterfaceLabel.interfaceLabel.linkId);
        this.contextMenu().openMenuForInterfaceLabel(
          linkNode,
          link,
          eventInterfaceLabel.event.clientY,
          eventInterfaceLabel.event.clientX
        );
      }
    );

    const onContextMenu = this.selectionTool.contextMenuOpened.subscribe((event) => {
      const selectedItems = this.selectionManager.getSelected();
      if (selectedItems.length < 2 || !(event instanceof MouseEvent)) return;

      let drawings: Drawing[] = [];
      let nodes: Node[] = [];
      let labels: Label[] = [];
      let links: Link[] = [];

      selectedItems.forEach((elem) => {
        if (elem instanceof MapDrawing) {
          drawings.push(this.mapDrawingToDrawing.convert(elem));
        } else if (elem instanceof MapNode) {
          nodes.push(this.mapNodeToNode.convert(elem));
        } else if (elem instanceof MapLabel) {
          labels.push(this.mapLabelToLabel.convert(elem));
        } else if (elem instanceof MapLink) {
          links.push(this.mapLinkToLink.convert(elem));
        }
      });

      this.contextMenu().openMenuForListOfElements(drawings, nodes, labels, links, event.clientY, event.clientX);
    });

    this.projectMapSubscription.add(onLinkContextMenu);
    this.projectMapSubscription.add(onEthernetLinkContextMenu);
    this.projectMapSubscription.add(onSerialLinkContextMenu);
    this.projectMapSubscription.add(onNodeContextMenu);
    this.projectMapSubscription.add(onDrawingContextMenu);
    this.projectMapSubscription.add(onContextMenu);
    this.projectMapSubscription.add(onLabelContextMenu);
    this.projectMapSubscription.add(onInterfaceLabelContextMenu);
    this.mapChangeDetectorRef.detectChanges();
  }

  onNodeCreation(nodeAddedEvent: NodeAddedEvent) {
    if (!nodeAddedEvent) {
      return;
    }

    const creationId = nodeAddedEvent.creationId;

    this.nodeService
      .createFromTemplate(
        this.controller,
        this.project,
        nodeAddedEvent.template,
        nodeAddedEvent.x,
        nodeAddedEvent.y,
        nodeAddedEvent.controller
      )
      .subscribe(
        (node: Node) => {
          // Notify template component of success
          if (creationId && this.templateComponent()) {
            this.templateComponent()!.onNodeCreated(creationId, true);
          }

          // Show success toast
          this.toasterService.success(`Node "${node.name}" created successfully`);

          // if (nodeAddedEvent.name !== nodeAddedEvent.template.name) {
          //   node.name = nodeAddedEvent.name;
          //   this.nodeService.updateNode(this.controller, node).subscribe(()=>{});
          // }
          this.projectService.nodes(this.controller, this.project.project_id).subscribe({
            next: (nodes: Node[]) => {
              nodes
                .filter((node) => node.label.style === null)
                .forEach((node) => {
                  const fixedNode = this.nodeCreatedLabelStylesFixer.fix(node);
                  this.nodeService.updateLabel(this.controller, node, fixedNode.label).subscribe({
                    next: () => {},
                    error: (err) => {
                      console.error('Failed to update node label:', err);
                    },
                  });
                });

              this.nodesDataSource.set(nodes);
              nodeAddedEvent.numberOfNodes--;
              if (nodeAddedEvent.numberOfNodes > 0) {
                nodeAddedEvent.x =
                  nodeAddedEvent.x + 50 < this.project.scene_width / 2 ? nodeAddedEvent.x + 50 : nodeAddedEvent.x;
                nodeAddedEvent.y =
                  nodeAddedEvent.y + 50 < this.project.scene_height / 2 ? nodeAddedEvent.y + 50 : nodeAddedEvent.y;
                this.onNodeCreation(nodeAddedEvent);
              }
            },
            error: (err) => {
              this.toasterService.error('Failed to load nodes: ' + (err.error?.message || err.message || 'Unknown error'));
              this.cd.markForCheck();
            },
          });
        },
        (error) => {
          // Notify template component of failure
          if (creationId && this.templateComponent()) {
            const errorMessage = error.error?.message || error.message || 'Unknown error';
            this.templateComponent()!.onNodeCreated(creationId, false, errorMessage);
          }

          this.toasterService.error(error.error?.message || error.message || 'Failed to create node from template');
        }
      );
  }

  public centerView() {
    if (this.project) {
      const ctx = this.mapChild()?.context;
      const viewportWidth = document.documentElement.clientWidth;
      const viewportHeight = document.documentElement.clientHeight;
      // With an asymmetric canvas the scene origin sits at (centerX, centerY)
      // in SVG space. Scrolling to centerX - halfViewport puts the origin in
      // the middle of the screen, which is the natural "home" position.
      const svgCenterX = ctx ? (ctx.centerX !== null ? ctx.centerX : ctx.size.width / 2) : this.project.scene_width / 2;
      const svgCenterY = ctx
        ? ctx.centerY !== null
          ? ctx.centerY
          : ctx.size.height / 2
        : this.project.scene_height / 2;
      const scrollX = Math.max(0, svgCenterX - viewportWidth / 2);
      const scrollY = Math.max(0, svgCenterY - viewportHeight / 2);

      window.scrollTo(scrollX, scrollY);
    } else {
      this.toasterService.error('Please wait until all components are loaded.');
    }
  }

  public onDrawingSaved() {
    this.projectMapMenuComponent().resetDrawToolChoice();
  }

  public set readonly(value) {
    this.inReadOnlyMode = value;
    if (value) {
      this.tools.selection = false;
      this.toolsService.selectionToolActivation(false);
    } else {
      this.tools.selection = true;
      this.toolsService.selectionToolActivation(true);
    }
  }

  public get readonly() {
    return this.inReadOnlyMode;
  }

  public toggleSymbolScaling(value: boolean) {
    this.symbolScaling = value;
    this.mapSettingsService.setSymbolScaling(value);
  }

  public toggleMovingMode() {
    this.tools.moving = !this.tools.moving;
    this.movingEventSource.movingModeState.emit(this.tools.moving);

    if (!this.readonly) {
      this.tools.selection = !this.tools.moving;
      this.toolsService.selectionToolActivation(this.tools.selection);
    }
  }

  public toggleDrawLineMode() {
    this.tools.draw_link = !this.tools.draw_link;
    this.toolsService.drawLinkToolActivation(this.tools.draw_link);
  }

  public toggleShowInterfaceLabels(enabled: boolean) {
    this.isInterfaceLabelVisible = enabled;
    this.mapSettingsService.toggleShowInterfaceLabels(this.isInterfaceLabelVisible);
    this.mapSettingsService.mapRenderedEmitter.emit(true);
  }

  public toggleShowConsole(visible: boolean) {
    this.isConsoleVisible = visible;
    this.mapSettingsService.toggleLogConsole(this.isConsoleVisible);
  }

  /**
   * Handle AI Chat opened event
   */
  public onAIChatOpened() {
    // Get current panel state
    const panelState = this.aiChatStore.getPanelStateValue();

    // Open panel in store to update state
    this.aiChatStore.openPanel();

    // If AI Chat is already visible and minimized, restore it via store
    if (this.isAIChatVisible && panelState.isMinimized) {
      this.aiChatStore.restorePanel();
    }

    // Make AI Chat visible
    this.isAIChatVisible = true;
  }

  /**
   * Close AI Chat panel and reset state when leaving project
   * This ensures clean state when returning to project
   */
  public onLeaveProject() {
    this.closeAIChat();
    // Reset panel state
    this.aiChatStore.setPanelState({
      isOpen: false,
      isMinimized: false,
      isMaximized: false,
    });
  }

  /**
   * Close AI Chat panel
   */
  public closeAIChat() {
    this.isAIChatVisible = false;
  }

  /**
   * Open Web Wireshark inline window for a link
   */
  public openWebWiresharkInline(data: { link: Link; controller: Controller; project: Project }) {
    // Check if window already open for this link
    if (this.webWiresharkInlineWindows.has(data.link.link_id)) {
      // Bring existing window to front
      this.bringWebWiresharkWindowToFront(data.link.link_id);
      this.toasterService.warning('Web Wireshark is already open for this link');
      return;
    }

    // Assign z-index for new window (increment counter)
    this.zIndexCounter++;
    const windowZIndex = this.baseZIndex + this.zIndexCounter;

    // Add the link to our Map of open windows
    this.webWiresharkInlineWindows.set(data.link.link_id, data.link);
    this.webWiresharkInlineZIndex.set(data.link.link_id, windowZIndex);
    this.cd.markForCheck();
  }

  /**
   * Close Web Wireshark inline window for a specific link
   */
  public closeWebWiresharkInline(linkId: string) {
    this.webWiresharkInlineWindows.delete(linkId);
    this.webWiresharkInlineZIndex.delete(linkId);
    this.cd.markForCheck();
  }

  /**
   * Bring a Web Wireshark window to front
   */
  public bringWebWiresharkWindowToFront(linkId: string) {
    if (!this.webWiresharkInlineWindows.has(linkId)) {
      return;
    }

    // Increment counter and assign higher z-index
    this.zIndexCounter++;
    const newZIndex = this.baseZIndex + this.zIndexCounter;
    this.webWiresharkInlineZIndex.set(linkId, newZIndex);
    this.cd.markForCheck();
  }

  /**
   * Get z-index for a specific window
   */
  public getWebWiresharkWindowZIndex(linkId: string): number {
    return this.webWiresharkInlineZIndex.get(linkId) || this.baseZIndex;
  }

  /**
   * Get all open Web Wireshark inline windows as an array
   */
  public getWebWiresharkInlineWindows(): Link[] {
    return Array.from(this.webWiresharkInlineWindows.values());
  }

  /**
   * Open Web Console inline window for a node
   */
  public onOpenWebConsoleInline(data: { node: Node; controller: Controller; project: Project }) {
    // Check if window already open for this node
    if (this.webConsoleInlineWindows.has(data.node.node_id)) {
      // Bring existing window to front
      this.bringWebConsoleWindowToFront(data.node.node_id);
      this.toasterService.warning('Web Console is already open for this node');
      return;
    }

    // Assign z-index for new window (increment counter)
    this.zIndexCounter++;
    const windowZIndex = this.baseZIndex + this.zIndexCounter;

    // Add the node to our Map of open windows
    this.webConsoleInlineWindows.set(data.node.node_id, data.node);
    this.webConsoleInlineZIndex.set(data.node.node_id, windowZIndex);
    this.cd.markForCheck();
  }

  /**
   * Close Web Console inline window for a specific node
   */
  public closeWebConsoleInline(nodeId: string) {
    this.webConsoleInlineWindows.delete(nodeId);
    this.webConsoleInlineZIndex.delete(nodeId);
    this.cd.markForCheck();
  }

  /**
   * Bring a Web Console window to front
   */
  public bringWebConsoleWindowToFront(nodeId: string) {
    if (!this.webConsoleInlineWindows.has(nodeId)) {
      return;
    }

    // Increment counter and assign higher z-index
    this.zIndexCounter++;
    const newZIndex = this.baseZIndex + this.zIndexCounter;
    this.webConsoleInlineZIndex.set(nodeId, newZIndex);
    this.cd.markForCheck();
  }

  /**
   * Get z-index for a specific console window
   */
  public getWebConsoleWindowZIndex(nodeId: string): number {
    return this.webConsoleInlineZIndex.get(nodeId) || this.baseZIndex;
  }

  /**
   * Get all open Web Console inline windows as an array
   */
  public getWebConsoleInlineWindows(): Node[] {
    return Array.from(this.webConsoleInlineWindows.values());
  }

  /**
   * Bring console window to front
   */
  public bringConsoleToFront() {
    this.zIndexCounter++;
    this.consoleZIndex = this.baseZIndex + this.zIndexCounter;
    this.cd.markForCheck();
  }

  /**
   * Bring AI chat window to front
   */
  public bringAIChatToFront() {
    this.zIndexCounter++;
    this.aiChatZIndex = this.baseZIndex + this.zIndexCounter;
    this.cd.markForCheck();
  }

  /**
   * Restore console window from minimized state
   */
  public restoreConsole(): void {
    this.windowManagement.restoreWindow('console');
    this.cd.markForCheck();
  }

  /**
   * Restore Wireshark window from minimized state
   */
  public restoreWiresharkWindow(linkId: string): void {
    this.windowManagement.restoreWindow(`wireshark-${linkId}`);
    this.cd.markForCheck();
  }

  /**
   * Get taskbar icon position for console
   */
  public getConsoleTaskbarLeft(): number {
    return this.TASKBAR_BASE_LEFT;
  }

  /**
   * Get taskbar icon position for Wireshark windows
   * Icons are arranged by window open order, not minimized order
   */
  public getWiresharkTaskbarLeft(linkId: string | undefined): number {
    if (!linkId) return this.TASKBAR_BASE_LEFT;

    // Calculate index based on position in open windows list
    const openWindows = this.getWebWiresharkInlineWindows();
    const index = openWindows.findIndex(w => w.link_id === linkId);

    // Console icon always takes first slot
    let baseOffset = this.TASKBAR_ICON_WIDTH + this.TASKBAR_ICON_GAP;
    return this.TASKBAR_BASE_LEFT + baseOffset + index * (this.TASKBAR_ICON_WIDTH + this.TASKBAR_ICON_GAP);
  }

  /**
   * Get taskbar icon position for Web Console windows
   * Icons are arranged after Wireshark windows
   */
  public getWebConsoleTaskbarLeft(nodeId: string | undefined): number {
    if (!nodeId) return this.TASKBAR_BASE_LEFT;

    // Calculate index based on position in open windows list
    const openWindows = this.getWebConsoleInlineWindows();
    const index = openWindows.findIndex(w => w.node_id === nodeId);

    // Console icon always takes first slot
    let baseOffset = this.TASKBAR_ICON_WIDTH + this.TASKBAR_ICON_GAP;

    // Add space for Wireshark windows
    const wiresharkCount = this.webWiresharkInlineWindows.size;
    baseOffset += wiresharkCount * (this.TASKBAR_ICON_WIDTH + this.TASKBAR_ICON_GAP);

    return this.TASKBAR_BASE_LEFT + baseOffset + index * (this.TASKBAR_ICON_WIDTH + this.TASKBAR_ICON_GAP);
  }

  /**
   * Toggle Web Console window minimize/restore
   */
  public toggleWebConsoleMinimize(nodeId: string): void {
    const windowId = `console-${nodeId}`;
    const isMinimized = this.windowManagement.minimizedWindows().some(w => w.id === windowId);
    if (isMinimized) {
      this.windowManagement.restoreWindow(windowId);
    } else {
      this.windowManagement.minimizeWindow(windowId, 'console', nodeId);
    }
    this.cd.markForCheck();
  }

  /**
   * Toggle console minimize/restore
   */
  public toggleConsoleMinimize(): void {
    const isMinimized = this.windowManagement.minimizedWindows().some(w => w.id === 'console');
    if (isMinimized) {
      this.windowManagement.restoreWindow('console');
    } else {
      this.windowManagement.minimizeWindow('console', 'console');
    }
    this.cd.markForCheck();
  }

  /**
   * Toggle Wireshark window minimize/restore
   */
  public toggleWiresharkMinimize(linkId: string): void {
    const windowId = `wireshark-${linkId}`;
    const isMinimized = this.windowManagement.minimizedWindows().some(w => w.id === windowId);
    if (isMinimized) {
      this.windowManagement.restoreWindow(windowId);
    } else {
      this.windowManagement.minimizeWindow(windowId, 'wireshark', linkId);
    }
    this.cd.markForCheck();
  }

  public toggleShowTopologySummary(visible: boolean) {
    this.isTopologySummaryVisible = visible;
    this.mapSettingsService.toggleTopologySummary(this.isTopologySummaryVisible);
    this.lazyLoadTopologySummary();
    this.cd.markForCheck();
  }

  public toggleNotifications(visible: boolean) {
    this.notificationsVisibility = visible;
    if (this.notificationsVisibility) {
      localStorage.setItem('notificationsVisibility', 'true');
    } else {
      localStorage.removeItem('notificationsVisibility');
    }
  }

  public toggleLayers(visible: boolean) {
    this.layersVisibility = visible;
    this.mapSettingsService.toggleLayers(visible);
    if (this.layersVisibility) {
      localStorage.setItem('layersVisibility', 'true');
    } else {
      localStorage.removeItem('layersVisibility');
    }
    this.mapChild().applyMapSettingsChanges();
  }

  public toggleItemLockStatus(visible: boolean) {
    this.itemLockStatusVisibility = visible;
    this.mapSettingsService.toggleItemLockStatus(visible);

    const projectId = this.project?.project_id;
    if (projectId != null) {
      const lockKey = `itemLockStatusVisibility_${projectId}`;
      if (visible) {
        localStorage.setItem(lockKey, 'true');
      } else {
        localStorage.removeItem(lockKey);
      }
    }
    this.mapChild()?.applyMapSettingsChanges();
  }

  public toggleGrid(visible: boolean) {
    this.gridVisibility = visible;
    if (this.gridVisibility) {
      localStorage.setItem('gridVisibility', 'true');
    } else {
      localStorage.removeItem('gridVisibility');
    }
    this.mapChild().gridVisibility.set(this.gridVisibility ? 1 : 0);
    this.mapChild().applyMapSettingsChanges();
  }

  public toggleSnapToGrid(enabled: boolean) {
    const previousValue = this.project.snap_to_grid;
    this.project.snap_to_grid = enabled;
    this.projectService.update(this.controller, this.project).subscribe(
      (project: Project) => {
        this.project.snap_to_grid = project.snap_to_grid;
      },
      () => {
        this.project.snap_to_grid = previousValue;
        this.toasterService.error('Cannot update project settings');
      }
    );
  }

  private showMessage(msg) {
    if (this.notificationsVisibility) {
      if (msg.type === 'error') this.toasterService.error(msg.message);
      if (msg.type === 'warning') this.toasterService.warning(msg.message);
    }
  }

  public hideMenu() {
    this.projectMapMenuComponent().resetDrawToolChoice();
    this.isProjectMapMenuVisible = false;
  }

  public showMenu() {
    this.isProjectMapMenuVisible = true;
  }

  zoomIn() {
    this.mapScaleService.setScale(this.mapScaleService.getScale() + 0.1);
  }

  zoomOut() {
    let currentScale = this.mapScaleService.getScale();

    if (currentScale - 0.1 > 0) {
      this.mapScaleService.setScale(currentScale - 0.1);
    }
  }

  resetZoom() {
    this.mapScaleService.resetToDefault();
  }

  addNewProject() {
    const dialogRef = this.dialog.open(AddBlankProjectDialogComponent, {
      width: '400px',
      autoFocus: false,
      disableClose: true,
    });
    let instance = dialogRef.componentInstance;
    instance.controller = this.controller;
  }

  saveProject() {
    const dialogRef = this.dialog.open(SaveProjectDialogComponent, {
      width: '400px',
      autoFocus: false,
      disableClose: true,
    });
    let instance = dialogRef.componentInstance;
    instance.controller = this.controller;
    instance.project = this.project;
  }

  editProject() {
    const dialogRef = this.dialog.open(EditProjectDialogComponent, {
      autoFocus: false,
      disableClose: true,
      panelClass: ['base-dialog-panel', 'configurator-dialog-panel', 'edit-project-dialog-panel'],
    });
    let instance = dialogRef.componentInstance;
    instance.controller = this.controller;
    instance.project = this.project;

    dialogRef.afterClosed().subscribe((updatedProject: Project) => {
      if (updatedProject) {
        this.project = updatedProject;
        this.cd.markForCheck();
      }
    });
  }

  importProject() {
    let uuid: string = '';
    const dialogRef = this.dialog.open(ImportProjectDialogComponent, {
      width: '400px',
      autoFocus: false,
      disableClose: true,
    });
    let instance = dialogRef.componentInstance;
    instance.controller = this.controller;
    const subscription = dialogRef.componentInstance.onImportProject.subscribe((projectId: string) => {
      uuid = projectId;
    });

    dialogRef.afterClosed().subscribe((isCancel: boolean) => {
      subscription.unsubscribe();
      if (uuid && !isCancel) {
        this.bottomSheet.open(NavigationDialogComponent);
        let bottomSheetRef = this.bottomSheet._openedBottomSheetRef;
        bottomSheetRef.instance.projectMessage = 'imported project';

        const bottomSheetSubscription = bottomSheetRef.afterDismissed().subscribe((result: boolean) => {
          if (result) {
            this.projectService.open(this.controller, uuid).subscribe({
              next: () => {
                this.router.navigate(['/controller', this.controller.id, 'project', uuid]);
              },
              error: (err) => {
                const message = err.error?.message || err.message || 'Failed to open project';
                this.toasterService.error(message);
                this.cd.markForCheck();
              },
            });
          }
        });
      }
    });
  }

  exportProject() {
    if (this.nodes().filter((node) => node.node_type === 'virtualbox').length > 0) {
      this.toasterService.error('Map with VirtualBox machines cannot be exported.');
    } else if (
      this.nodes().filter(
        (node) =>
          (node.status === 'started' && node.node_type === 'vpcs') ||
          (node.status === 'started' && node.node_type === 'virtualbox') ||
          (node.status === 'started' && node.node_type === 'vmware')
      ).length > 0
    ) {
      this.toasterService.error('Project with running nodes cannot be exported.');
    } else {
      // location.assign(this.projectService.getExportPath(this.controller, this.project));
      this.exportPortableProjectDialog();
    }
  }

  exportPortableProjectDialog() {
    const dialogRef = this.dialog.open(ExportPortableProjectComponent, {
      panelClass: ['base-dialog-panel', 'simple-dialog-panel'],
      autoFocus: false,
      disableClose: true,
      data: { controllerDetails: this.controller, projectDetails: this.project },
    });

    dialogRef.afterClosed().subscribe((isAddes: boolean) => {});
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
      let svg = `<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\"
                height=\"${imageToUpload.height}\" width=\"${imageToUpload.width}\">\n<image height=\"${imageToUpload.height}\" width=\"${imageToUpload.width}\"
                xlink:href=\"${image}\"/>\n</svg>`;
      this.drawingService
        .add(this.controller, this.project.project_id, -(imageToUpload.width / 2), -(imageToUpload.height / 2), svg)
        .subscribe({
          next: () => {},
          error: (err) => {
            const message = err.error?.message || err.message || 'Failed to add image';
            this.toasterService.error(message);
            this.cd.markForCheck();
          },
        });
    };

    imageToUpload.onload = () => {
      fileReader.readAsDataURL(file);
    };
    imageToUpload.src = window.URL.createObjectURL(file);
  }

  public closeProject() {
    const bottomSheetRef = this.bottomSheet.open(ConfirmationBottomSheetComponent, {
      data: { message: 'Do you want to close the project?' },
      panelClass: 'confirmation-bottom-sheet',
    });
    const bottomSheetSubscription = bottomSheetRef.afterDismissed().subscribe((result: boolean) => {
      if (result) {
        this.projectService.close(this.controller, this.project.project_id).subscribe({
          next: () => {
            this.router.navigate(['/controller', this.controller.id, 'projects']);
          },
          error: (err) => {
            const message = err.error?.message || err.message || 'Failed to close project';
            this.toasterService.error(message);
            this.cd.markForCheck();
          },
        });
      }
    });
  }

  public deleteProject() {
    const bottomSheetRef = this.bottomSheet.open(ConfirmationBottomSheetComponent, {
      data: { message: 'Do you want to delete the project?' },
      panelClass: 'confirmation-bottom-sheet',
    });
    const bottomSheetSubscription = bottomSheetRef.afterDismissed().subscribe((result: boolean) => {
      if (result) {
        this.projectService.delete(this.controller, this.project.project_id).subscribe({
          next: () => {
            this.router.navigate(['/controller', this.controller.id, 'projects']);
          },
          error: (err) => {
            const message = err.error?.message || err.message || 'Failed to delete project';
            this.toasterService.error(message);
            this.cd.markForCheck();
          },
        });
      }
    });
  }

  public addNewTemplate() {
    const dialogRef = this.dialog.open(NewTemplateDialogComponent, {
      width: '800px',
      maxHeight: '800px',
      autoFocus: false,
      disableClose: true,
      panelClass: ['base-dialog-panel', 'configurator-dialog-panel', 'new-template-dialog-panel'],
    });
    let instance = dialogRef.componentInstance;
    instance.controller = this.controller;
    instance.project = this.project;
  }

  public showReadme() {
    const dialogRef = this.dialog.open(ProjectReadmeComponent, {
      width: '600px',
      height: '650px',
      autoFocus: false,
      disableClose: true,
    });
    let instance = dialogRef.componentInstance;
    instance.controller = this.controller;
    instance.project = this.project;
  }

  public ngOnDestroy(): void {
    // Close AI Chat when leaving project
    this.onLeaveProject();

    this.nodeConsoleService.openConsoles = 0;
    this.title.setTitle('GNS3 Web UI');

    this.drawingsDataSource.clear();
    this.nodesDataSource.clear();
    this.linksDataSource.clear();

    if (this.projectws) {
      if (this.projectws.OPEN) this.projectws.close();
    }
    if (this.ws) {
      if (this.ws.OPEN) this.ws.close();
    }
    this.projectMapSubscription.unsubscribe();
  }
}
