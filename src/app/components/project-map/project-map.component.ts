import { Component, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute, ParamMap } from '@angular/router';

import { Observable, Subject, Subscription, from } from 'rxjs';
import { webSocket } from 'rxjs/webSocket';
import { map, mergeMap } from 'rxjs/operators';

import { Project } from '../../models/project';
import { Node } from '../../cartography/models/node';
import { Link } from '../../models/link';
import { ServerService } from '../../services/server.service';
import { ProjectService } from '../../services/project.service';
import { Server } from '../../models/server';
import { Drawing } from '../../cartography/models/drawing';
import { ContextMenuComponent } from './context-menu/context-menu.component';
import { Template } from '../../models/template';
import { NodeService } from '../../services/node.service';
import { Symbol } from '../../models/symbol';
import { NodesDataSource } from '../../cartography/datasources/nodes-datasource';
import { LinksDataSource } from '../../cartography/datasources/links-datasource';
import { ProjectWebServiceHandler } from '../../handlers/project-web-service-handler';
import { DrawingsDataSource } from '../../cartography/datasources/drawings-datasource';
import { ProgressService } from '../../common/progress/progress.service';
import { MapChangeDetectorRef } from '../../cartography/services/map-change-detector-ref';
import { NodeContextMenu } from '../../cartography/events/nodes';
import { NodeWidget } from '../../cartography/widgets/node';
import { DrawingsWidget } from '../../cartography/widgets/drawings';
import { DrawingService } from '../../services/drawing.service';
import { MapNodeToNodeConverter } from '../../cartography/converters/map/map-node-to-node-converter';
import { SettingsService, Settings } from '../../services/settings.service';
import { D3MapComponent } from '../../cartography/components/d3-map/d3-map.component';
import { ToolsService } from '../../services/tools.service';
import { DrawingContextMenu, LinkContextMenu } from '../../cartography/events/event-source';
import { MapDrawingToDrawingConverter } from '../../cartography/converters/map/map-drawing-to-drawing-converter';
import { SelectionManager } from '../../cartography/managers/selection-manager';
import { SelectionTool } from '../../cartography/tools/selection-tool';
import { MapDrawing } from '../../cartography/models/map/map-drawing';
import { MapLabel } from '../../cartography/models/map/map-label';
import { Label } from '../../cartography/models/label';
import { MapNode } from '../../cartography/models/map/map-node';
import { MapLabelToLabelConverter } from '../../cartography/converters/map/map-label-to-label-converter';
import { RecentlyOpenedProjectService } from '../../services/recentlyOpenedProject.service';
import { MapLink } from '../../cartography/models/map/map-link';
import { MapLinkToLinkConverter } from '../../cartography/converters/map/map-link-to-link-converter';
import { MovingEventSource } from '../../cartography/events/moving-event-source';
import { LinkWidget } from '../../cartography/widgets/link';
import { MapScaleService } from '../../services/mapScale.service';
import { NodeCreatedLabelStylesFixer } from './helpers/node-created-label-styles-fixer';


@Component({
  selector: 'app-project-map',
  encapsulation: ViewEncapsulation.None,
  templateUrl: './project-map.component.html',
  styleUrls: ['./project-map.component.scss']
})
export class ProjectMapComponent implements OnInit, OnDestroy {
  public nodes: Node[] = [];
  public links: Link[] = [];
  public drawings: Drawing[] = [];
  public symbols: Symbol[] = [];
  public project: Project;
  public server: Server;
  public selectedDrawing: string;
  private ws: Subject<any>;

  tools = {
    selection: true,
    moving: false,
    draw_link: false,
    text_editing: true
  };

  protected settings: Settings;

  protected drawTools = {
    isRectangleChosen: false,
    isEllipseChosen: false,
    isLineChosen: false,
    isTextChosen: false,
    visibility: false
  };

  private inReadOnlyMode = false;

  @ViewChild(ContextMenuComponent) contextMenu: ContextMenuComponent;
  @ViewChild(D3MapComponent) mapChild: D3MapComponent;

  private subscriptions: Subscription[] = [];

  constructor(
    private route: ActivatedRoute,
    private serverService: ServerService,
    private projectService: ProjectService,
    private nodeService: NodeService,
    public drawingService: DrawingService,
    private progressService: ProgressService,
    private projectWebServiceHandler: ProjectWebServiceHandler,
    private mapChangeDetectorRef: MapChangeDetectorRef,
    private nodeWidget: NodeWidget,
    private drawingsWidget: DrawingsWidget,
    private linkWidget: LinkWidget,
    private mapNodeToNode: MapNodeToNodeConverter,
    private mapDrawingToDrawing: MapDrawingToDrawingConverter,
    private mapLabelToLabel: MapLabelToLabelConverter,
    private mapLinkToLink: MapLinkToLinkConverter,
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
    private nodeCreatedLabelStylesFixer: NodeCreatedLabelStylesFixer
  ) {}

  ngOnInit() {
    this.settings = this.settingsService.getAll();

    this.progressService.activate();
    const routeSub = this.route.paramMap.subscribe((paramMap: ParamMap) => {
      const server_id = parseInt(paramMap.get('server_id'), 10);

      from(this.serverService.get(server_id))
        .pipe(
          mergeMap((server: Server) => {
            this.server = server;
            return this.projectService.get(server, paramMap.get('project_id')).pipe(
              map(project => {
                return project;
              })
            );
          }),
          mergeMap((project: Project) => {
            this.project = project;
            
            this.recentlyOpenedProjectService.setServerId(this.server.id.toString());
            this.recentlyOpenedProjectService.setProjectId(this.project.project_id);

            if (this.project.status === 'opened') {
              return new Observable<Project>(observer => {
                observer.next(this.project);
              });
            } else {
              return this.projectService.open(this.server, this.project.project_id);
            }
          })
        )
        .subscribe(
          (project: Project) => {
            this.onProjectLoad(project);
          },
          error => {
            this.progressService.setError(error);
          },
          () => {
            this.progressService.deactivate();
          }
        );
    });

    this.subscriptions.push(routeSub);

    this.subscriptions.push(
      this.drawingsDataSource.changes.subscribe((drawings: Drawing[]) => {
        this.drawings = drawings;
        this.mapChangeDetectorRef.detectChanges();
      })
    );

    this.subscriptions.push(
      this.nodesDataSource.changes.subscribe((nodes: Node[]) => {
        nodes.forEach((node: Node) => {
          node.symbol_url = `http://${this.server.host}:${this.server.port}/v2/symbols/${node.symbol}/raw`;
        });

        this.nodes = nodes;
        this.mapChangeDetectorRef.detectChanges();
      })
    );

    this.subscriptions.push(
      this.linksDataSource.changes.subscribe((links: Link[]) => {
        this.links = links;
        this.mapChangeDetectorRef.detectChanges();
      })
    );

    this.addKeyboardListeners();
  }

  addKeyboardListeners() {
    Mousetrap.bind('ctrl++', (event: Event) => {
      event.preventDefault();
    });

    Mousetrap.bind('ctrl+-', (event: Event) => {
      event.preventDefault();
    });;
  }

  onProjectLoad(project: Project) {
    this.readonly = this.projectService.isReadOnly(project);

    const subscription = this.projectService
      .nodes(this.server, project.project_id)
      .pipe(
        mergeMap((nodes: Node[]) => {
          this.nodesDataSource.set(nodes);
          return this.projectService.links(this.server, project.project_id);
        }),
        mergeMap((links: Link[]) => {
          this.linksDataSource.set(links);
          return this.projectService.drawings(this.server, project.project_id);
        })
      )
      .subscribe((drawings: Drawing[]) => {
        this.drawingsDataSource.set(drawings);

        this.setUpMapCallbacks();
        this.setUpWS(project);

        this.progressService.deactivate();
      });
    this.subscriptions.push(subscription);
  }

  setUpWS(project: Project) {
    this.ws = webSocket(this.projectService.notificationsPath(this.server, project.project_id));

    this.subscriptions.push(this.projectWebServiceHandler.connect(this.ws));
  }

  setUpMapCallbacks() {
    if (!this.readonly) {
      this.toolsService.selectionToolActivation(true);
    }

    const onLinkContextMenu = this.linkWidget.onContextMenu.subscribe((eventLink: LinkContextMenu) => {
      const link = this.mapLinkToLink.convert(eventLink.link);
      this.contextMenu.openMenuForListOfElements([], [], [], [link], eventLink.event.pageY, eventLink.event.pageX);
    });

    const onNodeContextMenu = this.nodeWidget.onContextMenu.subscribe((eventNode: NodeContextMenu) => {
      const node = this.mapNodeToNode.convert(eventNode.node);
      this.contextMenu.openMenuForNode(node, eventNode.event.pageY, eventNode.event.pageX);
    });

    const onDrawingContextMenu = this.drawingsWidget.onContextMenu.subscribe((eventDrawing: DrawingContextMenu) => {
      const drawing = this.mapDrawingToDrawing.convert(eventDrawing.drawing);
      this.contextMenu.openMenuForDrawing(drawing, eventDrawing.event.pageY, eventDrawing.event.pageX);
    });

    const onContextMenu = this.selectionTool.contextMenuOpened.subscribe((event) => {
      const selectedItems = this.selectionManager.getSelected();
      if (selectedItems.length === 0 || !(event instanceof MouseEvent)) return;

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
          links.push(this.mapLinkToLink.convert(elem))
        }
      });

      this.contextMenu.openMenuForListOfElements(drawings, nodes, labels, links, event.pageY, event.pageX);
    });

    this.subscriptions.push(onLinkContextMenu);
    this.subscriptions.push(onNodeContextMenu);
    this.subscriptions.push(onDrawingContextMenu);
    this.subscriptions.push(onContextMenu);
    this.mapChangeDetectorRef.detectChanges();
  }

  onNodeCreation(template: Template) {
    if(!template) {
      return;
    }
    
    this.nodeService.createFromTemplate(this.server, this.project, template, 0, 0, 'local').subscribe(() => {
      this.projectService.nodes(this.server, this.project.project_id).subscribe((nodes: Node[]) => {

        nodes.filter((node) => node.label.style === null).forEach((node) => {
          const fixedNode = this.nodeCreatedLabelStylesFixer.fix(node);
          this.nodeService.updateLabel(this.server, node, fixedNode.label).subscribe();
        });

        this.nodesDataSource.set(nodes);
      });
    });
  }

  public onDrawingSaved() {
    this.resetDrawToolChoice();
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
    this.project.show_interface_labels = enabled;
  }

  public addDrawing(selectedObject: string) {
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

  public resetDrawToolChoice() {
    this.drawTools.isRectangleChosen = false;
    this.drawTools.isEllipseChosen = false;
    this.drawTools.isLineChosen = false;
    this.drawTools.isTextChosen = false;
    this.selectedDrawing = '';
    this.toolsService.textAddingToolActivation(this.drawTools.isTextChosen);
  }

  public hideMenu() {
    this.resetDrawToolChoice();
    this.drawTools.visibility = false;
  }

  public showMenu() {
    this.drawTools.visibility = true;
  }

  zoomIn() {
    this.mapScaleService.setScale(this.mapScaleService.getScale() + 0.1);
  }

  zoomOut() {
    let currentScale = this.mapScaleService.getScale();

    if ((currentScale - 0.1) > 0) {
      this.mapScaleService.setScale(currentScale - 0.1);
    }
  }

  resetZoom() {
    this.mapScaleService.resetToDefault();
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
      this.drawingService.add(this.server, this.project.project_id, -(imageToUpload.width/2), -(imageToUpload.height/2), svg).subscribe(() => {});
    }
        
    imageToUpload.onload = () => { fileReader.readAsDataURL(file) };
    imageToUpload.src = window.URL.createObjectURL(file);
  }

  public ngOnDestroy() {
    this.drawingsDataSource.clear();
    this.nodesDataSource.clear();
    this.linksDataSource.clear();

    if (this.ws) {
      this.ws.unsubscribe();
    }
    this.subscriptions.forEach((subscription: Subscription) => subscription.unsubscribe());
  }
}
