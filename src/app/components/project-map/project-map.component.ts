import { Component, Inject, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute, ParamMap } from '@angular/router';

import { Observable } from 'rxjs/Observable';
import { Subject } from "rxjs/Subject";

import 'rxjs/add/operator/switchMap';
import 'rxjs/add/operator/mergeMap';
import 'rxjs/add/observable/forkJoin';
import 'rxjs/add/observable/fromPromise';
import 'rxjs/add/observable/dom/webSocket';


import { Project } from '../../models/project';
import { Node } from '../../cartography/models/node';
import { SymbolService } from '../../services/symbol.service';
import { Link } from "../../cartography/models/link";
import { MapComponent } from "../../cartography/components/map/map.component";
import { ServerService } from "../../services/server.service";
import { ProjectService } from '../../services/project.service';
import { Server } from "../../models/server";
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from "@angular/material";
import { SnapshotService } from "../../services/snapshot.service";
import { Snapshot } from "../../models/snapshot";
import { ProgressDialogService } from "../../common/progress-dialog/progress-dialog.service";
import { ProgressDialogComponent } from "../../common/progress-dialog/progress-dialog.component";
import { Drawing } from "../../cartography/models/drawing";
import { NodeContextMenuComponent } from "./node-context-menu/node-context-menu.component";
import { Appliance } from "../../models/appliance";
import { NodeService } from "../../services/node.service";
import { Symbol } from "../../cartography/models/symbol";
import { NodeSelectInterfaceComponent } from "./node-select-interface/node-select-interface.component";
import { Port } from "../../models/port";
import { LinkService } from "../../services/link.service";
import { ToasterService } from '../../services/toaster.service';
import { NodesDataSource } from "../../cartography/datasources/nodes-datasource";
import { LinksDataSource } from "../../cartography/datasources/links-datasource";
import { ProjectWebServiceHandler } from "../../handlers/project-web-service-handler";
import { SelectionManager } from "../../cartography/managers/selection-manager";
import { InRectangleHelper } from "../../cartography/components/map/helpers/in-rectangle-helper";
import { DrawingsDataSource } from "../../cartography/datasources/drawings-datasource";
import { Subscription } from "rxjs/Subscription";
import { SettingsService } from "../../services/settings.service";


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
  private movingMode = false;
  private readonly = false;

  protected selectionManager: SelectionManager;

  public isLoading = true;

  @ViewChild(MapComponent) mapChild: MapComponent;

  @ViewChild(NodeContextMenuComponent) nodeContextMenu: NodeContextMenuComponent;
  @ViewChild(NodeSelectInterfaceComponent) nodeSelectInterfaceMenu: NodeSelectInterfaceComponent;

  private subscriptions: Subscription[];

  constructor(
              private route: ActivatedRoute,
              private serverService: ServerService,
              private projectService: ProjectService,
              private symbolService: SymbolService,
              private snapshotService: SnapshotService,
              private nodeService: NodeService,
              private linkService: LinkService,
              private dialog: MatDialog,
              private progressDialogService: ProgressDialogService,
              private toaster: ToasterService,
              private projectWebServiceHandler: ProjectWebServiceHandler,
              private settingsService: SettingsService,
              protected nodesDataSource: NodesDataSource,
              protected linksDataSource: LinksDataSource,
              protected drawingsDataSource: DrawingsDataSource,
              ) {
    this.selectionManager = new SelectionManager(
      this.nodesDataSource, this.linksDataSource, this.drawingsDataSource, new InRectangleHelper());

    this.subscriptions = [];
  }

  ngOnInit() {

    const routeSub = this.route.paramMap.subscribe((paramMap: ParamMap) => {
      const server_id = parseInt(paramMap.get('server_id'), 10);
      Observable
        .fromPromise(this.serverService.get(server_id))
        .flatMap((server: Server) => {
          this.server = server;
          return this.projectService.get(server, paramMap.get('project_id')).map((project) => {
            return project;
          });
        })
        .flatMap((project: Project) => {
          this.project = project;

          if (this.project.status === 'opened') {
            return new Observable((observer) => {
              observer.next(this.project);
            });
          } else {
            return this.projectService.open(
              this.server, this.project.project_id);
          }
        })
        .subscribe((project: Project) => {
          this.onProjectLoad(project);
        });
    });

    this.subscriptions.push(routeSub);

    this.subscriptions.push(
      this.symbolService.symbols.subscribe((symbols: Symbol[]) => {
        this.symbols = symbols;
      })
    );

    this.subscriptions.push(
      this.drawingsDataSource.connect().subscribe((drawings: Drawing[]) => {
        this.drawings = drawings;
        if (this.mapChild) {
          this.mapChild.reload();
        }
      })
    );

    this.subscriptions.push(
      this.nodesDataSource.connect().subscribe((nodes: Node[]) => {
        this.nodes = nodes;
        if (this.mapChild) {
          this.mapChild.reload();
        }
      })
    );

    this.subscriptions.push(
      this.linksDataSource.connect().subscribe((links: Link[]) => {
        this.links = links;
        if (this.mapChild) {
          this.mapChild.reload();
        }
      })
    );
  }

  onProjectLoad(project: Project) {
    this.readonly = this.projectService.isReadOnly(project);

    const subscription = this.symbolService
      .load(this.server)
      .flatMap(() => {
        return this.projectService.nodes(this.server, project.project_id);
      })
      .flatMap((nodes: Node[]) => {
        this.nodesDataSource.set(nodes);
        return this.projectService.links(this.server, project.project_id);
      })
      .flatMap((links: Link[]) => {
        this.linksDataSource.set(links);
        return this.projectService.drawings(this.server, project.project_id);
      })
      .subscribe((drawings: Drawing[]) => {
        this.drawingsDataSource.set(drawings);

        this.setUpMapCallbacks(project);
        this.setUpWS(project);
        this.isLoading = false;
      });
    this.subscriptions.push(subscription);
  }

  setUpWS(project: Project) {
    this.ws = Observable.webSocket(
      this.projectService.notificationsPath(this.server, project.project_id));

    this.subscriptions.push(
      this.projectWebServiceHandler.connect(this.ws)
    );
  }

  setUpMapCallbacks(project: Project) {
    if (this.readonly) {
        this.mapChild.graphLayout.getSelectionTool().deactivate();
    }

    this.mapChild.graphLayout.getNodesWidget().setDraggingEnabled(!this.readonly);

    this.mapChild.graphLayout.getNodesWidget().setOnContextMenuCallback((event: any, node: Node) => {
      this.nodeContextMenu.open(node, event.clientY, event.clientX);
    });

    this.mapChild.graphLayout.getNodesWidget().setOnNodeClickedCallback((event: any, node: Node) => {
      this.selectionManager.clearSelection();
      this.selectionManager.setSelectedNodes([node]);
      if (this.drawLineMode) {
        this.nodeSelectInterfaceMenu.open(node, event.clientY, event.clientX);
      }
    });

    this.mapChild.graphLayout.getNodesWidget().setOnNodeDraggedCallback((event: any, node: Node) => {
      this.nodesDataSource.update(node);
      this.nodeService
        .updatePosition(this.server, node, node.x, node.y)
        .subscribe((n: Node) => {
          this.nodesDataSource.update(n);
        });
    });

    this.subscriptions.push(
      this.selectionManager.subscribe(this.mapChild.graphLayout.getSelectionTool().rectangleSelected)
    );

    this.mapChild.graphLayout.getLinksWidget().getInterfaceLabelWidget().setEnabled(this.project.show_interface_labels);
    this.mapChild.reload();
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

  public createSnapshotModal() {
    const dialogRef = this.dialog.open(CreateSnapshotDialogComponent, {
      width: '250px',
    });

    dialogRef.afterClosed().subscribe(snapshot => {
      if (snapshot) {
        const creation = this.snapshotService.create(this.server, this.project.project_id, snapshot);

        const progress = this.progressDialogService.open();

        const subscription = creation.subscribe((created_snapshot: Snapshot) => {
          this.toaster.success(`Snapshot '${snapshot.name}' has been created.`);
          progress.close();
        }, (response) => {
          const error = response.json();
          this.toaster.error(`Cannot create snapshot: ${error.message}`);
          progress.close();
        });

        progress.afterClosed().subscribe((result) => {
          if (result === ProgressDialogComponent.CANCELLED) {
            subscription.unsubscribe();
          }
        });
      }
    });
  }

  public toggleDrawLineMode() {
    this.drawLineMode = !this.drawLineMode;
    if (!this.drawLineMode) {
      this.mapChild.graphLayout.getDrawingLineTool().stop();
    }
  }

  public toggleMovingMode() {
    this.movingMode = !this.movingMode;
    if (this.movingMode) {
      if (!this.readonly) {
        this.mapChild.graphLayout.getSelectionTool().deactivate();
      }
      this.mapChild.graphLayout.getMovingTool().activate();
    } else {
      this.mapChild.graphLayout.getMovingTool().deactivate();
      if (!this.readonly) {
        this.mapChild.graphLayout.getSelectionTool().activate();
      }
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

    this.mapChild.graphLayout.getLinksWidget().getInterfaceLabelWidget()
      .setEnabled(this.project.show_interface_labels);
    this.mapChild.reload();
  }

  public ngOnDestroy() {
    this.drawingsDataSource.clear();
    this.nodesDataSource.clear();
    this.linksDataSource.clear();

    this.ws.unsubscribe();
    this.subscriptions.forEach((subscription: Subscription) => subscription.unsubscribe());
  }

}


@Component({
  selector: 'app-create-snapshot-dialog',
  templateUrl: 'create-snapshot-dialog.html',
})
export class CreateSnapshotDialogComponent {
  snapshot: Snapshot = new Snapshot();

  constructor(
    public dialogRef: MatDialogRef<CreateSnapshotDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any) {
  }

  onAddClick(): void {
    this.dialogRef.close(this.snapshot);
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

}

