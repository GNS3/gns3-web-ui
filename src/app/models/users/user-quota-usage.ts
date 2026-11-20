export interface UserQuotaUsage {
  // Effective limits (user value or the group default): null = unlimited.
  max_nodes: number | null;
  max_running_nodes: number | null;
  current_nodes: number;
  current_running_nodes: number;
}
