import { ChangeDetectionStrategy, Component, computed, effect, inject, input, model, signal } from '@angular/core';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Controller } from '@models/controller';
import { NetmikoDeviceType } from '@models/netmiko-device-type';
import { NetmikoDeviceTypesService } from '@services/netmiko-device-types.service';

interface DeviceTypeGroup {
  vendor: string;
  types: NetmikoDeviceType[];
}

/**
 * Netmiko device type input for template and node editors: a free-text
 * field that becomes a searchable, vendor-grouped dropdown when the server
 * exposes the device type list. Typing always writes through — values
 * outside the list are legal and saved as-is; with a list loaded, such a
 * value is marked "not in list" but never blocked.
 */
@Component({
  selector: 'app-netmiko-device-type-select',
  standalone: true,
  imports: [MatAutocompleteModule, MatFormFieldModule, MatInputModule],
  templateUrl: './netmiko-device-type-select.component.html',
  styleUrl: './netmiko-device-type-select.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NetmikoDeviceTypeSelectComponent {
  readonly value = model('');
  /** The server to query; the editors all hold the current controller. */
  readonly controller = input<Controller>(undefined);
  /** 'fill' on the preferences pages, default (outline) in the node configurator dialogs. */
  readonly appearance = input<'fill' | 'outline'>('outline');

  private readonly netmikoDeviceTypesService = inject(NetmikoDeviceTypesService);

  private readonly state = signal<'idle' | 'loading' | 'ready' | 'unavailable'>('idle');
  private readonly deviceTypes = signal<NetmikoDeviceType[] | null>(null);

  readonly hasList = computed(() => this.state() === 'ready');

  /** Vendor-grouped (name.split('_')[0]) list, filtered by the typed text. */
  readonly groups = computed<DeviceTypeGroup[]>(() => {
    const types = this.deviceTypes() ?? [];
    const term = this.value().trim().toLowerCase();
    const filtered = term ? types.filter((type) => type.name.toLowerCase().includes(term)) : types;

    const byVendor = new Map<string, NetmikoDeviceType[]>();
    for (const type of filtered) {
      const vendor = type.name.split('_')[0];
      const bucket = byVendor.get(vendor);
      if (bucket) {
        bucket.push(type);
      } else {
        byVendor.set(vendor, [type]);
      }
    }
    return [...byVendor.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([vendor, list]) => ({ vendor, types: list }));
  });

  /** Current value is set but not among the server's types (historic/manual data). */
  readonly notInList = computed(() => {
    const types = this.deviceTypes();
    const value = this.value().trim();
    if (!types || !value) return false;
    return !types.some((type) => type.name === value);
  });

  constructor() {
    effect(() => {
      if (this.controller() && this.state() === 'idle') {
        this.load();
      }
    });
  }

  /** Fetch once per controller (service caches); also retried on focus while idle. */
  load() {
    const controller = this.controller();
    if (!controller || this.state() !== 'idle') return;

    this.state.set('loading');
    this.netmikoDeviceTypesService.getDeviceTypes(controller).subscribe((result) => {
      if (result.deviceTypes) {
        this.deviceTypes.set(result.deviceTypes);
        this.state.set('ready');
      } else {
        this.state.set('unavailable');
      }
    });
  }

  onInput(event: Event) {
    this.value.set((event.target as HTMLInputElement).value);
  }

  onOptionSelected(value: string) {
    this.value.set(value);
  }
}
