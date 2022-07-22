import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import{ Controller } from '../models/controller';
import { HttpController } from './http-controller.service';
import { User } from '../models/users/user';

@Injectable()
export class UserService {
  constructor(
    private httpController: HttpController
  ) {}

  getInformationAboutLoggedUser(controller:Controller ) {
    return this.httpController.get<User>(controller, '/users/me/');
  }
}
