import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { Node } from '../../../../../cartography/models/node';
import { Controller } from '@models/controller';
import { NodeService } from '@services/node.service';
import { ToasterService } from '@services/toaster.service';

@Component({
  selector: 'app-unisolate-node-action',
  templateUrl: './unisolate-node-action.component.html',
  imports: [MatButtonModule, MatIconModule, MatMenuModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UnisolateNodeActionComponent {
  private nodeService = inject(NodeService);
  private toasterService = inject(ToasterService);
  private cdr = inject(ChangeDetectorRef);

  readonly controller = input<Controller>(undefined);
  readonly node = input<Node>(undefined);

  unisolate() {
    this.nodeService.unisolate(this.controller(), this.node()).subscribe({
      next: (n: Node) => {},
      error: (err) => {
        const message = err.error?.message || err.message || 'Failed to unisolate node';
        this.toasterService.error(message);
        this.cdr.markForCheck();
      },
    });
  }
}
