import { Component, Input, OnInit } from '@angular/core';
import { DrawingsDataSource } from '../../../../../cartography/datasources/drawings-datasource';
import { NodesDataSource } from '../../../../../cartography/datasources/nodes-datasource';
import { Drawing } from '../../../../../cartography/models/drawing';
import { Node } from '../../../../../cartography/models/node';
import { Server } from '../../../../../models/server';
import { DrawingService } from '../../../../../services/drawing.service';
import { NodeService } from '../../../../../services/node.service';

@Component({
  selector: 'app-move-layer-down-action',
  templateUrl: './move-layer-down-action.component.html',
})
export class MoveLayerDownActionComponent implements OnInit {
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

  moveLayerDown() {
    this.nodes.forEach((node) => {
      node.z--;
      this.nodesDataSource.update(node);

      this.nodeService.update(this.server, node).subscribe((node: Node) => {});
    });

    this.drawings.forEach((drawing) => {
      drawing.z--;
      this.drawingsDataSource.update(drawing);

      this.drawingService.update(this.server, drawing).subscribe((drawing: Drawing) => {});
    });
  }
}
