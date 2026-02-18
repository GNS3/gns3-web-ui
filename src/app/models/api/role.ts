import {Privilege} from "@models/api/Privilege";

export interface Role {
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
  role_id: string;
  is_builtin: boolean;
  privileges: Privilege[];
}
