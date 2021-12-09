import { FormControl } from '@angular/forms';
import { timer } from 'rxjs';
import {map, switchMap, tap} from 'rxjs/operators';
import {Server} from "../../../models/server";
import {GroupService} from "../../../services/group.service";

export const groupNameAsyncValidator = (server: Server, groupService: GroupService) => {
  return (control: FormControl) => {
    return timer(500).pipe(
      switchMap(() => groupService.getGroups(server)),
      map((response) => {
        console.log(response);
        return (response.find((n) => n.name === control.value) ? { projectExist: true } : null);
      })
    );
  };
};
