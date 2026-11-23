import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { Observable } from 'rxjs';
import { Controller } from '@models/controller';
import { HttpController } from './http-controller.service';
import { User } from '@models/users/user';
import { UserGroupMembersResponse } from '@models/users/user-group-members';
import { UserQuotaUsage } from '@models/users/user-quota-usage';
import { Group } from '@models/groups/group';
import { Image } from '@models/images';

@Injectable()
export class UserService {
  constructor(private httpController: HttpController) {}

  getInformationAboutLoggedUser(controller: Controller) {
    return this.httpController.get<User>(controller, '/access/users/me');
  }

  getQuotas(controller: Controller) {
    return this.httpController.get<UserQuotaUsage>(controller, '/access/users/me/quotas');
  }

  /**
   * Members of the signed-in user's own groups, as usernames only — the
   * recipient source of the share and distribution dialogs (User.GroupMembers).
   * The full user list still requires User.Audit.
   */
  getGroupMembers(controller: Controller) {
    return this.httpController.get<UserGroupMembersResponse>(controller, '/access/users/me/group-members');
  }

  get(controller: Controller, user_id: string) {
    return this.httpController.get<User>(controller, `/access/users/${user_id}`);
  }

  list(controller: Controller) {
    return this.httpController.get<User[]>(controller, '/access/users');
  }

  add(controller: Controller, user: any): Observable<User> {
    return this.httpController.post<User>(controller, `/access/users`, user);
  }

  delete(controller: Controller, user_id: string) {
    return this.httpController.delete(controller, `/access/users/${user_id}`);
  }

  update(controller: Controller, user: any, self_update: boolean): Observable<User> {
    if (self_update) {
      return this.httpController.put<User>(controller, `/access/users/me`, user);
    }
    return this.httpController.put<User>(controller, `/access/users/${user.user_id}`, user);
  }

  getGroupsByUserId(controller: Controller, user_id: string) {
    return this.httpController.get<Group[]>(controller, `/access/users/${user_id}/groups`);
  }
}
