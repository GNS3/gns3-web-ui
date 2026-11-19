/**
 * Members of one user group of the signed-in user, as usernames only.
 * This is what the share and distribution dialogs offer as candidate
 * recipients: a user sees the members of their own groups, never the
 * whole user base (that stays User.Audit).
 */
export interface UserGroupMembers {
  group_name: string;
  members: string[];
}

/** Response of GET /access/users/me/group-members (User.GroupMembers). */
export interface UserGroupMembersResponse {
  groups: UserGroupMembers[];
}
