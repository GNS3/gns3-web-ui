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
import { ToasterService } from '../../../services/toaster.service';
import { ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-draw-link-tool',
  templateUrl: './draw-link-tool.component.html',
  styleUrl: './draw-link-tool.component.scss',
  imports: [CommonModule, NodeSelectInterfaceComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
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
  private toasterService = inject(ToasterService);
  private cdr = inject(ChangeDetectorRef);

  constructor() {}

  ngOnInit() {
    this.nodeClicked$ = this.nodesEventSource.clicked.subscribe({
      next: (clickedEvent) => {
        let node = this.mapNodeToNode.convert(clickedEvent.datum);
        this.nodeSelectInterfaceMenu().open(node, clickedEvent.y, clickedEvent.x);
      },
      error: (err) => {
        const message = err.error?.message || err.message || 'Failed to handle node click';
        this.toasterService.error(message);
        this.cdr.markForCheck();
      },
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
