import { Injectable, Injector } from '@angular/core';
import { Controller } from '@models/controller';
import { HttpController } from './http-controller.service';
import { ToasterService } from './toaster.service';

/**
 * localStorage keys mirrored to the controller's per-user preferences
 * document (`GET/PUT /v3/access/users/me/preferences`).
 *
 * The allowlist is the security and size boundary of the mirror: anything
 * not listed here (session tokens, controller registry, per-project caches)
 * stays local-only even when written through the facade.
 */
export const SYNCED_PREFERENCE_KEYS: readonly string[] = [
  // Theme
  'theme',
  'mapTheme',
  // Console appearance
  'gns3_console_appearance',
  // Map settings toggles
  'symbolScaling',
  'showInterfaceLabels',
  'integrateLinkLabelsToLinks',
  'openReadme',
  'openConsolesInWidget',
  'consoleContextMenu',
  'layersVisibility',
  'gridVisibility',
  // Floating widget geometry (restored viewport-clamped, so values from a
  // larger screen degrade safely on a smaller one)
  'topPosition',
  'leftPosition',
  'rightPosition',
  'widthOfWidget',
  'heightOfWidget',
  // AI chat panel (JSON blob: geometry + flags; volatile flags are reset on
  // load anyway, so only the geometry effectively follows the user)
  'ai-chat-panel-state',
  // Project-workspace defaults
  'defaultSceneWidth',
  'defaultSceneHeight',
  'defaultGridSize',
  'defaultDrawingGridSize',
  'defaultShowGrid',
  'defaultSnapToGrid',
  'defaultLabelStyle',
  'defaultNoteStyle',
  'defaultLinkStyle',
  // General settings
  'crash_reports',
  'console_command',
  'statistics_command',
  // Misc UI preferences
  'gns3_interface_density',
  'addNodesViewMode',
  'notificationsVisibility',
  // Active project distributions (JSON refs to server-side background jobs;
  // minutes-scale lifetime, dropped the moment a job finishes — stale refs
  // self-heal via 404 on the next restore, so the doc never accumulates them)
  'gns3-active-distributions',
  // Replay window geometry (JSON: main-window rect + pin tile size; restored
  // viewport-clamped at use time, so values from a larger screen degrade
  // safely on a smaller one — same contract as the widget geometry above)
  'gns3_replay_window_state',
  // User-created BPF rules (JSON array of {name, expression, category};
  // shared by marker definitions, link markers and packet filters). User
  // scoped, so it follows the account across browsers.
  'gns3.bpf-presets',
];

interface UserPreferencesDoc {
  version: number;
  webui: Record<string, string>;
}

interface UserPreferencesResponse {
  preferences?: Partial<UserPreferencesDoc> | null;
  updated_at?: string;
}

/**
 * Mirrors user-scoped UI preferences between localStorage and the
 * controller's per-user preferences document.
 *
 * localStorage stays the working copy (instant reads/writes, offline-safe);
 * the server document is an async mirror that follows the user across
 * browsers. Writes go through this facade, land locally at once and are
 * pushed with a debounce. On login the server document is fetched and
 * merged key-by-key: server values win, except for keys this browser has
 * modified since its last successful sync (last-write-wins per key).
 *
 * Against controllers that predate the endpoint (404) syncing is disabled
 * for the session and the facade degrades to plain localStorage.
 */
@Injectable({
  providedIn: 'root',
})
export class UserPreferencesService {
  private static readonly PREFERENCES_URL = '/access/users/me/preferences';
  private static readonly DOC_VERSION = 1;
  private static readonly MAX_DOC_BYTES = 256 * 1024;
  private static readonly FLUSH_DEBOUNCE_MS = 2000;
  private static readonly SIZE_WARNING_THROTTLE_MS = 60000;
  /**
   * Local-only mirror of `lastSyncedValues`. Persisting the baseline lets the
   * next session still detect edits whose push failed (e.g. server was
   * unreachable when the user closed the tab) and keep them winning over the
   * older server document. Deliberately NOT in SYNCED_PREFERENCE_KEYS.
   */
  private static readonly BASELINE_STORAGE_KEY = 'gns3_prefs_sync_baseline';

  private controller?: Controller;
  private enabled = false;
  /**
   * 404 from the preferences endpoint: this controller predates it. A
   * per-controller fact, so it is reset on every session boundary — one old
   * controller must not disable syncing for the next one in the same SPA
   * session (invalidate() clears it).
   */
  private unavailable = false;
  /**
   * Controller whose preferences session is active (fetch in flight or
   * merged). Exactly one session exists at a time: the local mirror holds a
   * single user's values, so a second controller must never inherit or
   * overwrite the first one's document.
   */
  private sessionControllerId: string | null = null;
  private flushTimer: ReturnType<typeof setTimeout> | undefined;
  private readonly externalUpdateCallbacks = new Set<() => void>();
  /**
   * Bumped by invalidate(): a GET/PUT that started before an invalidation
   * (logout / session expiry) belongs to the previous user — its late
   * response must neither re-seed the cleared mirror nor advance the
   * sync baseline of the session that no longer exists.
   */
  private generation = 0;
  /** Snapshot of the synced keys as of the last merge/push — the baseline for local-edit detection. */
  private lastSyncedValues = new Map<string, string | null>();
  /**
   * Working-copy snapshot taken as the initial GET leaves: writes landing
   * before the first merge have no baseline yet, so this snapshot is what
   * lets the merge recognize them as local edits (and keep them winning
   * over the older server values).
   */
  private localAtSyncStart = new Map<string, string | null>();
  private lastSizeWarningAt = 0;

  /**
   * Constructor-injecting HttpController/ToasterService would close an
   * instantiation cycle (this service → HttpController →
   * ControllerErrorHandler → ToasterService → NotificationCenterService →
   * this service, NG0200). Both are resolved lazily instead: by the time
   * sync() or the oversize warning runs, the injector graph is hydrated, so
   * `injector.get` returns the existing singletons. Keep this service a
   * construction-time leaf.
   */
  private resolvedHttpController?: HttpController;

  constructor(private injector: Injector) {
    this.lastSyncedValues = this.readBaseline();
  }

  private httpController(): HttpController {
    return (this.resolvedHttpController ??= this.injector.get(HttpController));
  }

  private readBaseline(): Map<string, string | null> {
    try {
      const raw = localStorage.getItem(UserPreferencesService.BASELINE_STORAGE_KEY);
      if (!raw) {
        return new Map();
      }
      const parsed = JSON.parse(raw) as Record<string, unknown>;
      const baseline = new Map<string, string | null>();
      for (const key of SYNCED_PREFERENCE_KEYS) {
        if (Object.prototype.hasOwnProperty.call(parsed, key)) {
          const value = parsed[key];
          baseline.set(key, value === null || value === undefined ? null : String(value));
        }
      }
      return baseline;
    } catch {
      return new Map();
    }
  }

  private writeBaseline(baseline: Map<string, string | null>): void {
    try {
      const record: Record<string, string | null> = {};
      for (const key of SYNCED_PREFERENCE_KEYS) {
        if (baseline.has(key)) {
          record[key] = baseline.get(key) ?? null;
        }
      }
      localStorage.setItem(UserPreferencesService.BASELINE_STORAGE_KEY, JSON.stringify(record));
    } catch {
      // Baseline persistence is best-effort; the in-memory map still works.
    }
  }

  // ------------------------------------------------------------------
  // localStorage-compatible facade
  // ------------------------------------------------------------------

  /** Reads always hit localStorage directly — it is the working copy. */
  getItem(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  /**
   * Writes land in localStorage immediately; synced keys additionally
   * schedule a debounced push of the whole document.
   */
  setItem(key: string, value: string): void {
    try {
      localStorage.setItem(key, value);
    } catch {
      return;
    }
    if (SYNCED_PREFERENCE_KEYS.includes(key)) {
      this.markDirty();
    }
  }

  /** Same contract as {@link setItem} for key removal (deletion propagates). */
  removeItem(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch {
      return;
    }
    if (SYNCED_PREFERENCE_KEYS.includes(key)) {
      this.markDirty();
    }
  }

  /**
   * Registers a callback fired after a server merge changed local values.
   * Services with constructor-cached fields use this to re-read their keys.
   */
  onExternalUpdate(callback: () => void): () => void {
    this.externalUpdateCallbacks.add(callback);
    return () => this.externalUpdateCallbacks.delete(callback);
  }

  // ------------------------------------------------------------------
  // Sync lifecycle
  // ------------------------------------------------------------------

  /**
   * Starts syncing against `controller`. Idempotent per controller per
   * session; called from the login guard once the session is authenticated.
   *
   * Only one controller session is active at a time. Switching controllers
   * ends the previous session first (flushing its pending debounced edits to
   * its own document), so pushes can never land in another controller's
   * user document and returning to the first controller re-merges its
   * document instead of trusting a stale latch.
   */
  sync(controller: Controller): void {
    if (!controller || this.unavailable) {
      return;
    }
    const id = String(controller.id);
    if (this.sessionControllerId === id) {
      return;
    }
    if (this.sessionControllerId !== null) {
      this.invalidate();
    }
    this.sessionControllerId = id;
    const generation = this.generation;
    this.localAtSyncStart = new Map(SYNCED_PREFERENCE_KEYS.map((key) => [key, this.getItem(key)]));

    this.httpController().get<UserPreferencesResponse>(controller, UserPreferencesService.PREFERENCES_URL).subscribe({
      next: (response) => {
        if (generation !== this.generation) {
          // The session was invalidated while the GET was in flight: this
          // document belongs to the previous user. Applying it would seed
          // their values into the cleared mirror and a later flush would
          // persist them into the next user's document.
          return;
        }
        this.controller = controller;
        this.enabled = true;
        this.applyServerDoc(this.extractWebui(response));
      },
      error: (err) => {
        if (generation !== this.generation) {
          return;
        }
        // Allow a retry on the next guard pass for transient failures.
        this.sessionControllerId = null;
        if (this.statusOf(err) === 404) {
          this.unavailable = true;
        }
        // 401 was already retried/redirected by HttpController; anything
        // else stays silent — localStorage remains the working copy.
      },
    });
  }

  /** Forget sync state (logout, user switch, session expiry) so the next login re-fetches. */
  invalidate(): void {
    if (this.flushTimer !== undefined) {
      clearTimeout(this.flushTimer);
      this.flushTimer = undefined;
      // Edits still inside the 2 s debounce window belong to the outgoing
      // user: push them before the mirror is torn down. This runs before
      // the generation bump so pushDoc's guard recognizes the session of
      // the PUT and never advances the baseline of the next one.
      this.flush();
    }
    this.generation++;
    this.sessionControllerId = null;
    // Session boundary: whether the endpoint exists is a per-controller
    // fact, so the next sync() must re-probe it instead of inheriting the
    // previous controller's 404 verdict.
    this.unavailable = false;
    const serverHasCopy = this.enabled;
    this.enabled = false;
    this.controller = undefined;
    // Only wipe the local mirror when the server holds a copy of the
    // document (sync was enabled this session): otherwise the wipe would
    // destroy the only copy — user-created BPF rules and widget geometry
    // against controllers without the endpoint would be lost forever.
    if (serverHasCopy) {
      this.clearLocalMirror();
    }
  }

  /**
   * Clears the local mirror of the synced keys on logout: preferences follow
   * the account, so the next user on a shared browser must neither inherit
   * the previous user's values nor re-seed them into their own server
   * document. The baseline goes too — the next login rebuilds the mirror
   * entirely from that user's server document.
   */
  private clearLocalMirror(): void {
    try {
      for (const key of SYNCED_PREFERENCE_KEYS) {
        localStorage.removeItem(key);
      }
      localStorage.removeItem(UserPreferencesService.BASELINE_STORAGE_KEY);
    } catch {
      // Best-effort: storage may be unavailable.
    }
    this.lastSyncedValues = new Map();

    // Services with cached fields re-read (falling back to their built-in
    // defaults). ThemeService intentionally keeps the current theme visually
    // until the next merge brings the new user's preference in.
    for (const callback of this.externalUpdateCallbacks) {
      callback();
    }
  }

  // ------------------------------------------------------------------
  // Merge & push
  // ------------------------------------------------------------------

  private extractWebui(response: UserPreferencesResponse | undefined | null): Record<string, unknown> {
    const doc = response?.preferences;
    const webui = (doc as { webui?: unknown } | undefined)?.webui;
    return typeof webui === 'object' && webui !== null ? (webui as Record<string, unknown>) : {};
  }

  private applyServerDoc(webui: Record<string, unknown>): void {
    const merged: Record<string, string> = {};
    let localChanged = false;
    const haveBaseline = this.lastSyncedValues.size > 0;

    for (const key of SYNCED_PREFERENCE_KEYS) {
      const local = this.getItem(key);
      const serverRaw = Object.prototype.hasOwnProperty.call(webui, key) ? webui[key] : undefined;
      const serverValue = serverRaw === undefined || serverRaw === null ? null : String(serverRaw);
      const locallyModified = haveBaseline
        ? local !== this.lastSyncedValues.get(key)
        : local !== this.localAtSyncStart.get(key);

      if (serverValue !== null && !locallyModified && serverValue !== local) {
        // Server value wins: apply locally and let consumers re-read.
        try {
          localStorage.setItem(key, serverValue);
        } catch {
          // Storage full/unavailable: keep the local value for this key.
        }
        localChanged = true;
        merged[key] = serverValue;
      } else if (serverValue === null && local !== null && !locallyModified && this.lastSyncedValues.has(key)) {
        // The key was part of the last synced document but the server no
        // longer has it: another browser deleted it (a removeItem + flush
        // omits the key from the pushed document). Propagate the deletion
        // locally instead of merging the stale value back into the document.
        try {
          localStorage.removeItem(key);
        } catch {
          // Best-effort; the value must not go back into the document.
        }
        localChanged = true;
      } else if (local !== null) {
        merged[key] = local;
      }
      // Keys absent on both sides are simply omitted from the document.
    }

    // Seed or reconcile: upload the union whenever it differs from what the
    // server returned (covers a never-set document and local-only keys).
    // The sync baseline is only advanced by a successful push — on failure
    // the previous baseline survives so later merges still detect local edits.
    if (JSON.stringify(merged) !== JSON.stringify(this.serverSignature(webui))) {
      this.pushDoc(merged);
    } else {
      this.lastSyncedValues = new Map(SYNCED_PREFERENCE_KEYS.map((key) => [key, this.getItem(key)]));
      this.writeBaseline(this.lastSyncedValues);
    }

    if (localChanged) {
      for (const callback of this.externalUpdateCallbacks) {
        callback();
      }
    }
  }

  private serverSignature(webui: Record<string, unknown>): Record<string, string> {
    const signature: Record<string, string> = {};
    for (const key of SYNCED_PREFERENCE_KEYS) {
      if (Object.prototype.hasOwnProperty.call(webui, key) && webui[key] !== null && webui[key] !== undefined) {
        signature[key] = String(webui[key]);
      }
    }
    return signature;
  }

  private markDirty(): void {
    if (!this.enabled) {
      return;
    }
    if (this.flushTimer !== undefined) {
      clearTimeout(this.flushTimer);
    }
    this.flushTimer = setTimeout(() => {
      this.flushTimer = undefined;
      this.flush();
    }, UserPreferencesService.FLUSH_DEBOUNCE_MS);
  }

  private flush(): void {
    if (!this.enabled || !this.controller) {
      return;
    }
    const webui: Record<string, string> = {};
    for (const key of SYNCED_PREFERENCE_KEYS) {
      const value = this.getItem(key);
      if (value !== null) {
        webui[key] = value;
      }
    }
    this.pushDoc(webui);
  }

  private pushDoc(webui: Record<string, string>): void {
    const controller = this.controller;
    if (!controller) {
      return;
    }
    const generation = this.generation;
    const body: UserPreferencesDoc = { version: UserPreferencesService.DOC_VERSION, webui };
    if (JSON.stringify(body).length > UserPreferencesService.MAX_DOC_BYTES) {
      const now = Date.now();
      if (now - this.lastSizeWarningAt > UserPreferencesService.SIZE_WARNING_THROTTLE_MS) {
        this.lastSizeWarningAt = now;
        this.injector.get(ToasterService).warning('Preferences exceed the 256 KiB sync limit and were not saved to the server');
      }
      return;
    }
    this.httpController().put(controller, UserPreferencesService.PREFERENCES_URL, body).subscribe({
      next: () => {
        if (generation !== this.generation) {
          // The session was invalidated while the PUT was in flight: the
          // push still saved the outgoing user's edit server-side, but the
          // baseline must not be advanced (nor persisted) for the session
          // that no longer exists.
          return;
        }
        this.lastSyncedValues = new Map(
          SYNCED_PREFERENCE_KEYS.map((key) => [key, Object.prototype.hasOwnProperty.call(webui, key) ? webui[key] : null]),
        );
        this.writeBaseline(this.lastSyncedValues);
      },
      error: () => {
        // Push failed (network/auth): local values stay authoritative for
        // this browser; the next write retries, the next merge detects the
        // local edits via the baseline comparison.
      },
    });
  }

  private statusOf(err: unknown): number | undefined {
    const candidate = err as { status?: number; originalError?: { status?: number } } | null;
    return candidate?.originalError?.status ?? candidate?.status;
  }
}
