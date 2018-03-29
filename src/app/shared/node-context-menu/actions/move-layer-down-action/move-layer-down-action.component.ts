import { Component, OnInit, Input } from '@angular/core';
import { Server } from '../../../models/server';
import { Node } from '../../../../cartography/shared/models/node';
import { NodesDataSource } from '../../../../cartography/shared/datasources/nodes-datasource';
import { NodeService } from '../../../services/node.service';

@Component({
  selector: 'app-move-layer-down-action',
  templateUrl: './move-layer-down-action.component.html'
})
export class MoveLayerDownActionComponent implements OnInit {
  @Input() server: Server;
  @Input() node: Node;

  constructor(
    private nodesDataSource: NodesDataSource,
    private nodeService: NodeService
  ) { }

  ngOnInit() {}

  moveLayerDown() {
    this.node.z--;
    this.nodesDataSource.update(this.node);
    this.nodeService
      .update(this.server, this.node)
      .subscribe((node: Node) => {});
  }
}
