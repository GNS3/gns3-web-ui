import { Component, Input, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { Node } from '../../../../../cartography/models/node';
import { Controller } from '@models/controller';
import { NodeService } from "@services/node.service";
import { ToasterService } from "@services/toaster.service";
import { ProgressService } from "../../../../../common/progress/progress.service";

@Component({
  standalone: true,
  selector: 'app-auto-idle-pc-action',
  templateUrl: './auto-idle-pc-action.component.html',
  imports: [MatButtonModule, MatIconModule, MatMenuModule],
})
export class AutoIdlePcActionComponent {
  private nodeService = inject(NodeService);
  private toasterService = inject(ToasterService);
  private progressService = inject(ProgressService);

  @Input() controller: Controller;
  @Input() node: Node;

  autoIdlePC() {
    this.progressService.activate();
    this.nodeService.getAutoIdlePC(this.controller, this.node).subscribe((result: any) => {
      this.progressService.deactivate();
      if (result.idlepc !== null) {
        this.toasterService.success(`Node ${this.node.name} updated with idle-PC value ${result.idlepc}`);
      }
    },
      (error) => {
        this.progressService.deactivate();
        this.toasterService.error(`Error while updating idle-PC value for node ${this.node.name}`);
      }
    );
  }
}
