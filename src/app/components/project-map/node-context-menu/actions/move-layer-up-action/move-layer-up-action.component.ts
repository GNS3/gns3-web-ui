import { Component, OnInit, Input } from '@angular/core';
import { Server } from '../../../../../models/server';
import { Node } from '../../../../../cartography/models/node';
import { NodesDataSource } from '../../../../../cartography/datasources/nodes-datasource';
import { NodeService } from '../../../../../services/node.service';

@Component({
  selector: 'app-move-layer-up-action',
  templateUrl: './move-layer-up-action.component.html'
})
export class MoveLayerUpActionComponent implements OnInit {
  @Input() server: Server;
  @Input() node: Node;

  constructor(
    private nodesDataSource: NodesDataSource,
    private nodeService: NodeService
  ) { }

  ngOnInit() {}

  moveLayerUp() {
    this.node.z++;
    this.nodesDataSource.update(this.node);
    this.nodeService
      .update(this.server, this.node)
      .subscribe((node: Node) => {});
  }
}
