import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject, model, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { MatChipInputEvent, MatChipsModule } from '@angular/material/chips';
import { Node } from '../../../../../cartography/models/node';
import type { HostInterfaceIPAddress, NetworkInterface } from '../../../../../cartography/models/node';
import { PortsMappingEntity } from '@models/ethernetHub/ports-mapping-enity';
import { Controller } from '@models/controller';
import { NodeService } from '@services/node.service';
import { ToasterService } from '@services/toaster.service';
import { ValidationService } from '@services/validation';
import { formatFlags, formatIpAddress, formatIpAddresses, formatInterfaceMeta } from '../cloud/ip-address.util';

@Component({
  standalone: true,
  selector: 'app-configurator-nat',
  templateUrl: './configurator-nat.component.html',
  // Styles centralized in src/styles/_dialogs.scss via panelClass: 'configurator-dialog-panel'
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatChipsModule,
    MatIconModule,
    MatTableModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
  ],
})
export class ConfiguratorDialogNatComponent implements OnInit {
  private dialogRef = inject(MatDialogRef<ConfiguratorDialogNatComponent>);
  private nodeService = inject(NodeService);
  private toasterService = inject(ToasterService);
  private cd = inject(ChangeDetectorRef);
  private validationService = inject(ValidationService);

  controller: Controller;
  node: Node;
  name: string;
  readonly separatorKeysCodes: number[] = [ENTER, COMMA];

  portsMappingEthernet = signal<PortsMappingEntity[]>([]);
  ethernetDisplayColumns: string[] = ['name', 'ipAddresses'];

  readonly isApplying = signal(false);
  readonly isLoading = signal(true);

  // Model signals
  readonly nodeName = model('');

  /** Expose the interface formatters to the template. */
  formatIpAddresses = formatIpAddresses;
  formatIpAddress = formatIpAddress;
  formatInterfaceMeta = formatInterfaceMeta;
  formatFlags = formatFlags;

  ngOnInit() {
    this.nodeService.getNode(this.controller, this.node).subscribe({
      next: (node: Node) => {
        this.node = node;
        this.name = node.name;

        this.nodeName.set(node.name || '');

        if (!this.node.tags) {
          this.node.tags = [];
        }

        this.portsMappingEthernet.set(
          this.node.properties.ports_mapping.filter((elem) => elem.type === 'ethernet')
        );

        this.isLoading.set(false);
        this.dialogRef.disableClose = false;
        this.cd.markForCheck();
      },
      error: (err) => {
        const message = err.error?.message || err.message || 'Failed to load node';
        this.toasterService.error(message);
        this.isLoading.set(false);
        this.dialogRef.disableClose = false;
        this.cd.markForCheck();
      },
    });
  }

  /** Look up the full host interface bridged by a configured ethernet port. */
  getHostInterface(hostInterfaceName: string): NetworkInterface | undefined {
    return this.node?.properties?.interfaces?.find((iface) => iface.name === hostInterfaceName);
  }

  /** Look up the host interface IP addresses bridged by a configured ethernet port. */
  getHostInterfaceIps(hostInterfaceName: string): HostInterfaceIPAddress[] {
    return this.getHostInterface(hostInterfaceName)?.ip_addresses ?? [];
  }

  onSaveClick() {
    if (this.isApplying()) return;

    const nameValidation = this.validationService.required(this.nodeName(), 'Name');
    if (!nameValidation.isValid) {
      this.toasterService.error(nameValidation.errorMessage || 'Name is required');
      return;
    }

    this.node.name = this.nodeName();

    this.node.properties.ports_mapping = this.portsMappingEthernet();

    this.isApplying.set(true);
    this.dialogRef.disableClose = true;
    this.nodeService.updateNode(this.controller, this.node).subscribe({
      next: () => {
        this.toasterService.success(`Node ${this.node.name} updated.`);
        this.onCancelClick();
      },
      error: (error: unknown) => {
        const errorMessage = (error as any)?.error?.message || (error as any)?.message || 'Failed to update node';
        this.toasterService.error(errorMessage);
        this.isApplying.set(false);
        this.dialogRef.disableClose = false;
        this.cd.markForCheck();
      },
    });
  }

  onCancelClick() {
    this.dialogRef.close();
  }

  addTag(event: MatChipInputEvent): void {
    const value = (event.value || '').trim();

    if (value && this.node) {
      if (!this.node.tags) {
        this.node.tags = [];
      }
      this.node.tags.push(value);
    }

    if (event.chipInput) {
      event.chipInput.clear();
    }
  }

  removeTag(tag: string): void {
    if (!this.node.tags) {
      return;
    }
    const index = this.node.tags.indexOf(tag);

    if (index >= 0) {
      this.node.tags.splice(index, 1);
    }
  }
}
