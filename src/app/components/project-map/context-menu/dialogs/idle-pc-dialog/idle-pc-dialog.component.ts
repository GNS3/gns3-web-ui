import {Component, Input, OnInit, ViewEncapsulation} from '@angular/core';
import {MatDialogRef} from '@angular/material/dialog';
import {Controller} from "@models/controller";
import {Node} from '../../../../../cartography/models/node';
import {NodeService} from "@services/node.service";
import {ToasterService} from "@services/toaster.service";

@Component({
  selector: 'app-idle-pc-dialog',
  templateUrl: './idle-pc-dialog.component.html',
  styleUrls: ['./idle-pc-dialog.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class IdlePCDialogComponent implements OnInit {
  @Input() controller: Controller;
  @Input() node: Node;

  idlepcs = [];
  idlePC: string = '';
  isComputing: boolean = false;

  constructor(
    private nodeService: NodeService,
    public dialogRef: MatDialogRef<IdlePCDialogComponent>,
    private toasterService: ToasterService
  ) {}

  ngOnInit() {
    this.onCompute();
  }

  getTooltip(){
    return "Best Idle-PC values are obtained when IOS is in idle state, after the 'Press RETURN to get started' message has appeared on the console, messages have finished displaying on the console and you have have actually pressed the RETURN key.\n\nFinding the right idle-pc value is a trial and error process, consisting of applying different Idle-PC values and monitoring the CPU usage.\n\nSelect each value that appears in the list and click Apply, and note the CPU usage a few moments later. When you have found the value that minimises the CPU usage, apply that value.";
  }

  onCompute() {
    this.isComputing = true;
    this.nodeService.getIdlePCProposals(this.controller, this.node).subscribe((idlepcs: any) => {
      let idlepcs_values = [];
      for (let value of idlepcs) {
        // validate idle-pc format, e.g. 0x60c09aa0
        const match = value.match(/^(0x[0-9a-f]{8})\s+\[(\d+)\]$/);
        if (match) {
          const idlepc = match[1];
          const count = parseInt(match[2], 10);
          if (50 <= count && count <= 60) {
            value += "*";
          }
          idlepcs_values.push({'key': idlepc, 'name': value})
        }
      }
      this.idlepcs = idlepcs_values;
      if (this.idlepcs.length > 0) {
        this.idlePC = this.idlepcs[0].key;
      }
      this.isComputing = false;
    });
  }

  onClose() {
    this.dialogRef.close();
  }

  onApply() {
    if (this.idlePC && this.idlePC !== '0x0') {
      this.node.properties.idlepc = this.idlePC;
      this.nodeService.updateNode(this.controller, this.node).subscribe(() => {
        this.toasterService.success(`Node ${this.node.name} updated with idle-PC value ${this.idlePC}`);
      });
    }
  }
}
