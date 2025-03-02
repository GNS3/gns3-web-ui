import { Injectable } from '@angular/core';
import 'rxjs/add/operator/map';
import { Controller } from '../models/controller';
import { Version } from '../models/version';
import { HttpController } from './http-controller.service';

@Injectable()
export class VersionService {
  constructor(private httpController: HttpController) {}

  get(controller: Controller ) {
    return this.httpController.get<Version>(controller, '/version');
  }
}
