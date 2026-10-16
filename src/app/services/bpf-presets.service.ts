import { Injectable, inject, signal } from '@angular/core';
import { ToasterService } from '@services/toaster.service';

interface BpfPreset {
  name: string;
  expression: string;
}
const BPF_PRESETS_KEY = 'gns3.bpf-presets';

@Injectable({ providedIn: 'root' })
export class BpfPresetsService {
  private readonly toasterService = inject(ToasterService);
  readonly builtInBpfPresets: BpfPreset[] = [
    // Capture-filter examples; addresses, ports and VLAN IDs remain editable.
    { name: 'Traffic to/from one host', expression: 'host 192.0.2.10' },
    { name: 'Traffic from one host', expression: 'src host 192.0.2.10' },
    { name: 'Traffic to one host', expression: 'dst host 192.0.2.10' },
    { name: 'Traffic between two hosts', expression: 'host 192.0.2.10 and host 192.0.2.20' },
    { name: 'Traffic from A to B only', expression: 'src host 192.0.2.10 and dst host 192.0.2.20' },
    { name: 'Traffic to/from a subnet', expression: 'net 192.0.2.0/24' },
    { name: 'Traffic sourced from a subnet', expression: 'src net 192.0.2.0/24' },
    { name: 'Traffic destined for a subnet', expression: 'dst net 192.0.2.0/24' },
    { name: 'Exclude a host', expression: 'not host 192.0.2.10' },
    { name: 'IPv4 only', expression: 'ip' },
    { name: 'IPv6 only', expression: 'ip6' },
    { name: 'TCP only', expression: 'tcp' },
    { name: 'UDP only', expression: 'udp' },
    { name: 'ARP', expression: 'arp' },
    { name: 'ICMPv4/ICMPv6', expression: 'icmp or icmp6' },
    { name: 'TCP port 443', expression: 'tcp port 443' },
    { name: 'UDP port range', expression: 'udp portrange 10000-20000' },
    { name: 'DNS over UDP or TCP', expression: '(udp port 53 or tcp port 53)' },
    { name: 'HTTP and HTTPS', expression: 'tcp and (port 80 or port 443)' },
    { name: 'QUIC', expression: 'udp port 443' },
    { name: 'SSH', expression: 'tcp port 22' },
    { name: 'DHCPv4', expression: 'udp and (port 67 or port 68)' },
    { name: 'NTP', expression: 'udp port 123' },
    { name: 'SNMP', expression: 'udp and (port 161 or port 162)' },
    { name: 'BGP', expression: 'tcp port 179' },
    { name: 'OSPF', expression: 'ip proto 89' },
    { name: 'GRE', expression: 'ip proto 47' },
    { name: 'IPsec ESP', expression: 'esp' },
    { name: 'Traffic from a MAC address', expression: 'ether src 00:11:22:33:44:55' },
    { name: 'Broadcasts', expression: 'ether broadcast' },
    { name: 'IPv4 multicast', expression: 'ip multicast' },
    { name: 'VLAN-tagged traffic', expression: 'vlan' },
    { name: 'Specific VLAN', expression: 'vlan 100' },
    { name: 'Spanning Tree', expression: 'stp' },
    { name: 'LLDP', expression: 'ether proto 0x88cc' },
    { name: 'SYN set, including SYN-ACK', expression: 'tcp[tcpflags] & tcp-syn != 0' },
    { name: 'TCP resets', expression: 'tcp[tcpflags] & tcp-rst != 0' },
    { name: 'TCP FIN packets', expression: 'tcp[tcpflags] & tcp-fin != 0' },
    { name: 'IPv4 destination unreachable', expression: 'icmp and icmp[0] == 3' },
    { name: 'IPv4 ping requests/replies', expression: 'icmp and (icmp[0] == 8 or icmp[0] == 0)' },
    { name: 'Packets longer than 1,400 bytes', expression: 'len > 1400' },
    { name: 'HTTPS traffic involving a server', expression: 'host 192.0.2.10 and tcp port 443' },
  ];
  readonly customBpfPresets = signal<BpfPreset[]>([]);

  constructor() {
    try {
      const saved: unknown = JSON.parse(localStorage.getItem(BPF_PRESETS_KEY) ?? '[]');
      if (Array.isArray(saved)) {
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
            presets.set(name, { name, expression: preset.expression.trim() });
          }
        }
        this.customBpfPresets.set([...presets.values()]);
      }
    } catch {
      // Unavailable storage or malformed saved data must not prevent editing BPF expressions.
    }
  }

  save(name: string, expression: string): boolean {
    name = name.trim();
    expression = expression.trim();
    if (!name || !expression) return false;
    return this.persist([...this.customBpfPresets().filter((preset) => preset.name !== name), { name, expression }]);
  }

  delete(name: string) {
    this.persist(this.customBpfPresets().filter((preset) => preset.name !== name));
  }

  private persist(presets: BpfPreset[]): boolean {
    try {
      localStorage.setItem(BPF_PRESETS_KEY, JSON.stringify(presets));
      this.customBpfPresets.set(presets);
      return true;
    } catch {
      this.toasterService.error('Could not save custom BPF filters in this browser.');
      return false;
    }
  }
}
