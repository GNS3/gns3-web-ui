import { Component, Input, OnInit } from '@angular/core';
import { NodesDataSource } from '../../../../../cartography/datasources/nodes-datasource';
import { Node } from '../../../../../cartography/models/node';
import { Server } from '../../../../../models/server';
import { NodeService } from '../../../../../services/node.service';

@Component({
  selector: 'app-align-vertically-action',
  templateUrl: './align-vertically.component.html',
})
export class AlignVerticallyActionComponent implements OnInit {
  @Input() server: Server;
  @Input() nodes: Node[];

  constructor(private nodesDataSource: NodesDataSource, private nodeService: NodeService) {}

  ngOnInit() {}

  alignVertically() {
    let averageX: number = 0;
    this.nodes.forEach((node) => {
      averageX += node.x;
    });
    averageX = averageX / this.nodes.length;

    this.nodes.forEach((node) => {
      node.x = averageX;
      this.nodesDataSource.update(node);

      this.nodeService.update(this.server, node).subscribe((node: Node) => {});
    });
  }
}
