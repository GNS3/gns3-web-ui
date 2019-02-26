import { PortsMappingEntity } from '../ethernetHub/ports-mapping-enity';

export interface EthernetHubTemplate {
    builtin: boolean;
    category: string;
    compute_id: string;
    default_name_format: string;
    name: string;
    ports_mapping?: PortsMappingEntity[];
    symbol: string;
    template_id: string;
    template_type: string;
}
