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
