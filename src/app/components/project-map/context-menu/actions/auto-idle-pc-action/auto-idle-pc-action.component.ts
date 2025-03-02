import { Component, Input } from '@angular/core';
import { Node } from '../../../../../cartography/models/node';
import { Controller } from '../../../../../models/controller';
import { NodeService } from "@services/node.service";
import { ToasterService } from "@services/toaster.service";
import { ProgressService } from "../../../../../common/progress/progress.service";

@Component({
  selector: 'app-auto-idle-pc-action',
  templateUrl: './auto-idle-pc-action.component.html',
})
export class AutoIdlePcActionComponent {
  @Input() controller: Controller;
  @Input() node: Node;

  constructor(
    private nodeService: NodeService,
    private toasterService: ToasterService,
    private progressService: ProgressService,
  ) {}

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
