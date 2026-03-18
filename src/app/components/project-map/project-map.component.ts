import {
  ChangeDetectorRef,
  Component,
  ComponentRef,
  HostListener,
  OnDestroy,
  OnInit,
  ViewChild,
  ViewContainerRef,
  ViewEncapsulation,
} from '@angular/core';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { MatDialog } from '@angular/material/dialog';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
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
import { ThemeService } from '@services/theme.service';
import { ToasterService } from '@services/toaster.service';
import { ToolsService } from '@services/tools.service';
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

@Component({
  selector: 'app-project-map',
  encapsulation: ViewEncapsulation.None,
  templateUrl: './project-map.component.html',
  styleUrls: ['./project-map.component.scss'],
})
export class ProjectMapComponent implements OnInit, OnDestroy {
  public nodes: Node[] = [];
  public links: Link[] = [];
  public drawings: Drawing[] = [];
  public symbols: Symbol[] = [];
  public project: Project;
  public controller: Controller;
  public projectws: WebSocket;
  public ws: WebSocket;
  public isProjectMapMenuVisible: boolean = false;
  public isConsoleVisible: boolean = true;
  public isTopologySummaryVisible: boolean = true;
  public isInterfaceLabelVisible: boolean = false;
  public notificationsVisibility: boolean = false;
  public layersVisibility: boolean = false;
  public gridVisibility: boolean = false;
  public toolbarVisibility: boolean = true;
  public symbolScaling: boolean = true;
  public isAIChatVisible: boolean = false;
  private instance: ComponentRef<TopologySummaryComponent>;
  // private instance: any

  tools = {
    selection: true,
    moving: false,
    draw_link: false,
    text_editing: true,
  };

  protected settings: Settings;
  private inReadOnlyMode = false;
  public isLightThemeEnabled: boolean = false;
  private highlightedNodeId: string = null;
  public isGlobalLightTheme: boolean = false;

  @ViewChild(ContextMenuComponent) contextMenu: ContextMenuComponent;
  @ViewChild(D3MapComponent) mapChild: D3MapComponent;
  @ViewChild(ProjectMapMenuComponent) projectMapMenuComponent: ProjectMapMenuComponent;
  @ViewChild('topologySummaryContainer', { read: ViewContainerRef }) topologySummaryContainer: ViewContainerRef;

  private projectMapSubscription: Subscription = new Subscription();

  constructor(
    private route: ActivatedRoute,
    private controllerService: ControllerService,
    private projectService: ProjectService,
    private nodeService: NodeService,
    private linkService: LinkService,
    public drawingService: DrawingService,
    private progressService: ProgressService,
    private projectWebServiceHandler: ProjectWebServiceHandler,
    private mapChangeDetectorRef: MapChangeDetectorRef,
    private nodeWidget: NodeWidget,
    private drawingsWidget: DrawingsWidget,
    private linkWidget: LinkWidget,
    private labelWidget: LabelWidget,
    private interfaceLabelWidget: InterfaceLabelWidget,
    private mapNodeToNode: MapNodeToNodeConverter,
    private mapDrawingToDrawing: MapDrawingToDrawingConverter,
    private mapLabelToLabel: MapLabelToLabelConverter,
    private mapLinkToLink: MapLinkToLinkConverter,
    private mapLinkNodeToLinkNode: MapLinkNodeToLinkNodeConverter,
    private nodesDataSource: NodesDataSource,
    private linksDataSource: LinksDataSource,
    private drawingsDataSource: DrawingsDataSource,
    private settingsService: SettingsService,
    private toolsService: ToolsService,
    private selectionManager: SelectionManager,
    private selectionTool: SelectionTool,
    private recentlyOpenedProjectService: RecentlyOpenedProjectService,
    private movingEventSource: MovingEventSource,
    private mapScaleService: MapScaleService,
    private nodeCreatedLabelStylesFixer: NodeCreatedLabelStylesFixer,
    private toasterService: ToasterService,
    private dialog: MatDialog,
    private router: Router,
    private mapNodesDataSource: MapNodesDataSource,
    private mapLinksDataSource: MapLinksDataSource,
    private mapDrawingsDataSource: MapDrawingsDataSource,
    private mapSymbolsDataSource: MapSymbolsDataSource,
    private mapSettingsService: MapSettingsService,
    private ethernetLinkWidget: EthernetLinkWidget,
    private serialLinkWidget: SerialLinkWidget,
    private bottomSheet: MatBottomSheet,
    private notificationService: NotificationService,
    private themeService: ThemeService,
    private title: Title,
    private nodeConsoleService: NodeConsoleService,
    private symbolService: SymbolService,
    private cd: ChangeDetectorRef,
    private aiChatStore: AiChatStore,
    // private cfr: ComponentFactoryResolver,
    // private injector: Injector,
    private viewContainerRef: ViewContainerRef
  ) {}

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

    this.themeService.mapThemeChanged.subscribe((value: string) => {
      this.isLightThemeEnabled = value === 'light';
      this.applyMapBackground(this.isLightThemeEnabled);
    });

    this.themeService.themeChanged.subscribe((value: string) => {
      this.isGlobalLightTheme = value === 'light-theme';
    });
  }

  getSettings() {
    this.isLightThemeEnabled = this.themeService.getActualMapTheme() === 'light';
    this.isGlobalLightTheme = this.themeService.getActualTheme() === 'light';
    this.applyMapBackground(this.isLightThemeEnabled);
    this.cd.detectChanges();

    this.settings = this.settingsService.getAll();
    this.symbolScaling = this.mapSettingsService.getSymbolScaling();
    this.isConsoleVisible = this.mapSettingsService.isLogConsoleVisible;
    this.mapSettingsService.logConsoleSubject.subscribe((value) => (this.isConsoleVisible = value));
    this.notificationsVisibility = localStorage.getItem('notificationsVisibility') === 'true' ? true : false;
    this.layersVisibility = localStorage.getItem('layersVisibility') === 'true' ? true : false;
    this.gridVisibility = localStorage.getItem('gridVisibility') === 'true' ? true : false;
  }

  async lazyLoadTopologySummary() {
    if (this.isTopologySummaryVisible) {
      const { TopologySummaryComponent } = await import('../topology-summary/topology-summary.component');
      this.instance = this.viewContainerRef.createComponent(TopologySummaryComponent);

      // const componentFactory = this.cfr.resolveComponentFactory(TopologySummaryComponent);
      // this.instance = this.topologySummaryContainer.createComponent(componentFactory, null, this.injector);
      this.instance.instance.controller = this.controller;
      this.instance.instance.project = this.project;
    } else if (this.instance) {
      if (this.instance.instance) {
        this.instance.instance.ngOnDestroy();
        this.instance.destroy();
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

    this.projectMapSubscription.add(
      this.nodesDataSource.changes.subscribe((nodes: Node[]) => {
        if (!this.controller) return;

        const nodesToLoad = nodes.filter((node: Node) => !node.symbol_url);

        // Fetch dimensions for any node with unknown size
        nodesToLoad.forEach((node: Node) => {
          if (node.width == 0 && node.height == 0) {
            this.symbolService.getDimensions(this.controller, node.symbol).subscribe((symbolDimensions) => {
              node.width = symbolDimensions.width;
              node.height = symbolDimensions.height;
            });
          }
        });

        if (nodesToLoad.length === 0) {
          this.nodes = nodes;
          if (this.mapSettingsService.getSymbolScaling()) this.applyScalingOfNodeSymbols();
          this.mapChangeDetectorRef.detectChanges();
          return;
        }

        // Build a map from node -> rawUrl for all nodes that need loading
        const nodeRawUrlMap = new Map<Node, string>();
        nodesToLoad.forEach((node: Node) => {
          nodeRawUrlMap.set(
            node,
            `${this.controller.protocol}//${this.controller.host}:${this.controller.port}/${environment.current_version}/symbols/${node.symbol}/raw`
          );
        });

        // Deduplicate: only 1 fetch per unique symbol URL (shareReplay(1) in getSymbolBlobUrl handles concurrent callers)
        const uniqueRawUrls = [...new Set(nodeRawUrlMap.values())];
        forkJoin(uniqueRawUrls.map((url) => this.symbolService.getSymbolBlobUrl(url))).subscribe(
          (blobUrls: string[]) => {
            const blobUrlMap = new Map(uniqueRawUrls.map((url, i) => [url, blobUrls[i]]));
            nodesToLoad.forEach((node: Node) => {
              node.symbol_url = blobUrlMap.get(nodeRawUrlMap.get(node));
            });
            this.nodes = nodes;
            if (this.mapSettingsService.getSymbolScaling()) this.applyScalingOfNodeSymbols();
            this.mapChangeDetectorRef.detectChanges();
          },
          () => {
            // Fallback to raw URLs if blob fetch fails
            nodesToLoad.forEach((node: Node) => {
              node.symbol_url = nodeRawUrlMap.get(node);
            });
            this.nodes = nodes;
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

      from(this.controllerService.get(controller_id))
        .pipe(
          mergeMap((controller: Controller ) => {
            if (!controller) this.router.navigate(['/controllers']);
            this.controller = controller;
            return this.projectService.get(controller, paramMap.get('project_id')).pipe(
              map((project) => {
                return project;
              })
            );
          }),
          mergeMap((project: Project) => {
            this.project = project;
            if (!project) this.router.navigate(['/controllers']);

            this.projectService.open(this.controller, this.project.project_id);
            this.title.setTitle(this.project.name);
            this.isInterfaceLabelVisible = this.mapSettingsService.showInterfaceLabels;
            this.toggleShowTopologySummary(this.mapSettingsService.isTopologySummaryVisible);

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
            this.onProjectLoad(project);
            if (this.mapSettingsService.openReadme) this.showReadme();
          },
          (error) => {
            this.progressService.setError(error);
          },
          () => {
            this.progressService.deactivate();
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
      this.deleteItems();
    });
  }

  deleteItems() {
    this.bottomSheet.open(ConfirmationBottomSheetComponent);
    let bottomSheetRef = this.bottomSheet._openedBottomSheetRef;
    bottomSheetRef.instance.message = 'Do you want to delete all selected objects?';
    const bottomSheetSubscription = bottomSheetRef.afterDismissed().subscribe((result: boolean) => {
      if (result) {
        const selected = this.selectionManager.getSelected();

        selected
          .filter((item) => item instanceof MapNode)
          .forEach((item: MapNode) => {
            const node = this.mapNodeToNode.convert(item);
            this.nodeService.delete(this.controller, node).subscribe((data) => {
              this.toasterService.success('Node has been deleted');
            });
          });
          
        selected
          .filter((item) => item instanceof MapLink)
          .forEach((item: MapLink) => {
            const link = this.mapLinkToLink.convert(item);
            this.linkService.deleteLink(this.controller, link).subscribe(() => {
              this.toasterService.success('Link has been deleted');
            });
          });

        selected
          .filter((item) => item instanceof MapDrawing)
          .forEach((item: MapDrawing) => {
            const drawing = this.mapDrawingToDrawing.convert(item);
            this.drawingService.delete(this.controller, drawing).subscribe((data) => {
              this.toasterService.success('Drawing has been deleted');
            });
          });
      }
    });
  }

  onProjectLoad(project: Project) {
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
      .subscribe((drawings: Drawing[]) => {
        this.drawingsDataSource.set(drawings);

        this.setUpMapCallbacks();
        this.setUpProjectWS(project);

        this.progressService.deactivate();
      });
    this.projectMapSubscription.add(subscription);
  }

  setUpProjectWS(project: Project) {
    this.projectws = new WebSocket(this.notificationService.projectNotificationsPath(this.controller, project.project_id));

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
      this.contextMenu.openMenuForListOfElements([], [], [], [link], eventLink.event.clientY, eventLink.event.clientX);
    });

    const onEthernetLinkContextMenu = this.ethernetLinkWidget.onContextMenu.subscribe((eventLink: LinkContextMenu) => {
      const link = this.mapLinkToLink.convert(eventLink.link);
      this.contextMenu.openMenuForListOfElements([], [], [], [link], eventLink.event.clientY, eventLink.event.clientX);
    });

    const onSerialLinkContextMenu = this.serialLinkWidget.onContextMenu.subscribe((eventLink: LinkContextMenu) => {
      const link = this.mapLinkToLink.convert(eventLink.link);
      this.contextMenu.openMenuForListOfElements([], [], [], [link], eventLink.event.clientY, eventLink.event.clientX);
    });

    const onNodeContextMenu = this.nodeWidget.onContextMenu.subscribe((eventNode: NodeContextMenu) => {
      const node = this.mapNodeToNode.convert(eventNode.node);
      this.contextMenu.openMenuForNode(node, eventNode.event.clientY, eventNode.event.clientX);
    });

    const onDrawingContextMenu = this.drawingsWidget.onContextMenu.subscribe((eventDrawing: DrawingContextMenu) => {
      const drawing = this.mapDrawingToDrawing.convert(eventDrawing.drawing);
      this.contextMenu.openMenuForDrawing(drawing, eventDrawing.event.clientY, eventDrawing.event.clientX);
    });

    const onLabelContextMenu = this.labelWidget.onContextMenu.subscribe((eventLabel: LabelContextMenu) => {
      const label = this.mapLabelToLabel.convert(eventLabel.label);
      const node = this.nodes.find((n) => n.node_id === eventLabel.label.nodeId);
      this.contextMenu.openMenuForLabel(label, node, eventLabel.event.clientY, eventLabel.event.clientX);
    });

    const onInterfaceLabelContextMenu = this.interfaceLabelWidget.onContextMenu.subscribe(
      (eventInterfaceLabel: InterfaceLabelContextMenu) => {
        const linkNode = this.mapLinkNodeToLinkNode.convert(eventInterfaceLabel.interfaceLabel);
        const link = this.links.find((l) => l.link_id === eventInterfaceLabel.interfaceLabel.linkId);
        this.contextMenu.openMenuForInterfaceLabel(
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

      this.contextMenu.openMenuForListOfElements(drawings, nodes, labels, links, event.clientY, event.clientX);
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

    this.progressService.activate();
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
          // if (nodeAddedEvent.name !== nodeAddedEvent.template.name) {
          //   node.name = nodeAddedEvent.name;
          //   this.nodeService.updateNode(this.controller, node).subscribe(()=>{});
          // }
          this.projectService.nodes(this.controller, this.project.project_id).subscribe((nodes: Node[]) => {
            nodes
              .filter((node) => node.label.style === null)
              .forEach((node) => {
                const fixedNode = this.nodeCreatedLabelStylesFixer.fix(node);
                this.nodeService.updateLabel(this.controller, node, fixedNode.label).subscribe();
              });

            this.nodesDataSource.set(nodes);
            nodeAddedEvent.numberOfNodes--;
            if (nodeAddedEvent.numberOfNodes > 0) {
              nodeAddedEvent.x =
                nodeAddedEvent.x + 50 < this.project.scene_width / 2 ? nodeAddedEvent.x + 50 : nodeAddedEvent.x;
              nodeAddedEvent.y =
                nodeAddedEvent.y + 50 < this.project.scene_height / 2 ? nodeAddedEvent.y + 50 : nodeAddedEvent.y;
              this.onNodeCreation(nodeAddedEvent);
            } else {
              this.progressService.deactivate();
            }
          });
        },
        (error) => {
          this.toasterService.error(error.error.message);
          this.progressService.deactivate();
        }
      );
  }

  public centerView() {
    if (this.project) {
      let scrollX: number =
        this.project.scene_width - document.documentElement.clientWidth > 0
          ? (this.project.scene_width - document.documentElement.clientWidth) / 2
          : 0;
      let scrollY: number =
        this.project.scene_height - document.documentElement.clientHeight > 0
          ? (this.project.scene_height - document.documentElement.clientHeight) / 2
          : 0;

      window.scrollTo(scrollX, scrollY);
    } else {
      this.toasterService.error('Please wait until all components are loaded.');
    }
  }

  public onDrawingSaved() {
    this.projectMapMenuComponent.resetDrawToolChoice();
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
      isMaximized: false
    });
  }

  /**
   * Close AI Chat panel
   */
  public closeAIChat() {
    this.isAIChatVisible = false;
  }

  public toggleShowTopologySummary(visible: boolean) {
    this.isTopologySummaryVisible = visible;
    this.mapSettingsService.toggleTopologySummary(this.isTopologySummaryVisible);
    this.lazyLoadTopologySummary();
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
    this.mapChild.applyMapSettingsChanges();
  }

  public toggleGrid(visible: boolean) {
    this.gridVisibility = visible;
    if (this.gridVisibility) {
      localStorage.setItem('gridVisibility', 'true');
    } else {
      localStorage.removeItem('gridVisibility');
    }
    this.mapChild.gridVisibility = this.gridVisibility ? 1 : 0;
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
    this.projectMapMenuComponent.resetDrawToolChoice();
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
      width: '600px',
      autoFocus: false,
      disableClose: true,
    });
    let instance = dialogRef.componentInstance;
    instance.controller = this.controller;
    instance.project = this.project;
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

    dialogRef.afterClosed().subscribe((isCancel:boolean) => {
      subscription.unsubscribe();
      if (uuid && !isCancel) {
        this.bottomSheet.open(NavigationDialogComponent);
        let bottomSheetRef = this.bottomSheet._openedBottomSheetRef;
        bottomSheetRef.instance.projectMessage = 'imported project';

        const bottomSheetSubscription = bottomSheetRef.afterDismissed().subscribe((result: boolean) => {
          if (result) {
            this.projectService.open(this.controller, uuid).subscribe(() => {
              this.router.navigate(['/controller', this.controller.id, 'project', uuid]);
            });
          }
        });
      }
    });
  }

  exportProject() {
    if (this.nodes.filter((node) => node.node_type === 'virtualbox').length > 0) {
      this.toasterService.error('Map with VirtualBox machines cannot be exported.');
    } else if (
      this.nodes.filter(
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
      width: '700px',
      maxHeight: '850px',
      autoFocus: false,
      disableClose: true,
      data: {controllerDetails:this.controller,projectDetails:this.project},
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
        .subscribe(() => {});
    };

    imageToUpload.onload = () => {
      fileReader.readAsDataURL(file);
    };
    imageToUpload.src = window.URL.createObjectURL(file);
  }

  public closeProject() {
    this.bottomSheet.open(ConfirmationBottomSheetComponent);
    let bottomSheetRef = this.bottomSheet._openedBottomSheetRef;
    bottomSheetRef.instance.message = 'Do you want to close the project?';
    const bottomSheetSubscription = bottomSheetRef.afterDismissed().subscribe((result: boolean) => {
      if (result) {
        this.projectService.close(this.controller, this.project.project_id).subscribe(() => {
          this.router.navigate(['/controller', this.controller.id, 'projects']);
        });
      }
    });
  }

  public deleteProject() {
    this.bottomSheet.open(ConfirmationBottomSheetComponent);
    let bottomSheetRef = this.bottomSheet._openedBottomSheetRef;
    bottomSheetRef.instance.message = 'Do you want to delete the project?';
    const bottomSheetSubscription = bottomSheetRef.afterDismissed().subscribe((result: boolean) => {
      if (result) {
        this.projectService.delete(this.controller, this.project.project_id).subscribe(() => {
          this.router.navigate(['/controller', this.controller.id, 'projects']);
        });
      }
    });
  }

  public addNewTemplate() {
    const dialogRef = this.dialog.open(NewTemplateDialogComponent, {
      width: '1000px',
      maxHeight: '700px',
      autoFocus: false,
      disableClose: true,
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

  /**
   * Handle device selection from console devices panel
   * Highlights the selected node and its connected links in the topology
   */
  public onDeviceSelected(nodeId: string): void {
    // Clear previous highlight first
    this.clearConsoleHighlight();

    this.highlightedNodeId = nodeId;

    // Highlight the selected node
    const nodeElement = d3.select(`g.node[node_id="${nodeId}"]`);
    if (!nodeElement.empty()) {
      nodeElement.classed('console-highlight', true);
    }

    // Highlight connected links and their connected nodes
    d3.selectAll('g.link_body').each(function(link: any) {
      if (link && (link.source?.id === nodeId || link.target?.id === nodeId)) {
        d3.select(this).classed('console-highlight', true);

        // Highlight the other node connected by this link
        const otherNodeId = link.source?.id === nodeId ? link.target?.id : link.source?.id;
        if (otherNodeId) {
          const otherNodeElement = d3.select(`g.node[node_id="${otherNodeId}"]`);
          if (!otherNodeElement.empty()) {
            otherNodeElement.classed('console-highlight-connected', true);
          }
        }
      }
    });
  }

  /**
   * Clear console device highlight
   */
  public clearConsoleHighlight(): void {
    const nodeId = this.highlightedNodeId;
    if (nodeId) {
      // Remove highlight from selected node
      const nodeElement = d3.select(`g.node[node_id="${nodeId}"]`);
      if (!nodeElement.empty()) {
        nodeElement.classed('console-highlight', false);
      }

      // Remove highlight from connected links and their nodes
      d3.selectAll('g.link_body').each(function(link: any) {
        if (link && (link.source?.id === nodeId || link.target?.id === nodeId)) {
          d3.select(this).classed('console-highlight', false);

          // Remove highlight from the other connected node
          const otherNodeId = link.source?.id === nodeId ? link.target?.id : link.source?.id;
          if (otherNodeId) {
            const otherNodeElement = d3.select(`g.node[node_id="${otherNodeId}"]`);
            if (!otherNodeElement.empty()) {
              otherNodeElement.classed('console-highlight-connected', false);
            }
          }
        }
      });

      this.highlightedNodeId = null;
    }
  }

  /**
   * Handle ESC key to clear highlight
   */
  @HostListener('window:keydown.escape')
  onEscapeKey(): void {
    this.clearConsoleHighlight();
  }

  /**
   * Apply map background color based on theme
   */
  private applyMapBackground(isLight: boolean): void {
    const color = isLight ? '#e8ecef' : '#18242b';
    document.body.style.backgroundColor = color;
    document.documentElement.style.backgroundColor = color;
  }

  public ngOnDestroy(): void {
    // Close AI Chat when leaving project
    this.onLeaveProject();

    // Reset background color
    const globalColor = this.themeService.getActualTheme() === 'light' ? '#e8ecef' : '#18242b';
    document.body.style.backgroundColor = globalColor;
    document.documentElement.style.backgroundColor = globalColor;

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
