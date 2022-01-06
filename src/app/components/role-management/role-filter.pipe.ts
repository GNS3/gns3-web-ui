import { Pipe, PipeTransform } from '@angular/core';
import {Role} from "@models/api/role";
import {User} from "@models/users/user";
import {MatTableDataSource} from "@angular/material/table";

@Pipe({
  name: 'roleFilter'
})
export class RoleFilterPipe implements PipeTransform {

  transform(roles: MatTableDataSource<Role[]>, searchText: string): MatTableDataSource<Role[]> {
    if (!searchText) {
      return roles;
    }
    searchText = searchText.trim().toLowerCase();
    roles.filter = searchText;
    return roles;


  }

}
