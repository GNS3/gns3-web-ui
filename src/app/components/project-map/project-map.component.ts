import { Component, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute, ParamMap } from '@angular/router';

import { Observable, Subject, Subscription, from } from 'rxjs';
import { webSocket } from "rxjs/webSocket";
import { map, mergeMap } from "rxjs/operators";

import { Project } from '../../models/project';
import { Node } from '../../cartography/models/node';
import { SymbolService } from '../../services/symbol.service';
import { Link } from "../../models/link";
import { MapComponent } from "../../cartography/components/map/map.component";
import { ServerService } from "../../services/server.service";
import { ProjectService } from '../../services/project.service';
import { Server } from "../../models/server";
import { Drawing } from "../../cartography/models/drawing";
import { NodeContextMenuComponent } from "./node-context-menu/node-context-menu.component";
import { Appliance } from "../../models/appliance";
import { NodeService } from "../../services/node.service";
import { Symbol } from "../../models/symbol";
import { NodeSelectInterfaceComponent } from "./node-select-interface/node-select-interface.component";
import { Port } from "../../models/port";
import { LinkService } from "../../services/link.service";
import { NodesDataSource } from "../../cartography/datasources/nodes-datasource";
import { LinksDataSource } from "../../cartography/datasources/links-datasource";
import { ProjectWebServiceHandler } from "../../handlers/project-web-service-handler";
import { SelectionManager } from "../../cartography/managers/selection-manager";
import { InRectangleHelper } from "../../cartography/helpers/in-rectangle-helper";
import { DrawingsDataSource } from "../../cartography/datasources/drawings-datasource";
import { ProgressService } from "../../common/progress/progress.service";
import { NodeEvent } from '../../cartography/widgets/nodes';
import { MapChangeDetectorRef } from '../../cartography/services/map-change-detector-ref';


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

  project: Project;
  public server: Server;

  private ws: Subject<any>;
  private drawLineMode =  false;

  protected tools = {
    'selection': true,
    'moving': false
  };

  private inReadOnlyMode = false;

  protected selectionManager: SelectionManager;

  @ViewChild(MapComponent) mapChild: MapComponent;

  @ViewChild(NodeContextMenuComponent) nodeContextMenu: NodeContextMenuComponent;
  @ViewChild(NodeSelectInterfaceComponent) nodeSelectInterfaceMenu: NodeSelectInterfaceComponent;

  private subscriptions: Subscription[];

  constructor(
              private route: ActivatedRoute,
              private serverService: ServerService,
              private projectService: ProjectService,
              private symbolService: SymbolService,
              private nodeService: NodeService,
              private linkService: LinkService,
              private progressService: ProgressService,
              private projectWebServiceHandler: ProjectWebServiceHandler,
              private mapChangeDetectorRef: MapChangeDetectorRef,
              protected nodesDataSource: NodesDataSource,
              protected linksDataSource: LinksDataSource,
              protected drawingsDataSource: DrawingsDataSource,
              ) {
    this.selectionManager = new SelectionManager(
      this.nodesDataSource, this.linksDataSource, this.drawingsDataSource, new InRectangleHelper());

    this.subscriptions = [];
  }

  ngOnInit() {
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
      this.symbolService.symbols.subscribe((symbols: Symbol[]) => {
        this.symbols = symbols;
      })
    );

    this.subscriptions.push(
      this.drawingsDataSource.changes.subscribe((drawings: Drawing[]) => {
        this.drawings = drawings;
        this.mapChangeDetectorRef.detectChanges();
      })
    );

    this.subscriptions.push(
      this.nodesDataSource.changes.subscribe((nodes: Node[]) => {
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

    const subscription = this.symbolService
      .load(this.server)
      .pipe(
        mergeMap(() => {
          return this.projectService.nodes(this.server, project.project_id);
        }),
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

        this.setUpMapCallbacks(project);
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

  setUpMapCallbacks(project: Project) {
    this.mapChild.graphLayout.getNodesWidget().setDraggingEnabled(!this.readonly);

    const onContextMenu = this.mapChild.graphLayout.getNodesWidget().onContextMenu.subscribe((eventNode: NodeEvent) => {
      this.nodeContextMenu.open(eventNode.node, eventNode.event.clientY, eventNode.event.clientX);
    });

    this.subscriptions.push(onContextMenu);

    const onNodeClicked = this.mapChild.graphLayout.getNodesWidget().onNodeClicked.subscribe((eventNode: NodeEvent) => {
      this.selectionManager.clearSelection();
      this.selectionManager.setSelectedNodes([eventNode.node]);
      if (this.drawLineMode) {
        this.nodeSelectInterfaceMenu.open(eventNode.node, eventNode.event.clientY, eventNode.event.clientX);
      }
    });

    this.subscriptions.push(onNodeClicked);

    this.subscriptions.push(
      this.selectionManager.subscribe(
        this.mapChild.graphLayout.getSelectionTool().rectangleSelected)
    );

    this.mapChangeDetectorRef.detectChanges();
  }

  onNodeCreation(appliance: Appliance) {
    this.nodeService
      .createFromAppliance(this.server, this.project, appliance, 0, 0, 'local')
      .subscribe(() => {
        this.projectService
          .nodes(this.server, this.project.project_id)
          .subscribe((nodes: Node[]) => {
            this.nodesDataSource.set(nodes);
        });
      });
  }

  onNodeDragged(nodeEvent: NodeEvent) {
    this.nodesDataSource.update(nodeEvent.node);
    this.nodeService
      .updatePosition(this.server, nodeEvent.node, nodeEvent.node.x, nodeEvent.node.y)
      .subscribe((n: Node) => {
        this.nodesDataSource.update(n);
      });
  }

  public set readonly(value) {
    this.inReadOnlyMode = value;
    if (value) {
      this.tools.selection = false;
    }
    else {
      this.tools.selection = true;
    }
  }

  public get readonly() {
    return this.inReadOnlyMode;
  }

  public toggleMovingMode() {
    this.tools.moving = !this.tools.moving;
    if (!this.readonly) {
      this.tools.selection = !this.tools.moving;
    }
  }

  public toggleDrawLineMode() {
    this.drawLineMode = !this.drawLineMode;
    if (!this.drawLineMode) {
      this.mapChild.graphLayout.getDrawingLineTool().stop();
    }
  }

  public onChooseInterface(event) {
    const node: Node = event.node;
    const port: Port = event.port;
    const drawingLineTool = this.mapChild.graphLayout.getDrawingLineTool();
    if (drawingLineTool.isDrawing()) {
      const data = drawingLineTool.stop();
      this.onLineCreation(data['node'], data['port'], node, port);
    } else {
      drawingLineTool.start(node.x + node.width / 2., node.y + node.height / 2., {
        'node': node,
        'port': port
      });
    }
  }

  public onLineCreation(source_node: Node, source_port: Port, target_node: Node, target_port: Port) {
    this.linkService
      .createLink(this.server, source_node, source_port, target_node, target_port)
      .subscribe(() => {
        this.projectService.links(this.server, this.project.project_id).subscribe((links: Link[]) => {
          this.linksDataSource.set(links);
        });
      });
  }

  public toggleShowInterfaceLabels(enabled: boolean) {
    this.project.show_interface_labels = enabled;
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
