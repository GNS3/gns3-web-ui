import { Injectable } from '@angular/core';
import { Controller } from '@models/controller';
import {
  AggregateMarkerMap,
  MarkerDefinitionCreateBody,
  MarkerDefinitionMap,
  MarkerMap,
} from '@models/marker';
import { HttpController } from './http-controller.service';

/** Body for creating/updating a marker. `bpf` is required; the rest are optional. */
export interface MarkerWriteBody {
  bpf: string;
  tag?: number | null;
  name?: string;
  color?: string;
  highlight_duration?: number | null;
  enabled?: boolean;
  /** Optional direction filter: `"tx"` | `"rx"` | `"both"` | null (both = no filter). */
  direction?: 'tx' | 'rx' | 'both' | null;
  /**
   * Link-layer encapsulation (uBridge DLT). Defaults to `"DLT_EN10MB"`. Required for
   * serial/WAN links. Create-only on per-link markers (immutable afterwards).
   */
  data_link_type?: string;
  /**
   * Capture-side (observer) node id — the endpoint `direction` is measured from.
   * Only honored on **create**; immutable afterwards (server ignores it on update —
   * changing it would invert stored direction semantics). Omit/null ⇒ server
   * auto-selects one of the link's endpoints. Not valid on project-level definitions
   * (inherited copies always auto-select).
   */
  capture_node_id?: string | null;
}

/**
 * REST CRUD for traffic-insight markers.
 *
 * Two layers coexist:
 *  - **Per-link private markers** — sub-resource of a link:
 *    `/projects/{pid}/links/{lid}/markers`.
 *  - **Project-level definitions** — `/projects/{pid}/marker-definitions`. The controller
 *    fans each definition out to every capable link as an inherited marker
 *    (`global-{name}`); update syncs all copies, delete clears them, new links inherit.
 *    Inherited markers are read-only per-link (PUT/DELETE → 409) — edit them here.
 *
 * The server validates the BPF expression (via `tcpdump -d`) and returns a 409
 * `{message: "Invalid BPF expression: ..."}` on a bad expression, or a 409 when
 * no running node with uBridge is attached to the link, or a 409 on per-link edit of
 * an inherited marker / reserved `global` name / duplicate name; 422 on validation
 * (name format, `highlight_duration < 1`, missing `bpf`). All are unwrapped by
 * `ControllerErrorHandler` into a `ControllerError` whose `.message` is the server
 * text, so callers surface them with the standard `err.error?.message || err.message`.
 *
 * Marker STATE is also serialized on the link object (`link.markers`), so after
 * any mutation callers should refresh the link via `LinkService.getLink` and
 * update the data sources + `MarkerRegistryService`.
 */
@Injectable()
export class MarkerService {
  constructor(private httpController: HttpController) {}

  /** List all markers on a link. */
  list(controller: Controller, projectId: string, linkId: string) {
    return this.httpController.get<MarkerMap>(
      controller,
      `/projects/${projectId}/links/${linkId}/markers`
    );
  }

  /** Create a marker. `name` may be omitted (server auto-generates `marker-<link_id[0:8]>`). */
  create(controller: Controller, projectId: string, linkId: string, body: MarkerWriteBody) {
    return this.httpController.post<MarkerMap>(
      controller,
      `/projects/${projectId}/links/${linkId}/markers`,
      body
    );
  }

  /** Update a marker's BPF/tag (server implements as delete + re-add). */
  update(
    controller: Controller,
    projectId: string,
    linkId: string,
    name: string,
    body: MarkerWriteBody
  ) {
    return this.httpController.put<MarkerMap>(
      controller,
      `/projects/${projectId}/links/${linkId}/markers/${encodeURIComponent(name)}`,
      body
    );
  }

  /** Delete a marker by name (204 on success). */
  delete(controller: Controller, projectId: string, linkId: string, name: string) {
    return this.httpController.delete(
      controller,
      `/projects/${projectId}/links/${linkId}/markers/${encodeURIComponent(name)}`
    );
  }

  /**
   * Flip only a marker's `enabled` flag — the controller's fast path: signal detection +
   * pcap recording stop/start instantly while traffic keeps forwarding (no NIO rebuild,
   * no pcap flush). Use this for the per-row on/off switch; {@link update} still rebuilds
   * for any other field change (BPF/tag/color/…). PUT `{ enabled }`, returns the link's
   * markers.
   */
  setEnabled(
    controller: Controller,
    projectId: string,
    linkId: string,
    name: string,
    enabled: boolean
  ) {
    return this.httpController.put<MarkerMap>(
      controller,
      `/projects/${projectId}/links/${linkId}/markers/${encodeURIComponent(name)}`,
      { enabled }
    );
  }

  // ---- Project-level definitions (global rules, fanned out to all capable links) ----

  /** List all definitions + the `link_ids` each is currently bound to. */
  listDefinitions(controller: Controller, projectId: string) {
    return this.httpController.get<MarkerDefinitionMap>(
      controller,
      `/projects/${projectId}/marker-definitions`
    );
  }

  /** Create a definition; the controller fans it out to every capable link. */
  createDefinition(
    controller: Controller,
    projectId: string,
    body: MarkerDefinitionCreateBody
  ) {
    return this.httpController.post<MarkerDefinitionMap>(
      controller,
      `/projects/${projectId}/marker-definitions`,
      body
    );
  }

  /** Update a definition; the controller syncs every inherited copy. */
  updateDefinition(
    controller: Controller,
    projectId: string,
    name: string,
    body: MarkerDefinitionCreateBody
  ) {
    return this.httpController.put<MarkerDefinitionMap>(
      controller,
      `/projects/${projectId}/marker-definitions/${encodeURIComponent(name)}`,
      body
    );
  }

  /** Delete a definition; the controller clears every inherited copy. */
  deleteDefinition(controller: Controller, projectId: string, name: string) {
    return this.httpController.delete(
      controller,
      `/projects/${projectId}/marker-definitions/${encodeURIComponent(name)}`
    );
  }

  /**
   * Pause a definition: every inherited copy (`global-{name}`) it fanned out is toggled off
   * via enable_packet_filter — instantly, with no NIO/pcap rebuild. The definition stores a
   * persisted `paused` flag (read back via {@link listDefinitions}); links that later
   * inherit a paused definition start disabled. 204, no body.
   */
  pauseDefinition(controller: Controller, projectId: string, name: string) {
    return this.httpController.post<void>(
      controller,
      `/projects/${projectId}/marker-definitions/${encodeURIComponent(name)}/pause`,
      {}
    );
  }

  /** Resume a paused definition — re-enables every inherited copy. 204, no body. */
  resumeDefinition(controller: Controller, projectId: string, name: string) {
    return this.httpController.post<void>(
      controller,
      `/projects/${projectId}/marker-definitions/${encodeURIComponent(name)}/resume`,
      {}
    );
  }

  // ---- Aggregation ----

  /** Flat list of every marker across all links, keyed `"{link_id}/{name}"`. */
  aggregateList(controller: Controller, projectId: string) {
    return this.httpController.get<AggregateMarkerMap>(
      controller,
      `/projects/${projectId}/markers`
    );
  }
}
