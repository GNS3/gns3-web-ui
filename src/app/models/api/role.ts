import {Permission} from "./permission";

export interface Role {
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
  role_id: string;
  is_builtin: boolean;
  permissions: Permission[];
}
