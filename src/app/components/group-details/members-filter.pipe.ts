import {Pipe, PipeTransform} from '@angular/core';
import {User} from "@models/users/user";

@Pipe({
  name: 'membersFilter'
})
export class MembersFilterPipe implements PipeTransform {

  transform(members: User[], filterText: string): User[] {
    if (!members) {
      return [];
    }
    if (filterText === undefined || filterText === '') {
      return members;
    }

    return members.filter((member: User) => member.username.toLowerCase().includes(filterText.toLowerCase()));
  }

}
