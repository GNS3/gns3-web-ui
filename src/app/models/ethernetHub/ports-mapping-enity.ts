export interface PortsMappingEntity {
  ethertype?: string;
  interface?: string;
  bridge?: string;
  name: string;
  port_number: number;
  type?: string;
  vlan?: number;
  rhost?: string;
  lport?: number;
  rport?: number;
}
