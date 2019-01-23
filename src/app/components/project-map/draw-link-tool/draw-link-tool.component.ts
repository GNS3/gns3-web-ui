import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { Subscription } from 'rxjs';
import { NodeSelectInterfaceComponent } from '../../../components/project-map/node-select-interface/node-select-interface.component';
import { DrawingLineWidget } from '../../../cartography/widgets/drawing-line';
import { NodesEventSource } from '../../../cartography/events/nodes-event-source';
import { LinksEventSource } from '../../../cartography/events/links-event-source';
import { MapNode } from '../../../cartography/models/map/map-node';
import { MapPort } from '../../../cartography/models/map/map-port';
import { MapLinkCreated } from '../../../cartography/events/links';

@Component({
  selector: 'app-draw-link-tool',
  templateUrl: './draw-link-tool.component.html',
  styleUrls: ['./draw-link-tool.component.scss']
})
export class DrawLinkToolComponent implements OnInit, OnDestroy {
  @ViewChild(NodeSelectInterfaceComponent) nodeSelectInterfaceMenu: NodeSelectInterfaceComponent;

  private nodeClicked$: Subscription;

  constructor(
    private drawingLineTool: DrawingLineWidget,
    private nodesEventSource: NodesEventSource,
    private linksEventSource: LinksEventSource
  ) {}

  ngOnInit() {
    this.nodeClicked$ = this.nodesEventSource.clicked.subscribe(clickedEvent => {
      this.nodeSelectInterfaceMenu.open(clickedEvent.datum, clickedEvent.y, clickedEvent.x);
    });
  }

  ngOnDestroy() {
    if (this.drawingLineTool.isDrawing()) {
      this.drawingLineTool.stop();
    }
    this.nodeClicked$.unsubscribe();
  }

  public onChooseInterface(event) {
    const node: MapNode = event.node;
    const port: MapPort = event.port;
    if (this.drawingLineTool.isDrawing()) {
      const data = this.drawingLineTool.stop();
      this.linksEventSource.created.emit(new MapLinkCreated(data['node'], data['port'], node, port));
    } else {
      this.drawingLineTool.start(node.x + node.width / 2, node.y + node.height / 2, {
        node: node,
        port: port
      });
    }
  }
}
