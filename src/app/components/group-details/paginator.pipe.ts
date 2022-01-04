import {Pipe, PipeTransform} from '@angular/core';
import {User} from "@models/users/user";
import {PageEvent} from "@angular/material/paginator";

@Pipe({
  name: 'paginator'
})
export class PaginatorPipe implements PipeTransform {

  transform(members: User[] | undefined, paginatorEvent: PageEvent | undefined): User[] {
    if (!members) {
      return [];
    }

    if (!paginatorEvent) {
      paginatorEvent = {
        length: members.length,
        pageIndex: 0,
        pageSize: 5
      };
    }


    return members.slice(
      paginatorEvent.pageIndex * paginatorEvent.pageSize,
      (paginatorEvent.pageIndex + 1) * paginatorEvent.pageSize);
  }

}
