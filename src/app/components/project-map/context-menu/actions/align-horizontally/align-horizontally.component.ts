import { Component, Input, OnInit } from '@angular/core';
import { NodesDataSource } from '../../../../../cartography/datasources/nodes-datasource';
import { Node } from '../../../../../cartography/models/node';
import { Server } from '../../../../../models/server';
import { NodeService } from '../../../../../services/node.service';

@Component({
  selector: 'app-align-horizontally-action',
  templateUrl: './align-horizontally.component.html',
})
export class AlignHorizontallyActionComponent implements OnInit {
  @Input() controller: Server;
  @Input() nodes: Node[];

  constructor(private nodesDataSource: NodesDataSource, private nodeService: NodeService) {}

  ngOnInit() {}

  alignHorizontally() {
    let averageY: number = 0;
    this.nodes.forEach((node) => {
      averageY += node.y;
    });
    averageY = averageY / this.nodes.length;

    this.nodes.forEach((node) => {
      node.y = averageY;
      this.nodesDataSource.update(node);

      this.nodeService.update(this.controller, node).subscribe((node: Node) => {});
    });
  }
}
