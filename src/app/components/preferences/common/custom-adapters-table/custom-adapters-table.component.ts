import { ChangeDetectionStrategy, Component, inject, input, model } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { CustomAdapter } from '@models/qemu/qemu-custom-adapter';
import { ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-custom-adapters-table',
  templateUrl: './custom-adapters-table.component.html',
  styleUrl: '../../preferences.component.scss',
  imports: [
    CommonModule,
    MatTableModule,
    MatSelectModule,
    MatOptionModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatInputModule,
    MatFormFieldModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomAdaptersTableComponent {
  private cd = inject(ChangeDetectorRef);

  readonly networkTypes = input<any[]>([]);
  readonly displayedColumns = input<string[]>([]);
  readonly adapters = model<CustomAdapter[]>([]);

  onAdd() {
    const currentAdapters = this.adapters();
    let adapter: CustomAdapter = {
      adapter_number: currentAdapters.length,
      adapter_type: this.networkTypes()[0]?.value,
    };
    this.adapters.set([...currentAdapters, adapter]);
  }

  delete(adapter: CustomAdapter) {
    this.adapters.set(this.adapters().filter((elem) => elem !== adapter));
  }

  onPortNameChange(adapterNumber: number, value: string) {
    this.adapters.update((adapters) =>
      adapters.map((a) => (a.adapter_number === adapterNumber ? { ...a, port_name: value } : a))
    );
    this.cd.markForCheck();
  }

  onAdapterTypeChange(adapterNumber: number, value: string) {
    this.adapters.update((adapters) =>
      adapters.map((a) => (a.adapter_number === adapterNumber ? { ...a, adapter_type: value } : a))
    );
    this.cd.markForCheck();
  }

  onMacAddressChange(adapterNumber: number, value: string) {
    this.adapters.update((adapters) =>
      adapters.map((a) => (a.adapter_number === adapterNumber ? { ...a, mac_address: value } : a))
    );
    this.cd.markForCheck();
  }
}
