import { Component, OnInit, Input } from '@angular/core';
import { Server } from '../../../../../models/server';
import { Node } from '../../../../../cartography/models/node';
import { NodesDataSource } from '../../../../../cartography/datasources/nodes-datasource';
import { NodeService } from '../../../../../services/node.service';
import { Drawing } from '../../../../../cartography/models/drawing';
import { DrawingsDataSource } from '../../../../../cartography/datasources/drawings-datasource';
import { DrawingService } from '../../../../../services/drawing.service';

@Component({
  selector: 'app-move-layer-up-action',
  templateUrl: './move-layer-up-action.component.html'
})
export class MoveLayerUpActionComponent implements OnInit {
  @Input() server: Server;
  @Input() node: Node;
  @Input() drawing: Drawing;

  constructor(
    private nodesDataSource: NodesDataSource,
    private drawingsDataSource: DrawingsDataSource,
    private nodeService: NodeService,
    private drawingService: DrawingService
  ) { }

  ngOnInit() {}

  moveLayerUp() {
    if (this.node) {
      this.node.z++;
      this.nodesDataSource.update(this.node);
      
      this.nodeService
        .update(this.server, this.node)
        .subscribe((node: Node) => {});
    } else if(this.drawing) {
      this.drawing.z++;
      this.drawingsDataSource.update(this.drawing);

      this.drawingService
        .update(this.server, this.drawing)
        .subscribe((drawing: Drawing) => {});
    }
  }
}
