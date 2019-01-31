import { PortsMappingEntity } from '../ethernetHub/ports-mapping-enity';

export interface CloudTemplate {
    builtin: boolean;
    category: string;
    compute_id: string;
    default_name_format: string;
    name: string;
    ports_mapping?: PortsMappingEntity[];
    remote_console_host: string;
    remote_console_http_path: string;
    remote_console_port: number;
    remote_console_type: string;
    symbol: string;
    template_id: string;
    template_type: string;
}
