export enum Methods {
  GET = 'GET',
  HEAD = 'HEAD',
  POST = 'POST',
  PATCH = 'PATCH',
  PUT = 'PUT',
  DELETE = 'DELETE'
}

export enum PermissionActions {
  ALLOW = 'ALLOW',
  DENY = 'DENY'
}

export interface Permission {
  methods: Methods[],
  path: string,
  action: PermissionActions,
  description: string,
  created_at: string,
  updated_at: string,
  permission_id: string
}
