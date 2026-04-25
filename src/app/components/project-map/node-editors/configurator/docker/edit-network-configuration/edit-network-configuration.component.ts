import { ChangeDetectionStrategy, Component, OnInit, inject, ChangeDetectorRef, model } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { Node } from '../../../../../../cartography/models/node';
import { Controller } from '@models/controller';
import { NodeService } from '@services/node.service';
import { ToasterService } from '@services/toaster.service';

@Component({
  selector: 'app-edit-network-configuration',
  templateUrl: './edit-network-configuration.component.html',
  styleUrl: './edit-network-configuration.component.scss',
  imports: [CommonModule, MatDialogModule, MatInputModule, MatButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditNetworkConfigurationDialogComponent implements OnInit {
  private dialogRef = inject(MatDialogRef<EditNetworkConfigurationDialogComponent>);
  private nodeService = inject(NodeService);
  private toasterService = inject(ToasterService);
  private cdr = inject(ChangeDetectorRef);

  controller: Controller;
  node: Node;
  readonly configuration = model('');

  constructor() {}

  ngOnInit() {
    this.nodeService.getNetworkConfiguration(this.controller, this.node).subscribe({
      next: (response: string) => {
        this.configuration.set(response);
        this.cdr.markForCheck();
      },
      error: (err) => {
        const message = err.error?.message || err.message || 'Failed to load network configuration';
        this.toasterService.error(message);
        this.cdr.markForCheck();
      },
    });
  }

  onSaveClick() {
    this.nodeService
      .saveNetworkConfiguration(this.controller, this.node, this.configuration())
      .subscribe({
        next: (response: string) => {
          this.onCancelClick();
          this.toasterService.success(`Configuration for node ${this.node.name} saved.`);
          this.cdr.markForCheck();
        },
        error: (err) => {
          const message = err.error?.message || err.message || 'Failed to save network configuration';
          this.toasterService.error(message);
          this.cdr.markForCheck();
        },
      });
  }

  onCancelClick() {
    this.dialogRef.close();
  }
}
