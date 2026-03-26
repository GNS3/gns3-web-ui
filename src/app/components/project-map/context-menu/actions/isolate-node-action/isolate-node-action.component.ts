import { ChangeDetectionStrategy, Component, OnInit, inject, input, ChangeDetectorRef } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { Node } from '../../../../../cartography/models/node';
import { Controller } from '@models/controller';
import { NodeService } from '@services/node.service';
import { ToasterService } from '@services/toaster.service';

@Component({
  selector: 'app-isolate-node-action',
  templateUrl: './isolate-node-action.component.html',
  imports: [MatButtonModule, MatIconModule, MatMenuModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IsolateNodeActionComponent implements OnInit {
  private nodeService = inject(NodeService);
  private toasterService = inject(ToasterService);
  private cdr = inject(ChangeDetectorRef);

  readonly controller = input<Controller>(undefined);
  readonly node = input<Node>(undefined);

  ngOnInit() {}

  isolate() {
    this.nodeService.isolate(this.controller(), this.node()).subscribe(
      (n: Node) => {},
      (error) => {
        this.toasterService.error(error.error.message);
        this.cdr.markForCheck();
      }
    );
  }
}
