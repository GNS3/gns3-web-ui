export interface Statistics {
  cpu_usage_percent: number;
  disk_usage_percent: number;
  load_average_percent: number[];
  memory_free: number;
  memory_total: number;
  memory_usage_percent: number;
  memory_used: number;
  swap_free: number;
  swap_total: number;
  swap_usage_percent: number;
  swap_used: number;
}

export interface ComputeStatistics {
  compute_id: string;
  compute_name: string;
  statistics: Statistics;
}

export interface ProjectStats {
  total: number;
  open_project_nodes: number;
  closed_project_nodes: number;
}

export interface NodeStats {
  total: number;
  open_project_nodes: number;
  closed_project_nodes: number;
  by_type: Record<string, number>;
  by_status: Record<string, number>;
}

export interface LinkStats {
  total: number;
  capturing: number;
}

export interface ControllerStatistics {
  computes: ComputeStatistics[];
  projects: ProjectStats;
  nodes: NodeStats;
  links: LinkStats;
}
