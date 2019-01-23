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
  @Input() nodes: Node[];
  @Input() drawings: Drawing[];

  constructor(
    private nodesDataSource: NodesDataSource,
    private drawingsDataSource: DrawingsDataSource,
    private nodeService: NodeService,
    private drawingService: DrawingService
  ) {}

  ngOnInit() {}

  moveLayerUp() {
    this.nodes.forEach((node) => {
      node.z++;
      this.nodesDataSource.update(node);

      this.nodeService.update(this.server, node).subscribe((node: Node) => {});
    });

    this.drawings.forEach((drawing) => {
      drawing.z++;
      this.drawingsDataSource.update(drawing);

      this.drawingService.update(this.server, drawing).subscribe((drawing: Drawing) => {});
    });
  }
}
