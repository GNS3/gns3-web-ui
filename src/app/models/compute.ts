export interface Capabilities {
  node_types: string[];
  platform: string;
  version: string;
  cpus?: number;
  memory?: number;
  disk_size?: number;
}

export interface Compute {
  capabilities: Capabilities;
  compute_id: string;
  connected: boolean;
  cpu_usage_percent: number;
  disk_usage_percent?: number;
  host: string;
  last_error?: any;
  memory_usage_percent: number;
  name: string;
  port: number;
  protocol: string;
  user: string;
}

export interface ComputeCreate {
  protocol: 'http' | 'https';
  host: string;
  port: number;
  user?: string;
  password?: string;
  name?: string;
}

export interface ComputeUpdate {
  protocol?: 'http' | 'https';
  host?: string;
  port?: number;
  user?: string;
  password?: string;
  name?: string;
}
