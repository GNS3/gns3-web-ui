import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Controller } from '@models/controller';
import {
  ServerSettings,
  ServerSettingsUpdate,
  ServerSettingsUpdateResponse,
} from '@models/server-settings/server-settings';
import { HttpController } from './http-controller.service';

@Injectable()
export class ServerSettingsService {
  constructor(private httpController: HttpController) {}

  getServerSettings(controller: Controller): Observable<ServerSettings> {
    return this.httpController.get<ServerSettings>(controller, '/settings') as Observable<ServerSettings>;
  }

  updateServerSettings(
    controller: Controller,
    update: ServerSettingsUpdate
  ): Observable<ServerSettingsUpdateResponse> {
    return this.httpController.put<ServerSettingsUpdateResponse>(
      controller,
      '/settings',
      update
    ) as Observable<ServerSettingsUpdateResponse>;
  }
}
