import {Server} from "../../../models/server";
import {FormControl} from "@angular/forms";
import {timer} from "rxjs";
import {map, switchMap} from "rxjs/operators";
import {UserService} from "../../../services/user.service";

export const userNameAsyncValidator = (server: Server, userService: UserService) => {
  return (control: FormControl) => {
    return timer(500).pipe(
      switchMap(() => userService.list(server)),
      map((response) => {
        return (response.find((n) => n.username === control.value) ? { userExists: true } : null);
      })
    );
  };
};
