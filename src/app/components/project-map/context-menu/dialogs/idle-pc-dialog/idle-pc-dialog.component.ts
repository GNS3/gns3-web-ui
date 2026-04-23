import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnInit, inject, model } from '@angular/core';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule } from '@angular/forms';
import { Controller } from '@models/controller';
import { Node } from '../../../../../cartography/models/node';
import { NodeService } from '@services/node.service';
import { ToasterService } from '@services/toaster.service';

@Component({
  standalone: true,
  selector: 'app-idle-pc-dialog',
  templateUrl: './idle-pc-dialog.component.html',
  styleUrls: ['./idle-pc-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatDialogModule, MatButtonModule, MatProgressSpinnerModule, MatInputModule, MatRadioModule, MatSelectModule, FormsModule],
})
export class IdlePCDialogComponent implements OnInit {
  private nodeService = inject(NodeService);
  public dialogRef = inject(MatDialogRef<IdlePCDialogComponent>);
  private toasterService = inject(ToasterService);
  private cd = inject(ChangeDetectorRef);

  @Input() controller: Controller;
  @Input() node: Node;

  idlepcs = [];
  readonly idlePC = model('');
  isComputing: boolean = false;

  ngOnInit() {
    this.onCompute();
  }

  getTooltip() {
    return "Best Idle-PC values are obtained when IOS is in idle state, after the 'Press RETURN to get started' message has appeared on the console, messages have finished displaying on the console and you have have actually pressed the RETURN key.\n\nFinding the right idle-pc value is a trial and error process, consisting of applying different Idle-PC values and monitoring the CPU usage.\n\nSelect each value that appears in the list and click Apply, and note the CPU usage a few moments later. When you have found the value that minimises the CPU usage, apply that value.";
  }

  onCompute() {
    this.isComputing = true;
    this.nodeService.getIdlePCProposals(this.controller, this.node).subscribe({
      next: (idlepcs: any) => {
        let idlepcs_values = [];
        for (let value of idlepcs) {
          // validate idle-pc format, e.g. 0x60c09aa0
          const match = value.match(/^(0x[0-9a-f]{8})\s+\[(\d+)\]$/);
          if (match) {
            const idlepc = match[1];
            const count = parseInt(match[2], 10);
            if (50 <= count && count <= 60) {
              value += '*';
            }
            idlepcs_values.push({ key: idlepc, name: value });
          }
        }
        this.idlepcs = idlepcs_values;
        if (this.idlepcs.length > 0) {
          this.idlePC.set(this.idlepcs[0].key);
        }
        this.isComputing = false;
        this.cd.markForCheck();
      },
      error: (err) => {
        const message = err.error?.message || err.message || 'Failed to compute idle-PC proposals';
        this.toasterService.error(message);
        this.isComputing = false;
        this.cd.markForCheck();
      },
    });
  }

  onClose() {
    this.dialogRef.close();
  }

  onApply() {
    if (this.idlePC() && this.idlePC() !== '0x0') {
      this.node.properties.idlepc = this.idlePC();
      this.nodeService.updateNode(this.controller, this.node).subscribe({
        next: () => {
          this.toasterService.success(`Node ${this.node.name} updated with idle-PC value ${this.idlePC()}`);
          this.cd.markForCheck();
        },
        error: (err) => {
          const message = err.error?.message || err.message || 'Failed to update node with idle-PC value';
          this.toasterService.error(message);
          this.cd.markForCheck();
        },
      });
    }
  }
}
