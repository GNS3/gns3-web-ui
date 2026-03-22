import { ChangeDetectionStrategy, Component, OnChanges, OnInit, inject, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Node } from '../../../../../cartography/models/node';
import { Controller } from '@models/controller';
import { NodeService } from '@services/node.service';

@Component({
  selector: 'app-stop-node-action',
  templateUrl: './stop-node-action.component.html',
  imports: [CommonModule, MatButtonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StopNodeActionComponent implements OnInit, OnChanges {
  private nodeService = inject(NodeService);

  readonly controller = input<Controller>(undefined);
  readonly nodes = input<Node[]>(undefined);
  isNodeWithStartedStatus: boolean;

  ngOnInit() {}

  ngOnChanges(changes) {
    if (changes.nodes) {
      this.isNodeWithStartedStatus = false;
      this.nodes().forEach((node) => {
        if (node.status === 'started') {
          this.isNodeWithStartedStatus = true;
        }
      });
    }
  }

  stopNodes() {
    this.nodes().forEach((node) => {
      this.nodeService.stop(this.controller(), node).subscribe((n: Node) => {});
    });
  }
}
