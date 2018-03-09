import {Component, Inject, OnInit, ViewChild, ViewEncapsulation} from '@angular/core';
import { ActivatedRoute, ParamMap } from '@angular/router';

import { Observable } from 'rxjs/Observable';
import { Subject } from "rxjs/Subject";

import 'rxjs/add/operator/switchMap';
import 'rxjs/add/operator/mergeMap';
import 'rxjs/add/observable/forkJoin';
import 'rxjs/add/observable/fromPromise';
import 'rxjs/add/observable/dom/webSocket';


import { Project } from '../shared/models/project';
import { Node } from '../cartography/shared/models/node.model';
import { SymbolService } from '../shared/services/symbol.service';
import { Link } from "../cartography/shared/models/link.model";
import { MapComponent } from "../cartography/map/map.component";
import { ServerService } from "../shared/services/server.service";
import { ProjectService } from '../shared/services/project.service';
import { Server } from "../shared/models/server";
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef, MatSnackBar } from "@angular/material";
import { SnapshotService } from "../shared/services/snapshot.service";
import { Snapshot } from "../shared/models/snapshot";
import { ProgressDialogService } from "../shared/progress-dialog/progress-dialog.service";
import { ProgressDialogComponent } from "../shared/progress-dialog/progress-dialog.component";
import { Drawing } from "../cartography/shared/models/drawing.model";
import { NodeContextMenuComponent } from "../shared/node-context-menu/node-context-menu.component";
import { Appliance } from "../shared/models/appliance";
import { NodeService } from "../shared/services/node.service";
import { Symbol } from "../shared/models/symbol";
import { NodeSelectInterfaceComponent } from "../shared/node-select-interface/node-select-interface.component";
import { Port } from "../shared/models/port";
import { LinkService } from "../shared/services/link.service";
import { ToasterService } from '../shared/services/toaster.service';


@Component({
  selector: 'app-project-map',
  encapsulation: ViewEncapsulation.None,
  templateUrl: './project-map.component.html',
  styleUrls: ['./project-map.component.css'],
})
export class ProjectMapComponent implements OnInit {
  public nodes: Node[] = [];
  public links: Link[] = [];
  public drawings: Drawing[] = [];
  public symbols: Symbol[] = [];

  project: Project;
  public server: Server;

  private ws: Subject<any>;
  private drawLineMode =  false;
  public isLoading = true;

  @ViewChild(MapComponent) mapChild: MapComponent;

  @ViewChild(NodeContextMenuComponent) nodeContextMenu: NodeContextMenuComponent;
  @ViewChild(NodeSelectInterfaceComponent) nodeSelectInterfaceMenu: NodeSelectInterfaceComponent;

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
              private toaster: ToasterService) {
  }

  ngOnInit() {
    this.route.paramMap.subscribe((paramMap: ParamMap) => {
      const server_id = parseInt(paramMap.get('server_id'), 10);
      Observable
        .fromPromise(this.serverService.get(server_id))
        .flatMap((server: Server) => {
          this.server = server;
          return this.projectService.get(server, paramMap.get('project_id'));
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

    this.symbolService.symbols.subscribe((symbols: Symbol[]) => {
      this.symbols = symbols;
    });

  }

  onProjectLoad(project: Project) {
    this.symbolService
      .load(this.server)
      .flatMap(() => {
        return this.projectService.drawings(this.server, project.project_id);
      })
      .flatMap((drawings: Drawing[]) => {
        this.drawings = drawings;
        return this.projectService.links(this.server, project.project_id);
      })
      .flatMap((links: Link[]) => {
        this.links = links;
        return this.projectService.nodes(this.server, project.project_id);
      })
      .subscribe((nodes: Node[]) => {
        this.nodes = nodes;

        this.setUpMapCallbacks(project);
        this.setUpWS(project);
        this.isLoading = false;
      });


  }

  setUpWS(project: Project) {
    this.ws = Observable.webSocket(
      this.projectService.notificationsPath(this.server, project.project_id));

    this.ws.subscribe((o: any) => {
      if (o.action === 'node.updated') {
        const node: Node = o.event;
        const index = this.nodes.findIndex((n: Node) => n.node_id === node.node_id);
        if (index >= 0) {
          this.nodes[index] = node;
          this.mapChild.reload(); // temporary invocation
        }
      }
      if (o.action === 'node.created') {
        const node: Node = o.event;
        const index = this.nodes.findIndex((n: Node) => n.node_id === node.node_id);
        if (index === -1) {
          this.nodes.push(node);
          this.mapChild.reload(); // temporary invocation
        }
      }
      if (o.action === 'node.deleted') {
        const node: Node = o.event;
        const index = this.nodes.findIndex((n: Node) => n.node_id === node.node_id);
        if (index >= 0) {
          this.nodes.splice(index, 1);
          this.mapChild.reload(); // temporary invocation
        }
      }
      if (o.action === 'link.created') {
        const link: Link = o.event;
        const index = this.links.findIndex((l: Link) => l.link_id === link.link_id);
        if (index === -1) {
          this.links.push(link);
          this.mapChild.reload(); // temporary invocation
        }
      }
      if (o.action === 'link.updated') {
        const link: Link = o.event;
        const index = this.links.findIndex((l: Link) => l.link_id === link.link_id);
        if (index >= 0) {
          this.links[index] = link;
          this.mapChild.reload(); // temporary invocation
        }
      }
      if (o.action === 'link.deleted') {
        const link: Link = o.event;
        const index = this.links.findIndex((l: Link) => l.link_id === link.link_id);
        if (index >= 0) {
          this.links.splice(index, 1);
          this.mapChild.reload(); // temporary invocation
        }
      }
    });
  }


  setUpMapCallbacks(project: Project) {
    this.mapChild.graphLayout.getNodesWidget().setOnContextMenuCallback((event: any, node: Node) => {
      this.nodeContextMenu.open(node, event.clientY, event.clientX);
    });

    this.mapChild.graphLayout.getNodesWidget().setOnNodeClickedCallback((event: any, node: Node) => {
      if (this.drawLineMode) {
        this.nodeSelectInterfaceMenu.open(node, event.clientY, event.clientX);
      }
    });

    this.mapChild.graphLayout.getNodesWidget().setOnNodeDraggedCallback((event: any, node: Node) => {
      const index = this.nodes.findIndex((n: Node) => n.node_id === node.node_id);
      if (index >= 0) {
        this.nodes[index] = node;
        this.mapChild.reload(); // temporary invocation

        this.nodeService
          .updatePosition(this.server, node, node.x, node.y)
          .subscribe((n: Node) => {
            this.nodes[index] = node;
            this.mapChild.reload(); // temporary invocation
          });
      }
    });
  }

  onNodeCreation(appliance: Appliance) {
    this.nodeService
      .createFromAppliance(this.server, this.project, appliance, 0, 0, 'local')
      .subscribe(() => {
        this.projectService
          .nodes(this.server, this.project.project_id)
          .subscribe((nodes: Node[]) => {
            this.nodes = nodes;
            this.mapChild.reload();
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

  public turnOnDrawLineMode() {
    this.drawLineMode = true;
  }

  public turnOffDrawLineMode() {
    this.drawLineMode = false;
    this.mapChild.graphLayout.getDrawingLineTool().stop();
  }

  public onChooseInterface(event) {
    const node: Node = event.node;
    const port: Port = event.port;
    const drawingLineTool = this.mapChild.graphLayout.getDrawingLineTool();
    if (drawingLineTool.isDrawing()) {
      const data = drawingLineTool.stop();
      this.onLineCreation(data['node'], data['port'], node, port);
    } else {
      drawingLineTool.start(node.x, node.y, {
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
          this.links = links;
          this.mapChild.reload();
        });
      });
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

