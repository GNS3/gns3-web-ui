import { Component, Input, OnInit } from '@angular/core';
import { DrawingsDataSource } from '../../../../../cartography/datasources/drawings-datasource';
import { NodesDataSource } from '../../../../../cartography/datasources/nodes-datasource';
import { Drawing } from '../../../../../cartography/models/drawing';
import { Node } from '../../../../../cartography/models/node';
import { Controller } from '@models/controller';
import { DrawingService } from '@services/drawing.service';
import { NodeService } from '@services/node.service';

@Component({
  selector: 'app-move-layer-up-action',
  templateUrl: './move-layer-up-action.component.html',
})
export class MoveLayerUpActionComponent implements OnInit {
  @Input() controller: Controller;
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

      this.nodeService.update(this.controller, node).subscribe((node: Node) => {});
    });

    this.drawings.forEach((drawing) => {
      drawing.z++;
      this.drawingsDataSource.update(drawing);

      this.drawingService.update(this.controller, drawing).subscribe((drawing: Drawing) => {});
    });
  }
}
