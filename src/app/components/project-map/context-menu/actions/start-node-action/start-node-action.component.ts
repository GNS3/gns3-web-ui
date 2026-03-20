import { Component, Input, OnChanges, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Node } from '../../../../../cartography/models/node';
import { Controller } from '@models/controller';
import { NodeService } from '@services/node.service';
import { ToasterService } from '@services/toaster.service';

@Component({
  standalone: true,
  selector: 'app-start-node-action',
  templateUrl: './start-node-action.component.html',
  imports: [CommonModule, MatButtonModule, MatIconModule],
})
export class StartNodeActionComponent implements OnInit, OnChanges {
  private nodeService = inject(NodeService);
  private toasterService = inject(ToasterService);

  @Input() controller: Controller;
  @Input() nodes: Node[];
  isNodeWithStoppedStatus: boolean;

  ngOnInit() {}

  ngOnChanges(changes) {
    if (changes.nodes) {
      this.isNodeWithStoppedStatus = false;
      this.nodes.forEach((node) => {
        if (node.status === 'stopped' || node.status === 'suspended') {
          this.isNodeWithStoppedStatus = true;
        }
      });
    }
  }

  startNodes() {
    this.nodes.forEach((node) => {
      this.nodeService.start(this.controller, node).subscribe(
        (n: Node) => {},
        (error) => {
          this.toasterService.error(error.error.message);
        }
      );
    });
  }
}
