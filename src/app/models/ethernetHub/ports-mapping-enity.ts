export interface PortsMappingEntity {
    ethertype?: string;
    interface?: string,
    name: string;
    port_number: number;
    type?: string;
    vlan?: number;
    rhost?: string;
    lport?: number;
    rport?: number;
}
