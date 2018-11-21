import { Component, OnInit, Output, EventEmitter, OnDestroy, ViewChild } from '@angular/core';
import { DrawingLineWidget } from '../../widgets/drawing-line';
import { Subscription } from 'rxjs';
// import { NodeSelectInterfaceComponent } from '../node-select-interface/node-select-interface.component';
import { MapLinkCreated } from '../../events/links';
import { NodeClicked } from '../../events/nodes';
import { NodeWidget } from '../../widgets/node';
import { MapNode } from '../../models/map/map-node';
import { MapPort } from '../../models/map/map-port';
import { LinksEventSource } from '../../events/links-event-source';


@Component({
  selector: 'app-draw-link-tool',
  templateUrl: './draw-link-tool.component.html',
  styleUrls: ['./draw-link-tool.component.scss']
})
export class DrawLinkToolComponent implements OnInit, OnDestroy {
  // @ViewChild(NodeSelectInterfaceComponent) nodeSelectInterfaceMenu: NodeSelectInterfaceComponent;
  
  // @Output('linkCreated') linkCreated = new EventEmitter<MapLinkCreated>();

  private onNodeClicked: Subscription;

  constructor(
    private drawingLineTool: DrawingLineWidget,
    private nodeWidget: NodeWidget,
    private linksEventSource: LinksEventSource
  ) { }

  ngOnInit() {
    // this.onNodeClicked = this.nodeWidget.onNodeClicked.subscribe((eventNode: NodeClicked) => {
    //     this.nodeSelectInterfaceMenu.open(
    //       eventNode.node,
    //       eventNode.event.clientY,
    //       eventNode.event.clientX
    //     );
    // });
  }

  ngOnDestroy() {
    if (this.drawingLineTool.isDrawing()) {
      this.drawingLineTool.stop();
    }
    this.onNodeClicked.unsubscribe();
  }

  public onChooseInterface(event) {
    const node: MapNode = event.node;
    const port: MapPort = event.port;
    if (this.drawingLineTool.isDrawing()) {
      const data = this.drawingLineTool.stop();
      this.linksEventSource.created.emit(new MapLinkCreated(data['node'], data['port'], node, port));
    } else {
      this.drawingLineTool.start(node.x + node.width / 2., node.y + node.height / 2., {
        'node': node,
        'port': port
      });
    }
  }
}
