import { ChangeDetectionStrategy, Component, OnInit, inject, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Node } from '../../../../../cartography/models/node';
import { Controller } from '@models/controller';
import { NodeService } from '@services/node.service';
import { ToasterService } from '@services/toaster.service';

@Component({
  standalone: true,
  selector: 'app-unisolate-node-action',
  templateUrl: './unisolate-node-action.component.html',
  imports: [CommonModule, MatButtonModule, MatIconModule],
  // TODO: This component has been partially migrated to be zoneless-compatible.
  // After testing, this should be updated to ChangeDetectionStrategy.OnPush.
  changeDetection: ChangeDetectionStrategy.Default,
})
export class UnisolateNodeActionComponent implements OnInit {
  private nodeService = inject(NodeService);
  private toasterService = inject(ToasterService);

  readonly controller = input<Controller>(undefined);
  readonly node = input<Node>(undefined);

  ngOnInit() {}

  unisolate() {
    this.nodeService.unisolate(this.controller(), this.node()).subscribe(
      (n: Node) => {},
      (error) => {
        this.toasterService.error(error.error.message);
      }
    );
  }
}
