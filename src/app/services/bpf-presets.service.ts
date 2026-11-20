import { Injectable, inject, signal } from '@angular/core';
import { ToasterService } from '@services/toaster.service';
import { UserPreferencesService } from '@services/user-preferences.service';

/** A named BPF capture-filter expression shared by marker definitions, link markers and packet filters. */
export interface BpfPreset {
  name: string;
  expression: string;
  /** Grouping label in the rule library. User-created rules use {@link CUSTOM_BPF_CATEGORY}. */
  category: string;
}

/** Category assigned to user-created rules (and to legacy saved entries without one). */
export const CUSTOM_BPF_CATEGORY = 'Custom';

const BPF_PRESETS_KEY = 'gns3.bpf-presets';

@Injectable({ providedIn: 'root' })
export class BpfPresetsService {
  private readonly toasterService = inject(ToasterService);
  private readonly userPreferences = inject(UserPreferencesService);

  readonly builtInBpfPresets: BpfPreset[] = [
    // Capture-filter examples; addresses, ports and VLAN IDs remain editable.
    // --- Hosts & networks ---
    { name: 'Traffic to/from one host', expression: 'host 192.0.2.10', category: 'Hosts & networks' },
    { name: 'Traffic from one host', expression: 'src host 192.0.2.10', category: 'Hosts & networks' },
    { name: 'Traffic to one host', expression: 'dst host 192.0.2.10', category: 'Hosts & networks' },
    {
      name: 'Traffic between two hosts',
      expression: 'host 192.0.2.10 and host 192.0.2.20',
      category: 'Hosts & networks',
    },
    {
      name: 'Traffic from A to B only',
      expression: 'src host 192.0.2.10 and dst host 192.0.2.20',
      category: 'Hosts & networks',
    },
    { name: 'Traffic to/from a subnet', expression: 'net 192.0.2.0/24', category: 'Hosts & networks' },
    { name: 'Traffic sourced from a subnet', expression: 'src net 192.0.2.0/24', category: 'Hosts & networks' },
    { name: 'Traffic destined for a subnet', expression: 'dst net 192.0.2.0/24', category: 'Hosts & networks' },
    { name: 'Exclude a host', expression: 'not host 192.0.2.10', category: 'Hosts & networks' },
    {
      name: 'HTTPS traffic involving a server',
      expression: 'host 192.0.2.10 and tcp port 443',
      category: 'Hosts & networks',
    },
    // --- Protocols ---
    { name: 'IPv4 only', expression: 'ip', category: 'Protocols' },
    { name: 'IPv6 only', expression: 'ip6', category: 'Protocols' },
    { name: 'TCP only', expression: 'tcp', category: 'Protocols' },
    { name: 'UDP only', expression: 'udp', category: 'Protocols' },
    { name: 'ARP', expression: 'arp', category: 'Protocols' },
    { name: 'ICMPv4/ICMPv6', expression: 'icmp or icmp6', category: 'Protocols' },
    { name: 'IPsec ESP', expression: 'esp', category: 'Protocols' },
    { name: 'GRE', expression: 'ip proto 47', category: 'Protocols' },
    { name: 'OSPF', expression: 'ip proto 89', category: 'Protocols' },
    { name: 'IPv4 multicast', expression: 'ip multicast', category: 'Protocols' },
    // --- Ports & services ---
    { name: 'TCP port 443', expression: 'tcp port 443', category: 'Ports & services' },
    { name: 'UDP port range', expression: 'udp portrange 10000-20000', category: 'Ports & services' },
    { name: 'DNS over UDP or TCP', expression: '(udp port 53 or tcp port 53)', category: 'Ports & services' },
    { name: 'HTTP and HTTPS', expression: 'tcp and (port 80 or port 443)', category: 'Ports & services' },
    { name: 'QUIC', expression: 'udp port 443', category: 'Ports & services' },
    { name: 'SSH', expression: 'tcp port 22', category: 'Ports & services' },
    { name: 'DHCPv4', expression: 'udp and (port 67 or port 68)', category: 'Ports & services' },
    { name: 'NTP', expression: 'udp port 123', category: 'Ports & services' },
    { name: 'SNMP', expression: 'udp and (port 161 or port 162)', category: 'Ports & services' },
    { name: 'BGP', expression: 'tcp port 179', category: 'Ports & services' },
    // --- Layer 2 ---
    {
      name: 'Traffic from a MAC address',
      expression: 'ether src 00:11:22:33:44:55',
      category: 'Layer 2',
    },
    { name: 'Broadcasts', expression: 'ether broadcast', category: 'Layer 2' },
    { name: 'VLAN-tagged traffic', expression: 'vlan', category: 'Layer 2' },
    { name: 'Specific VLAN', expression: 'vlan 100', category: 'Layer 2' },
    { name: 'Spanning Tree', expression: 'stp', category: 'Layer 2' },
    { name: 'LLDP', expression: 'ether proto 0x88cc', category: 'Layer 2' },
    // --- Flags & bytes ---
    { name: 'SYN set, including SYN-ACK', expression: 'tcp[tcpflags] & tcp-syn != 0', category: 'Flags & bytes' },
    { name: 'TCP resets', expression: 'tcp[tcpflags] & tcp-rst != 0', category: 'Flags & bytes' },
    { name: 'TCP FIN packets', expression: 'tcp[tcpflags] & tcp-fin != 0', category: 'Flags & bytes' },
    {
      name: 'IPv4 destination unreachable',
      expression: 'icmp and icmp[0] == 3',
      category: 'Flags & bytes',
    },
    {
      name: 'IPv4 ping requests/replies',
      expression: 'icmp and (icmp[0] == 8 or icmp[0] == 0)',
      category: 'Flags & bytes',
    },
    { name: 'Packets longer than 1,400 bytes', expression: 'len > 1400', category: 'Flags & bytes' },
  ];

  readonly customBpfPresets = signal<BpfPreset[]>([]);

  constructor() {
    this.reload();
    // The preferences facade merges the server document after login and wipes
    // the local mirror on logout; re-read the key whenever that happens.
    this.userPreferences.onExternalUpdate(() => this.reload());
  }

  /** Creates or replaces a custom rule (saving under an existing name updates it). */
  save(name: string, expression: string, category: string = CUSTOM_BPF_CATEGORY): boolean {
    name = name.trim();
    expression = expression.trim();
    category = category.trim() || CUSTOM_BPF_CATEGORY;
    if (!name || !expression) return false;
    return this.persist([
      ...this.customBpfPresets().filter((preset) => preset.name !== name),
      { name, expression, category },
    ]);
  }

  delete(name: string): void {
    this.persist(this.customBpfPresets().filter((preset) => preset.name !== name));
  }

  private reload(): void {
    try {
      const saved: unknown = JSON.parse(this.userPreferences.getItem(BPF_PRESETS_KEY) ?? '[]');
      if (!Array.isArray(saved)) {
        this.customBpfPresets.set([]);
        return;
      }
      const presets = new Map<string, BpfPreset>();
      for (const preset of saved) {
        if (
          preset &&
          typeof preset.name === 'string' &&
          preset.name.trim() &&
          typeof preset.expression === 'string' &&
          preset.expression.trim()
        ) {
          const name = preset.name.trim();
          // Entries saved before categories existed (or by older web UI builds)
          // belong to the user's own rules.
          const category =
            typeof preset.category === 'string' && preset.category.trim()
              ? preset.category.trim()
              : CUSTOM_BPF_CATEGORY;
          presets.set(name, { name, expression: preset.expression.trim(), category });
        }
      }
      this.customBpfPresets.set([...presets.values()]);
    } catch {
      // Unavailable storage or malformed saved data must not prevent editing BPF expressions.
      this.customBpfPresets.set([]);
    }
  }

  private persist(presets: BpfPreset[]): boolean {
    const serialized = JSON.stringify(presets);
    try {
      this.userPreferences.setItem(BPF_PRESETS_KEY, serialized);
    } catch {
      // Defensive: the facade normally swallows storage errors itself.
    }
    // The facade reports success by writing through to localStorage; a failed
    // write (quota, disabled storage) leaves the previous value in place.
    if (this.userPreferences.getItem(BPF_PRESETS_KEY) !== serialized) {
      this.toasterService.error('Could not save custom BPF filters in this browser.');
      return false;
    }
    this.customBpfPresets.set(presets);
    return true;
  }
}
