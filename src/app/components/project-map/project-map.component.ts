import { Component, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute, ParamMap } from '@angular/router';

import { Observable, Subject, Subscription, from } from 'rxjs';
import { webSocket } from "rxjs/webSocket";
import { map, mergeMap } from "rxjs/operators";

import { Project } from '../../models/project';
import { Node } from '../../cartography/models/node';
import { SymbolService } from '../../services/symbol.service';
import { Link } from "../../models/link";
import { ServerService } from "../../services/server.service";
import { ProjectService } from '../../services/project.service';
import { Server } from "../../models/server";
import { Drawing } from "../../cartography/models/drawing";
import { NodeContextMenuComponent } from "./node-context-menu/node-context-menu.component";
import { Appliance } from "../../models/appliance";
import { NodeService } from "../../services/node.service";
import { Symbol } from "../../models/symbol";
import { LinkService } from "../../services/link.service";
import { NodesDataSource } from "../../cartography/datasources/nodes-datasource";
import { LinksDataSource } from "../../cartography/datasources/links-datasource";
import { ProjectWebServiceHandler } from "../../handlers/project-web-service-handler";
import { DrawingsDataSource } from "../../cartography/datasources/drawings-datasource";
import { ProgressService } from "../../common/progress/progress.service";
import { MapChangeDetectorRef } from '../../cartography/services/map-change-detector-ref';
import { NodeContextMenu } from '../../cartography/events/nodes';
import { MapLinkCreated } from '../../cartography/events/links';
import { NodeWidget } from '../../cartography/widgets/node';
import { DraggedDataEvent, ResizedDataEvent } from '../../cartography/events/event-source';
import { DrawingService } from '../../services/drawing.service';
import { MapNodeToNodeConverter } from '../../cartography/converters/map/map-node-to-node-converter';
import { NodesEventSource } from '../../cartography/events/nodes-event-source';
import { DrawingsEventSource } from '../../cartography/events/drawings-event-source';
import { MapNode } from '../../cartography/models/map/map-node';
import { LinksEventSource } from '../../cartography/events/links-event-source';
import { MapDrawing } from '../../cartography/models/map/map-drawing';
import { MapPortToPortConverter } from '../../cartography/converters/map/map-port-to-port-converter';
import { MapDrawingToSvgConverter } from '../../cartography/converters/map/map-drawing-to-svg-converter';
import { DrawingElement } from '../../cartography/models/drawings/drawing-element';
import { RectElement } from '../../cartography/models/drawings/rect-element';
import { EllipseElement } from '../../cartography/models/drawings/ellipse-element';
import { LineElement } from '../../cartography/models/drawings/line-element';
import { SettingsService, Settings } from '../../services/settings.service';
import { MapLabel } from '../../cartography/models/map/map-label';
import { D3MapComponent } from '../../cartography/components/d3-map/d3-map.component';
import { MapLinkNode } from '../../cartography/models/map/map-link-node';


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
  private drawListener: Function;
  private ws: Subject<any>;

  protected tools = {
    'selection': true,
    'moving': false,
    'draw_link': false
  };
  protected settings: Settings;

  protected drawTools = {
    'isRectangleChosen': false,
    'isEllipseChosen': false,
    'isLineChosen': false,
    'visibility': false
  };

  protected selectedDrawing: string;

  private inReadOnlyMode = false;

  @ViewChild(NodeContextMenuComponent) nodeContextMenu: NodeContextMenuComponent;
  @ViewChild(D3MapComponent) mapChild: D3MapComponent;

  private subscriptions: Subscription[] = [];
  constructor(
    private route: ActivatedRoute,
    private serverService: ServerService,
    private projectService: ProjectService,
    private symbolService: SymbolService,
    private nodeService: NodeService,
    private linkService: LinkService,
    private drawingService: DrawingService,
    private progressService: ProgressService,
    private projectWebServiceHandler: ProjectWebServiceHandler,
    private mapChangeDetectorRef: MapChangeDetectorRef,
    private nodeWidget: NodeWidget,
    private mapNodeToNode: MapNodeToNodeConverter,
    private mapPortToPort: MapPortToPortConverter,
    private nodesDataSource: NodesDataSource,
    private linksDataSource: LinksDataSource,
    private drawingsDataSource: DrawingsDataSource,
    private nodesEventSource: NodesEventSource,
    private drawingsEventSource: DrawingsEventSource,
    private linksEventSource: LinksEventSource,
    private mapDrawingToSvgConverter: MapDrawingToSvgConverter,
    private settingsService: SettingsService,
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

    this.subscriptions.push(
      this.nodesEventSource.dragged.subscribe((evt) => this.onNodeDragged(evt))
    );

    this.subscriptions.push(
      this.nodesEventSource.labelDragged.subscribe((evt) => this.onNodeLabelDragged(evt))
    );

    this.subscriptions.push(
      this.drawingsEventSource.dragged.subscribe((evt) => this.onDrawingDragged(evt))
    );

    this.subscriptions.push(
      this.drawingsEventSource.resized.subscribe((evt) => this.onDrawingResized(evt))
    );

    this.subscriptions.push(
      this.linksEventSource.created.subscribe((evt) => this.onLinkCreated(evt))
    );

    this.subscriptions.push(
      this.linksEventSource.interfaceDragged.subscribe((evt) => this.onInterfaceLabelDragged(evt))
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

  private onNodeDragged(draggedEvent: DraggedDataEvent<MapNode>) {
    const node = this.nodesDataSource.get(draggedEvent.datum.id);
    node.x += draggedEvent.dx;
    node.y += draggedEvent.dy;

    this.nodeService
      .updatePosition(this.server, node, node.x, node.y)
      .subscribe((serverNode: Node) => {
        this.nodesDataSource.update(serverNode);
      });
  }

  private onNodeLabelDragged(draggedEvent: DraggedDataEvent<MapLabel>) {
    const node = this.nodesDataSource.get(draggedEvent.datum.nodeId);
    node.label.x += draggedEvent.dx;
    node.label.y += draggedEvent.dy;

    this.nodeService
      .updateLabel(this.server, node, node.label)
      .subscribe((serverNode: Node) => {
        this.nodesDataSource.update(serverNode);
      });
  }

  private onDrawingDragged(draggedEvent: DraggedDataEvent<MapDrawing>) {
    const drawing = this.drawingsDataSource.get(draggedEvent.datum.id);
    drawing.x += draggedEvent.dx;
    drawing.y += draggedEvent.dy;

    this.drawingService
      .updatePosition(this.server, drawing, drawing.x, drawing.y)
      .subscribe((serverDrawing: Drawing) => {
        this.drawingsDataSource.update(serverDrawing);
      });
  }

  private onInterfaceLabelDragged(draggedEvent: DraggedDataEvent<MapLinkNode>) {
    const link = this.linksDataSource.get(draggedEvent.datum.linkId);
    if (link.nodes[0].node_id === draggedEvent.datum.nodeId) {
      link.nodes[0].label.x += draggedEvent.dx;
      link.nodes[0].label.y += draggedEvent.dy;
    }
    if (link.nodes[1].node_id === draggedEvent.datum.nodeId) {
      link.nodes[1].label.x += draggedEvent.dx;
      link.nodes[1].label.y += draggedEvent.dy;
    }

    this.linkService
      .updateNodes(this.server, link, link.nodes)
      .subscribe((serverLink: Link) => {
        this.linksDataSource.update(serverLink);
      });
  }

  private onLinkCreated(linkCreated: MapLinkCreated) {
    const sourceNode = this.mapNodeToNode.convert(linkCreated.sourceNode);
    const sourcePort = this.mapPortToPort.convert(linkCreated.sourcePort);
    const targetNode = this.mapNodeToNode.convert(linkCreated.targetNode);
    const targetPort = this.mapPortToPort.convert(linkCreated.targetPort);
    
    this.linkService
      .createLink(this.server, sourceNode, sourcePort, targetNode, targetPort)
      .subscribe(() => {
        this.projectService.links(this.server, this.project.project_id).subscribe((links: Link[]) => {
          this.linksDataSource.set(links);
        });
      });
  }

  private onDrawingResized(resizedEvent: ResizedDataEvent<MapDrawing>) {
    const drawing = this.drawingsDataSource.get(resizedEvent.datum.id);
    let svgString = this.mapDrawingToSvgConverter.convert(resizedEvent.datum);
    
    this.drawingService
      .updateSizeAndPosition(this.server, drawing, resizedEvent.x, resizedEvent.y, svgString)
      .subscribe((serverDrawing: Drawing) => {
        this.drawingsDataSource.update(serverDrawing);
      });
  }

  public set readonly(value) {
    this.inReadOnlyMode = value;
    if (value) {
      this.tools.selection = false;
    } else {
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
    this.tools.draw_link = !this.tools.draw_link;
  }

  public toggleShowInterfaceLabels(enabled: boolean) {
    this.project.show_interface_labels = enabled;
  }

  public addDrawing(selectedObject: string) {
    if (selectedObject === this.selectedDrawing){
      var map = document.getElementsByClassName('map')[0];
      map.removeEventListener('click', this.drawListener as EventListenerOrEventListenerObject);
      this.resetDrawToolChoice();
      return;
    }

    switch (selectedObject) {
      case "rectangle":
        this.drawTools.isEllipseChosen = false;
        this.drawTools.isRectangleChosen = !this.drawTools.isRectangleChosen;
        this.drawTools.isLineChosen = false;
        break;
      case "ellipse":
        this.drawTools.isEllipseChosen = !this.drawTools.isEllipseChosen;
        this.drawTools.isRectangleChosen = false;
        this.drawTools.isLineChosen = false;
        break;
      case "line":
        this.drawTools.isEllipseChosen = false;
        this.drawTools.isRectangleChosen = false;
        this.drawTools.isLineChosen = !this.drawTools.isLineChosen;
        break;
    }

    this.selectedDrawing = selectedObject;
    var map = document.getElementsByClassName('map')[0];
    let mapDrawing: MapDrawing = this.getDrawingMock(selectedObject);

    let listener = (event: MouseEvent) => {
      let x = event.clientX - this.mapChild.context.getZeroZeroTransformationPoint().x;
      let y = event.clientY - this.mapChild.context.getZeroZeroTransformationPoint().y;
      let svg = this.mapDrawingToSvgConverter.convert(mapDrawing);

      this.drawingService
        .add(this.server, this.project.project_id, x, y, svg)
        .subscribe((serverDrawing: Drawing) => {
          this.drawingsDataSource.add(serverDrawing);
        });
        this.resetDrawToolChoice();
    }

    map.removeEventListener('click', this.drawListener as EventListenerOrEventListenerObject);
    this.drawListener = listener;
    map.addEventListener('click', this.drawListener as EventListenerOrEventListenerObject, {once : true});
  }

  public resetDrawToolChoice(){
    this.drawTools.isRectangleChosen = false;
    this.drawTools.isEllipseChosen = false;
    this.drawTools.isLineChosen = false;
    this.selectedDrawing = "";
  }

  public hideMenu(){
    var map = document.getElementsByClassName('map')[0];
    map.removeEventListener('click', this.drawListener as EventListenerOrEventListenerObject);
    this.resetDrawToolChoice();
    this.drawTools.visibility = false;
  }

  public showMenu(){
    this.drawTools.visibility = true;
  }

  public getDrawingMock(objectType: string): MapDrawing {
    let drawingElement: DrawingElement;

    switch (objectType) {
      case "rectangle":
        let rect = new RectElement();
        rect.fill = "#ffffff";
        rect.fill_opacity = 1.0;
        rect.stroke = "#000000";
        rect.stroke_width = 2;
        rect.width = 200;
        rect.height = 100;
        drawingElement = rect;
        break;
      case "ellipse":
        let ellipse = new EllipseElement();
        ellipse.fill = "#ffffff";
        ellipse.fill_opacity = 1.0;
        ellipse.stroke = "#000000";
        ellipse.stroke_width = 2;
        ellipse.cx = 100;
        ellipse.cy = 100;
        ellipse.rx = 100;
        ellipse.ry = 100;
        ellipse.width = 200;
        ellipse.height = 200;
        drawingElement = ellipse;
        break;
      case "line":
        let line = new LineElement();
        line.stroke = "#000000";
        line.stroke_width = 2;
        line.x1 = 0;
        line.x2 = 200;
        line.y1 = 0;
        line.y2 = 0;
        line.width = 100;
        line.height = 0;
        drawingElement = line;
    }

    let mapDrawing = new MapDrawing();
    mapDrawing.element = drawingElement;
    return mapDrawing;
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
