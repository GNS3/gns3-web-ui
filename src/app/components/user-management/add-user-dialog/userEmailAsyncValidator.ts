import {Server} from "../../../models/server";
import {UserService} from "../../../services/user.service";
import {FormControl} from "@angular/forms";
import {timer} from "rxjs";
import {map, switchMap} from "rxjs/operators";

export const userEmailAsyncValidator = (server: Server, userService: UserService) => {
  return (control: FormControl) => {
    return timer(500).pipe(
      switchMap(() => userService.list(server)),
      map((response) => {
        return (response.find((n) => n.email === control.value) ? { emailExists: true } : null);
      })
    );
  };
};
