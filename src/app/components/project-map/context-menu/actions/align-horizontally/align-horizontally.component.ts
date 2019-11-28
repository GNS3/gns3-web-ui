import { Component, OnInit, Input } from '@angular/core';
import { Server } from '../../../../../models/server';
import { Node } from '../../../../../cartography/models/node';
import { NodesDataSource } from '../../../../../cartography/datasources/nodes-datasource';
import { NodeService } from '../../../../../services/node.service';

@Component({
  selector: 'app-align-horizontally-action',
  templateUrl: './align-horizontally.component.html'
})
export class AlignHorizontallyActionComponent implements OnInit {
  @Input() server: Server;
  @Input() nodes: Node[];

  constructor(
    private nodesDataSource: NodesDataSource,
    private nodeService: NodeService
  ) {}

  ngOnInit() {}

  alignHorizontally() {
    let averageY: number = 0;
    this.nodes.forEach((node) => {
        averageY += node.y;
    });
    averageY = averageY/this.nodes.length;
    
    this.nodes.forEach((node) => {
        node.y = averageY;
        this.nodesDataSource.update(node);

        this.nodeService.update(this.server, node).subscribe((node: Node) => {});
    });
  }
}
