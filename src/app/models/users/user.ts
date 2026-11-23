export interface User {
  created_at: string;
  email: string;
  full_name: string;
  last_login: string;
  is_active: boolean;
  is_superadmin: boolean;
  updated_at: string;
  user_id: string;
  username: string;
  // Node quotas: null = inherit the group defaults, -1 = explicitly unlimited.
  max_nodes?: number | null;
  max_running_nodes?: number | null;
}
