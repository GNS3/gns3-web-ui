import { Component, OnInit, OnDestroy, ViewChild, Input } from '@angular/core';
import { Subscription } from 'rxjs';
import { NodeSelectInterfaceComponent } from '../../../components/project-map/node-select-interface/node-select-interface.component';
import { DrawingLineWidget } from '../../../cartography/widgets/drawing-line';
import { NodesEventSource } from '../../../cartography/events/nodes-event-source';
import { LinksEventSource } from '../../../cartography/events/links-event-source';
import { MapNode } from '../../../cartography/models/map/map-node';
import { MapPort } from '../../../cartography/models/map/map-port';
import { MapLinkCreated } from '../../../cartography/events/links';
import { Link } from '../../../models/link';
import { MapNodeToNodeConverter } from '../../../cartography/converters/map/map-node-to-node-converter';
import { PortToMapPortConverter } from '../../../cartography/converters/map/port-to-map-port-converter';
import { NodeToMapNodeConverter } from '../../../cartography/converters/map/node-to-map-node-converter';

@Component({
  selector: 'app-draw-link-tool',
  templateUrl: './draw-link-tool.component.html',
  styleUrls: ['./draw-link-tool.component.scss'],
})
export class DrawLinkToolComponent implements OnInit, OnDestroy {
  @Input() links: Link[];
  @ViewChild(NodeSelectInterfaceComponent) nodeSelectInterfaceMenu: NodeSelectInterfaceComponent;

  private nodeClicked$: Subscription;

  constructor(
    private drawingLineTool: DrawingLineWidget,
    private nodesEventSource: NodesEventSource,
    private linksEventSource: LinksEventSource,
    private mapNodeToNode: MapNodeToNodeConverter,
    private nodeToMapNode: NodeToMapNodeConverter,
    private portToMapPort: PortToMapPortConverter
  ) {}

  ngOnInit() {
    this.nodeClicked$ = this.nodesEventSource.clicked.subscribe((clickedEvent) => {
      let node = this.mapNodeToNode.convert(clickedEvent.datum);
      this.nodeSelectInterfaceMenu.open(node, clickedEvent.y, clickedEvent.x);
    });
  }

  ngOnDestroy() {
    if (this.drawingLineTool.isDrawing()) {
      this.drawingLineTool.stop();
    }
    this.nodeClicked$.unsubscribe();
  }

  public onChooseInterface(event) {
    const node: MapNode = this.nodeToMapNode.convert(event.node);
    const port: MapPort = this.portToMapPort.convert(event.port);
    if (this.drawingLineTool.isDrawing()) {
      const data = this.drawingLineTool.stop();
      this.linksEventSource.created.emit(new MapLinkCreated(data['node'], data['port'], node, port));
    } else {
      this.drawingLineTool.start(node.x + node.width / 2, node.y + node.height / 2, {
        node: node,
        port: port,
      });
    }
  }
}
