import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import * as ipaddr from 'ipaddr.js';
import { Node } from '../../../../../../cartography/models/node';
import { Controller } from '@models/controller';
import { NodeService } from '@services/node.service';
import { ToasterService } from '@services/toaster.service';
import { ValidationService } from '@services/validation';
import {
  DockerNetworkInterface,
  parseDockerNetworkConfiguration,
  serializeDockerNetworkConfiguration,
} from './docker-network-configuration';

type NetworkEditorSection = 'interfaces' | 'preview';

function subnetMask(prefixLength: number): string {
  return Array.from({ length: 4 }, (_, octet) => {
    const bits = Math.min(8, Math.max(0, prefixLength - octet * 8));
    return bits === 0 ? 0 : 256 - 2 ** (8 - bits);
  }).join('.');
}

@Component({
  selector: 'app-edit-network-configuration',
  templateUrl: './edit-network-configuration.component.html',
  styleUrl: './edit-network-configuration.component.scss',
  imports: [
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatSlideToggleModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditNetworkConfigurationDialogComponent implements OnInit {
  private dialogRef = inject(MatDialogRef<EditNetworkConfigurationDialogComponent>);
  private nodeService = inject(NodeService);
  private toasterService = inject(ToasterService);
  private validationService = inject(ValidationService);
  private cdr = inject(ChangeDetectorRef);

  controller: Controller;
  node: Node;

  readonly interfaces = signal<DockerNetworkInterface[]>([]);
  readonly preservedConfiguration = signal('');
  readonly activeSection = signal<NetworkEditorSection>('interfaces');
  readonly loading = signal(true);
  readonly loadFailed = signal(false);
  readonly saving = signal(false);
  readonly validationErrors = signal<Record<string, string>>({});
  readonly subnetMasks = Array.from({ length: 33 }, (_, index) => {
    const prefixLength = 32 - index;
    const value = subnetMask(prefixLength);
    return {
      value,
      label: `${value} (/${prefixLength})`,
    };
  });
  readonly configurationPreview = computed(() =>
    serializeDockerNetworkConfiguration(this.preservedConfiguration(), this.interfaces())
  );

  ngOnInit() {
    this.nodeService.getNetworkConfiguration(this.controller, this.node).subscribe({
      next: (response: string) => {
        const parsed = parseDockerNetworkConfiguration(response, this.adapterCount());
        this.interfaces.set(parsed.interfaces);
        this.preservedConfiguration.set(parsed.preservedConfiguration);
        this.loading.set(false);
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.loading.set(false);
        this.loadFailed.set(true);
        const message = err.error?.message || err.message || 'Failed to load network configuration';
        this.toasterService.error(message);
        this.cdr.markForCheck();
      },
    });
  }

  adapterCount(): number {
    const configuredAdapters = this.node?.properties?.adapters ?? this.node?.ethernet_adapters ?? 1;
    const count = Number(configuredAdapters);
    return Number.isFinite(count) ? Math.max(0, Math.floor(count)) : 1;
  }

  updateInterface(index: number, changes: Partial<DockerNetworkInterface>) {
    this.interfaces.update((interfaces) =>
      interfaces.map((networkInterface, currentIndex) =>
        currentIndex === index ? { ...networkInterface, ...changes } : networkInterface
      )
    );
    this.validationErrors.set({});
  }

  errorFor(index: number, field: string): string {
    return this.validationErrors()[`${index}.${field}`] ?? '';
  }

  ipv4ModeLabel(mode: DockerNetworkInterface['ipv4Mode']): string {
    switch (mode) {
      case 'static':
        return 'Static IPv4';
      case 'manual':
        return 'Manual';
      default:
        return 'DHCP';
    }
  }

  private validateConfiguration(): boolean {
    const errors: Record<string, string> = {};
    const setError = (index: number, field: string, message: string) => {
      errors[`${index}.${field}`] = message;
    };

    this.interfaces().forEach((networkInterface, index) => {
      if (!networkInterface.enabled) return;

      if (networkInterface.ipv4Mode === 'static') {
        if (!this.validationService.validateIpAddress(networkInterface.ipv4Address).isValid) {
          setError(index, 'ipv4Address', 'Enter a valid IPv4 address');
        }
        if (!this.validationService.validateIpAddress(networkInterface.netmask).isValid) {
          setError(index, 'netmask', 'Enter a valid subnet mask');
        }
      }

      if (
        networkInterface.ipv4Gateway &&
        !this.validationService.validateIpAddress(networkInterface.ipv4Gateway).isValid
      ) {
        setError(index, 'ipv4Gateway', 'Enter a valid IPv4 gateway');
      }
      if (networkInterface.hostname && !this.validationService.validateHostname(networkInterface.hostname).isValid) {
        setError(index, 'hostname', 'Enter a valid hostname');
      }

      const nameservers = networkInterface.dnsNameservers.split(/[\s,]+/).filter(Boolean);
      if (nameservers.some((address) => !ipaddr.isValid(address))) {
        setError(index, 'dnsNameservers', 'Enter valid IPv4 or IPv6 DNS addresses');
      }

      if (networkInterface.mtu) {
        const mtu = Number(networkInterface.mtu);
        if (!Number.isInteger(mtu) || mtu < 68 || mtu > 65535) {
          setError(index, 'mtu', 'MTU must be between 68 and 65535');
        }
      }

      if (networkInterface.ipv6Mode === 'static') {
        if (!ipaddr.IPv6.isValid(networkInterface.ipv6Address)) {
          setError(index, 'ipv6Address', 'Enter a valid IPv6 address');
        }
        const prefix = Number(networkInterface.prefixLength);
        if (!Number.isInteger(prefix) || prefix < 0 || prefix > 128) {
          setError(index, 'prefixLength', 'Prefix length must be between 0 and 128');
        }
        if (networkInterface.ipv6Gateway && !ipaddr.IPv6.isValid(networkInterface.ipv6Gateway)) {
          setError(index, 'ipv6Gateway', 'Enter a valid IPv6 gateway');
        }
      }
    });

    this.validationErrors.set(errors);
    const firstError = Object.values(errors)[0];
    if (firstError) {
      this.activeSection.set('interfaces');
      this.toasterService.error(firstError);
      return false;
    }
    return true;
  }

  onSaveClick() {
    if (this.loading() || this.loadFailed() || this.saving()) return;
    if (!this.validateConfiguration()) return;

    const serializedConfiguration = this.configurationPreview();
    this.saving.set(true);
    this.dialogRef.disableClose = true;
    this.nodeService.saveNetworkConfiguration(this.controller, this.node, serializedConfiguration).subscribe({
      next: () => {
        this.saving.set(false);
        this.dialogRef.disableClose = false;
        this.dialogRef.close();
        this.toasterService.success(`Configuration for node ${this.node.name} saved.`);
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.saving.set(false);
        this.dialogRef.disableClose = false;
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
