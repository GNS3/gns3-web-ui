export interface Capabilities {
    node_types: string[];
    platform: string;
    version: string;
}

export interface Compute {
    capabilities: Capabilities;
    compute_id: string;
    connected: boolean;
    cpu_usage_percent: number;
    host: string;
    last_error?: any;
    memory_usage_percent: number;
    name: string;
    port: number;
    protocol: string;
    user: string;
}
