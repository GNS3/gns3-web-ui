import { inject, Injectable, signal } from '@angular/core';
import { Controller } from '@models/controller';
import { catchError, map, Observable, shareReplay, tap, throwError } from 'rxjs';
import { HttpController } from './http-controller.service';
import { StartupMediaProfile } from '@models/startup-media-profile';

/** Keeps the entries that carry the fields the UI shows; the server owns the catalog. */
export function normalizeStartupMediaProfiles(raw: unknown): StartupMediaProfile[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((item) => item && typeof item === 'object' && typeof item.id === 'string' && item.id)
    .map((item) => ({
      id: item.id,
      title: typeof item.title === 'string' && item.title ? item.title : item.id,
      device_type: typeof item.device_type === 'string' ? item.device_type : '',
      description: typeof item.description === 'string' ? item.description : '',
    }));
}

/**
 * Catalog of native boot media profiles (`GET /v3/startup-media-profiles`).
 * Fetched once per controller; a failed fetch is not cached, so the next
 * caller retries. Callers keep their own state (signals) and must show the
 * node's current value read-only when the catalog cannot be loaded.
 */
@Injectable({ providedIn: 'root' })
export class StartupMediaProfilesService {
  private http = inject(HttpController);
  private readonly deviceTypes = signal(new Map<string, ReadonlyMap<string, string>>());
  private cache = new Map<string, Observable<StartupMediaProfile[]>>();

  private key(controller: Controller): string {
    return String(controller.id ?? `${controller.host}:${controller.port}`);
  }

  deviceType(controller: Controller, id: string): string | undefined {
    return this.deviceTypes().get(this.key(controller))?.get(id);
  }

  list(controller: Controller): Observable<StartupMediaProfile[]> {
    const key = this.key(controller);
    let catalog = this.cache.get(key);
    if (!catalog) {
      catalog = this.http.get<unknown>(controller, '/startup-media-profiles').pipe(
        map(normalizeStartupMediaProfiles),
        tap((profiles) => {
          if (this.cache.get(key) === catalog) {
            this.deviceTypes.update((current) =>
              new Map(current).set(
                key,
                new Map(
                  profiles.filter((profile) => profile.device_type).map((profile) => [profile.id, profile.device_type]),
                ),
              ),
            );
          }
        }),
        catchError((error) => {
          if (this.cache.get(key) === catalog) this.cache.delete(key);
          return throwError(() => error);
        }),
        shareReplay({ bufferSize: 1, refCount: false }),
      );
      this.cache.set(key, catalog);
    }
    return catalog;
  }
}
