import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject, model } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MatDialogModule, MatDialogContent } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { Node } from '../../../../../../cartography/models/node';
import { Controller } from '@models/controller';
import { DockerConfigurationService } from '@services/docker-configuration.service';
import { NodeService } from '@services/node.service';
import { ToasterService } from '@services/toaster.service';
import { ValidationService } from '@services/validation';

@Component({
  selector: 'app-configure-custom-adapters',
  templateUrl: './configure-custom-adapters.component.html',
  styleUrl: './configure-custom-adapters.component.scss',
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule, MatTooltipModule, MatInputModule, MatFormFieldModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfigureCustomAdaptersDialogComponent implements OnInit {
  private dialogRef = inject(MatDialogRef<ConfigureCustomAdaptersDialogComponent>);
  private nodeService = inject(NodeService);
  private toasterService = inject(ToasterService);
  private dockerConfigurationService = inject(DockerConfigurationService);
  private validationService = inject(ValidationService);
  private cdr = inject(ChangeDetectorRef);

  controller: Controller;
  node: Node;
  /** Save callback for template mode */
  saveHandler: (adapters: any[]) => void;

  readonly adapters = model<any[]>([]);

  constructor() {}

  ngOnInit() {
    const currentAdapters: any[] = this.adapters();
    if (currentAdapters.length === 0 && this.node) {
      if (!this.node.custom_adapters) {
        this.node.ports.forEach((port, i) => {
          currentAdapters.push({ adapter_number: i, mac_address: '' });
        });
      } else {
        currentAdapters.push(
          ...this.node.custom_adapters.map((a: any) => ({ ...a, mac_address: a.mac_address || '' }))
        );
      }
      this.adapters.set(currentAdapters);
    } else if (currentAdapters.length > 0) {
      // Ensure mac_address defaults to empty string
      this.adapters.update((adapters) =>
        adapters.map((a) => ({ ...a, mac_address: a.mac_address || '' }))
      );
    }
  }

  onMacAddressChange(adapterNumber: number, value: string) {
    this.adapters.update((adapters) =>
      adapters.map((a) => (a.adapter_number === adapterNumber ? { ...a, mac_address: value } : a))
    );
    this.cdr.markForCheck();
  }

  addAdapter() {
    const maxNumber = this.adapters().reduce((max, a) => Math.max(max, a.adapter_number), -1);
    this.adapters.update((adapters) => [...adapters, { adapter_number: maxNumber + 1, mac_address: '' }]);
  }

  removeAdapter(adapterNumber: number) {
    this.adapters.update((adapters) => adapters.filter((a) => a.adapter_number !== adapterNumber));
    this.cdr.markForCheck();
  }

  isMacAddressValid(mac: string): boolean {
    return this.validationService.validateMacAddress(mac).isValid;
  }

  private hasInvalidMac(): boolean {
    return this.adapters().some(
      (a) => a.mac_address && !this.validationService.validateMacAddress(a.mac_address).isValid
    );
  }

  onSaveClick() {
    if (this.hasInvalidMac()) {
      this.toasterService.error('One or more MAC addresses are invalid (expected XX:XX:XX:XX:XX:XX)');
      return;
    }
    if (this.saveHandler) {
      this.saveHandler(this.adapters());
      this.onCancelClick();
    } else if (this.node) {
      this.node.custom_adapters = this.adapters().map((a: any) => ({
        ...a,
        mac_address: a.mac_address || null,
      }));
      this.nodeService.updateNodeWithCustomAdapters(this.controller, this.node).subscribe({
        next: () => {
          this.onCancelClick();
          this.toasterService.success(`Configuration saved for node ${this.node.name}`);
          this.cdr.markForCheck();
        },
        error: (err) => {
          const message = err.error?.message || err.message || 'Failed to update node with custom adapters';
          this.toasterService.error(message);
          this.cdr.markForCheck();
        },
      });
    }
  }

  onCancelClick() {
    this.dialogRef.close();
  }
}

