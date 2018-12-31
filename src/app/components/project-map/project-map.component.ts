import { Component, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute, ParamMap } from '@angular/router';

import { Observable, Subject, Subscription, from } from 'rxjs';
import { webSocket } from "rxjs/webSocket";
import { map, mergeMap } from "rxjs/operators";

import { Project } from '../../models/project';
import { Node } from '../../cartography/models/node';
import { Link } from "../../models/link";
import { ServerService } from "../../services/server.service";
import { ProjectService } from '../../services/project.service';
import { Server } from "../../models/server";
import { Drawing } from "../../cartography/models/drawing";
import { NodeContextMenuComponent } from "./node-context-menu/node-context-menu.component";
import { Template } from "../../models/template";
import { NodeService } from "../../services/node.service";
import { Symbol } from "../../models/symbol";
import { NodesDataSource } from "../../cartography/datasources/nodes-datasource";
import { LinksDataSource } from "../../cartography/datasources/links-datasource";
import { ProjectWebServiceHandler } from "../../handlers/project-web-service-handler";
import { DrawingsDataSource } from "../../cartography/datasources/drawings-datasource";
import { ProgressService } from "../../common/progress/progress.service";
import { MapChangeDetectorRef } from '../../cartography/services/map-change-detector-ref';
import { NodeContextMenu } from '../../cartography/events/nodes';
import { NodeWidget } from '../../cartography/widgets/node';
import { DrawingService } from '../../services/drawing.service';
import { MapNodeToNodeConverter } from '../../cartography/converters/map/map-node-to-node-converter';
import { SettingsService, Settings } from '../../services/settings.service';
import { D3MapComponent } from '../../cartography/components/d3-map/d3-map.component';
import { ToolsService } from '../../services/tools.service';


@Component({
  selector: 'app-project-map',
  encapsulation: ViewEncapsulation.None,
  templateUrl: './project-map.component.html',
  styleUrls: ['./project-map.component.css'],
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
    'selection': true,
    'moving': false,
    'draw_link': false,
    'text_editing': true
  };

  protected settings: Settings;

  protected drawTools = {
    'isRectangleChosen': false,
    'isEllipseChosen': false,
    'isLineChosen': false,
    'isTextChosen': false,
    'visibility': false
  };

  private inReadOnlyMode = false;

  @ViewChild(NodeContextMenuComponent) nodeContextMenu: NodeContextMenuComponent;
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
    private mapNodeToNode: MapNodeToNodeConverter,
    private nodesDataSource: NodesDataSource,
    private linksDataSource: LinksDataSource,
    private drawingsDataSource: DrawingsDataSource,
    private settingsService: SettingsService,
    private toolsService: ToolsService
  ) {}

  ngOnInit() {
    this.settings = this.settingsService.getAll();
    
    this.progressService.activate();
    const routeSub = this.route.paramMap.subscribe((paramMap: ParamMap) => {
      const server_id = parseInt(paramMap.get('server_id'), 10);

      from(this.serverService.get(server_id)).pipe(
        mergeMap((server: Server) => {
          this.server = server;
          return this.projectService.get(server, paramMap.get('project_id')).pipe(map((project) => {
            return project;
          }));
        }),
        mergeMap((project: Project) => {
          this.project = project;

          if (this.project.status === 'opened') {
            return new Observable<Project>((observer) => {
              observer.next(this.project);
            });
          } else {
            return this.projectService.open(
              this.server, this.project.project_id);
          }
        })
      )
      .subscribe((project: Project) => {
        this.onProjectLoad(project);
      }, (error) => {
        this.progressService.setError(error);
      }, () => {
          this.progressService.deactivate();
      });
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
          node.symbol_url = `http://${this.server.ip}:${this.server.port}/v2/symbols/${node.symbol}/raw`;
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
    this.ws = webSocket(
      this.projectService.notificationsPath(this.server, project.project_id));

    this.subscriptions.push(
      this.projectWebServiceHandler.connect(this.ws)
    );
  }

  setUpMapCallbacks() {
    const onContextMenu = this.nodeWidget.onContextMenu.subscribe((eventNode: NodeContextMenu) => {
      const node = this.mapNodeToNode.convert(eventNode.node);
      this.nodeContextMenu.open(
        node,
        eventNode.event.clientY,
        eventNode.event.clientX
      );
    });

    this.subscriptions.push(onContextMenu);
    this.mapChangeDetectorRef.detectChanges();
  }

  onNodeCreation(template: Template) {
    this.nodeService
      .createFromTemplate(this.server, this.project, template, 0, 0, 'local')
      .subscribe(() => {
          this.projectService
            .nodes(this.server, this.project.project_id)
            .subscribe((nodes: Node[]) => {
              this.nodesDataSource.set(nodes);
            });
        });
  }

  public onDrawingSaved(){
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
    this.toolsService.movingToolActivation(this.tools.moving);
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
      case "rectangle":
        this.drawTools.isTextChosen = false;
        this.drawTools.isEllipseChosen = false;
        this.drawTools.isRectangleChosen = !this.drawTools.isRectangleChosen;
        this.drawTools.isLineChosen = false;
        break;
      case "ellipse":
        this.drawTools.isTextChosen = false;
        this.drawTools.isEllipseChosen = !this.drawTools.isEllipseChosen;
        this.drawTools.isRectangleChosen = false;
        this.drawTools.isLineChosen = false;
        break;
      case "line":
        this.drawTools.isTextChosen = false;
        this.drawTools.isEllipseChosen = false;
        this.drawTools.isRectangleChosen = false;
        this.drawTools.isLineChosen = !this.drawTools.isLineChosen;
        break;
      case "text":
        this.drawTools.isTextChosen = !this.drawTools.isTextChosen;
        this.drawTools.isEllipseChosen = false;
        this.drawTools.isRectangleChosen = false;
        this.drawTools.isLineChosen = false;
        this.toolsService.textAddingToolActivation(this.drawTools.isTextChosen);
        break;
    }

    this.selectedDrawing = this.selectedDrawing === selectedObject ? "" : selectedObject;
  }

  public resetDrawToolChoice() {
    this.drawTools.isRectangleChosen = false;
    this.drawTools.isEllipseChosen = false;
    this.drawTools.isLineChosen = false;
    this.drawTools.isTextChosen = false;
    this.selectedDrawing = "";
    this.toolsService.textAddingToolActivation(this.drawTools.isTextChosen);
  }

  public hideMenu(){
    this.resetDrawToolChoice();
    this.drawTools.visibility = false;
  }

  public showMenu() {
    setTimeout(() => {
      this.drawTools.visibility = true;
    },
    200);
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
