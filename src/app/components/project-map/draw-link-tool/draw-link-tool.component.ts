import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, inject, input, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { MapNodeToNodeConverter } from '../../../cartography/converters/map/map-node-to-node-converter';
import { NodeToMapNodeConverter } from '../../../cartography/converters/map/node-to-map-node-converter';
import { PortToMapPortConverter } from '../../../cartography/converters/map/port-to-map-port-converter';
import { MapLinkCreated } from '../../../cartography/events/links';
import { LinksEventSource } from '../../../cartography/events/links-event-source';
import { NodesEventSource } from '../../../cartography/events/nodes-event-source';
import { MapNode } from '../../../cartography/models/map/map-node';
import { MapPort } from '../../../cartography/models/map/map-port';
import { DrawingLineWidget } from '../../../cartography/widgets/drawing-line';
import { NodeSelectInterfaceComponent } from '@components/project-map/node-select-interface/node-select-interface.component';
import { Link } from '@models/link';

@Component({
  standalone: true,
  selector: 'app-draw-link-tool',
  templateUrl: './draw-link-tool.component.html',
  styleUrls: ['./draw-link-tool.component.scss'],
  imports: [CommonModule, NodeSelectInterfaceComponent],
  // TODO: This component has been partially migrated to be zoneless-compatible.
  // After testing, this should be updated to ChangeDetectionStrategy.OnPush.
  changeDetection: ChangeDetectionStrategy.Default,
})
export class DrawLinkToolComponent implements OnInit, OnDestroy {
  readonly links = input<Link[]>(undefined);
  readonly nodeSelectInterfaceMenu = viewChild(NodeSelectInterfaceComponent);

  private nodeClicked$: Subscription;

  private drawingLineTool = inject(DrawingLineWidget);
  private nodesEventSource = inject(NodesEventSource);
  private linksEventSource = inject(LinksEventSource);
  private mapNodeToNode = inject(MapNodeToNodeConverter);
  private nodeToMapNode = inject(NodeToMapNodeConverter);
  private portToMapPort = inject(PortToMapPortConverter);

  constructor() {}

  ngOnInit() {
    this.nodeClicked$ = this.nodesEventSource.clicked.subscribe((clickedEvent) => {
      let node = this.mapNodeToNode.convert(clickedEvent.datum);
      this.nodeSelectInterfaceMenu().open(node, clickedEvent.y, clickedEvent.x);
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
