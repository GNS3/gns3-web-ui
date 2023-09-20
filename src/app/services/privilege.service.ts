import { Injectable } from '@angular/core';
import {HttpController} from "@services/http-controller.service";
import {Controller} from "@models/controller";
import {Privilege} from "@models/api/Privilege";

@Injectable({
  providedIn: 'root'
})
export class PrivilegeService {

  constructor(private httpController: HttpController) { }


  get(controller: Controller) {
    return this.httpController.get<Privilege[]>(controller, "/access/privileges")
  }
}
