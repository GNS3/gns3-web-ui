import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map, shareReplay } from 'rxjs/operators';
import { Controller, ControllerProtocol } from '@models/controller';
import {
  ServerSettings,
  ServerSettingsUpdate,
  ServerSettingsUpdateResponse,
} from '@models/server-settings/server-settings';
import {
  OpenApiDocument,
  SettingsSectionSchemas,
  extractSettingsSchemas,
} from '@models/server-settings/settings-schema';
import { HttpController } from './http-controller.service';

@Injectable()
export class ServerSettingsService {
  private http = inject(HttpClient);

  // The OpenAPI document is static for the lifetime of a server process, so
  // each controller pays for the ~300 KB fetch at most once.
  private schemaCache = new Map<number, Observable<SettingsSectionSchemas | null>>();

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

  // Best-effort metadata enrichment: the OpenAPI document lives at the
  // application root (outside /v3, unauthenticated) and is not available on
  // older servers — every failure degrades to the compiled metadata (null).
  getSettingsSchemas(controller: Controller): Observable<SettingsSectionSchemas | null> {
    const cached = this.schemaCache.get(controller.id);
    if (cached) {
      return cached;
    }
    if (!controller.protocol) {
      controller.protocol = location.protocol as ControllerProtocol;
    }
    const url = `${controller.protocol}//${controller.host}:${controller.port}/openapi.json`;
    const request = this.http.get<OpenApiDocument>(url).pipe(
      map((document) => extractSettingsSchemas(document)),
      catchError(() => of(null)),
      shareReplay(1)
    );
    this.schemaCache.set(controller.id, request);
    return request;
  }
}
