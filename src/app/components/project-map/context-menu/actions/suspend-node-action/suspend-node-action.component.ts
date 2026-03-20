import { Component, Input, OnChanges, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Node } from '../../../../../cartography/models/node';
import { Controller } from '@models/controller';
import { NodeService } from '@services/node.service';

@Component({
  standalone: true,
  selector: 'app-suspend-node-action',
  templateUrl: './suspend-node-action.component.html',
  imports: [CommonModule, MatButtonModule, MatIconModule],
})
export class SuspendNodeActionComponent implements OnInit, OnChanges {
  private nodeService = inject(NodeService);

  @Input() controller: Controller;
  @Input() nodes: Node[];
  isNodeWithStartedStatus: boolean;

  ngOnInit() {}

  ngOnChanges(changes) {
    if (changes.nodes) {
      this.isNodeWithStartedStatus = false;
      this.nodes.forEach((node) => {
        if (node.status === 'started') {
          this.isNodeWithStartedStatus = true;
        }
      });
    }
  }

  suspendNodes() {
    this.nodes.forEach((node) => {
      this.nodeService.suspend(this.controller, node).subscribe((n: Node) => {});
    });
  }
}
