import { Injectable, inject } from '@angular/core';
import { of, Observable } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { Controller } from '@models/controller';
import { NetmikoDeviceTypesResponse } from '@models/netmiko-device-type';
import { HttpController } from './http-controller.service';

/**
 * Result of GET /v3/netmiko/device_types. `deviceTypes: null` means the
 * list is unavailable (501 netmiko missing / any error) — callers keep the
 * free-text input instead of a dropdown.
 */
export interface NetmikoDeviceTypesResult {
  deviceTypes: NetmikoDeviceTypesResponse['device_types'] | null;
  netmikoVersion: string | null;
}

@Injectable({
  providedIn: 'root',
})
export class NetmikoDeviceTypesService {
  private readonly httpController = inject(HttpController);

  /** Per-controller session cache; the server caches too, this avoids a request per dialog open. */
  private readonly cache = new Map<string, NetmikoDeviceTypesResult>();

  getDeviceTypes(controller: Controller): Observable<NetmikoDeviceTypesResult> {
    const key = controller.id.toString();
    const cached = this.cache.get(key);
    if (cached) {
      return of(cached);
    }

    return this.httpController.get<NetmikoDeviceTypesResponse>(controller, '/netmiko/device_types').pipe(
      map((response) => ({
        deviceTypes: response.device_types ?? [],
        netmikoVersion: response.netmiko_version ?? null,
      })),
      // 501 (netmiko not installed) or any error — the field still works as free text
      catchError(() => of<NetmikoDeviceTypesResult>({ deviceTypes: null, netmikoVersion: null })),
      tap((result) => this.cache.set(key, result))
    );
  }
}
