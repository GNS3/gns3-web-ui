import { ChangeDetectionStrategy, Component, Inject, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ToasterService } from '@services/toaster.service';
import { CustomAdapter } from '@models/qemu/qemu-custom-adapter';

export interface NetworkType {
  value: string;
  name: string;
}

export interface CustomAdaptersDialogData {
  adapters: CustomAdapter[];
  networkTypes: NetworkType[];
  portNameFormat?: string;
  portSegmentSize?: number;
  currentAdapters?: number; // 当前 adapters 数量
}

export interface CustomAdaptersDialogResult {
  adapters: CustomAdapter[];
  requiredAdapters?: number; // 需要的最小 adapters 数量
}

@Component({
  selector: 'app-custom-adapters',
  templateUrl: './custom-adapters.component.html',
  styleUrls: ['./custom-adapters.component.scss'],
  imports: [
    FormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatTooltipModule,
    MatDialogModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomAdaptersComponent {
  readonly dialogRef = inject(MatDialogRef<CustomAdaptersComponent>);
  private toasterService = inject(ToasterService);

  constructor(@Inject(MAT_DIALOG_DATA) public data: CustomAdaptersDialogData) {
    this.adapters = data.adapters ? [...data.adapters] : [];
  }

  public adapters: CustomAdapter[] = [];
  public numberOfAdapters: number;

  get networkTypes(): any[] {
    return this.data.networkTypes || [];
  }

  onAdd() {
    // Find the highest adapter_number to avoid duplicates
    const maxAdapterNumber = this.adapters.length > 0 ? Math.max(...this.adapters.map((a) => a.adapter_number)) : -1;
    const adapterNumber = maxAdapterNumber + 1;

    const portNameFormat = this.data.portNameFormat || 'Ethernet{0}';
    const segmentSize = this.data.portSegmentSize || 0;

    // Generate port name based on format
    let portName: string;
    if (segmentSize > 0) {
      const segment = Math.floor(adapterNumber / segmentSize);
      const portInSegment = adapterNumber % segmentSize;
      portName = portNameFormat.replace('{0}', String(segment * segmentSize + portInSegment));
    } else {
      portName = portNameFormat.replace('{0}', String(adapterNumber));
    }

    const adapter: CustomAdapter = {
      adapter_number: adapterNumber,
      adapter_type: this.networkTypes[0]?.value || 'e1000',
      port_name: portName,
      mac_address: '',
    };
    this.adapters = [...this.adapters, adapter];
  }

  delete(adapter: CustomAdapter) {
    this.adapters = this.adapters.filter((a) => a !== adapter);
  }

  formatMacAddress(mac: string): string {
    if (!mac) return mac;

    // Remove all non-hex characters
    const cleaned = mac.replace(/[^0-9A-Fa-f]/g, '');

    // Check if we have a valid MAC length (12 hex digits)
    if (cleaned.length !== 12) {
      return mac; // Return original if not 12 digits - will fail validation
    }

    // Format as XX:XX:XX:XX:XX:XX - will be validated by isValidMacAddress
    return cleaned.match(/.{1,2}/g)?.join(':') || mac;
  }

  isValidMacAddress(mac: string): boolean {
    if (!mac) return true; // Empty is valid (optional field)
    const macRegex = /^([0-9A-Fa-f]{2}[:]){5}([0-9A-Fa-f]{2})$/;
    return macRegex.test(mac);
  }

  hasInvalidMacAddresses(): boolean {
    return this.adapters.some((adapter) => adapter.mac_address && !this.isValidMacAddress(adapter.mac_address));
  }

  getMacErrorMessage(mac: string): string {
    if (!mac) return ' '; // Return space to always show mat-error element but with empty content
    const cleaned = mac.replace(/[^0-9A-Fa-f]/g, '');
    if (cleaned.length === 0) {
      return 'Invalid MAC address format';
    }
    if (cleaned.length < 12) {
      return `Too short (${cleaned.length}/12 hex digits)`;
    }
    if (cleaned.length > 12) {
      return `Too long (${cleaned.length}/12 hex digits)`;
    }
    return 'Invalid MAC address format (12 hex digits required)';
  }

  cancelConfigureCustomAdapters() {
    this.dialogRef.close();
  }

  configureCustomAdapters() {
    // Check for invalid MAC addresses before submitting
    if (this.hasInvalidMacAddresses()) {
      const invalidAdapters = this.adapters.filter(
        (adapter) => adapter.mac_address && !this.isValidMacAddress(adapter.mac_address)
      );

      const errorMessages = invalidAdapters.map((adapter) => {
        const error = this.getMacErrorMessage(adapter.mac_address);
        return `Adapter ${adapter.adapter_number}: ${error}`;
      });

      this.toasterService.error('Invalid MAC addresses:\n' + errorMessages.join('\n'));
      return;
    }

    // Clean up empty mac_address to avoid backend validation error
    const cleanedAdapters = this.adapters.map((adapter) => ({
      ...adapter,
      mac_address: adapter.mac_address || null, // Convert empty string to null
    }));

    // Calculate required adapters based on the highest adapter_number in custom adapters
    // This handles both adding and deleting adapters
    const maxAdapterNumber = this.adapters.length > 0 ? Math.max(...this.adapters.map((a) => a.adapter_number)) : -1;

    const result: CustomAdaptersDialogResult = {
      adapters: cleanedAdapters,
      requiredAdapters: maxAdapterNumber + 1, // Need at least maxAdapterNumber + 1 adapters
    };

    this.dialogRef.close(result);
  }
}
