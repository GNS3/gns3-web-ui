import { Injectable, signal } from '@angular/core';
import { Link } from '@models/link';
import { AggregateMarkerMap } from '@models/marker';

/** A marker definition in the project, projected from `link.markers` for the legend. */
export interface MarkerEntry {
  name: string;
  linkId: string;
  bpf: string;
  tag?: number | null;
  color?: string;
}

/**
 * Project-wide marker definitions for the legend.
 *
 * Updated ONLY when markers actually change: once on project load (`rebuildAll`)
 * and per-link on topology WS events and dialog CRUD (`reconcileLink` / `removeLink`).
 * Never updated on drags — the `sameSet` guard keeps the signal from firing when
 * a reconcile doesn't actually change the projected set.
 */
@Injectable()
export class MarkerRegistryService {
  private readonly _entries = signal<MarkerEntry[]>([]);

  /** Read-only signal consumed by the legend (and any future marker UI). */
  readonly entries = this._entries.asReadonly();

  getSnapshot(): MarkerEntry[] {
    return this._entries();
  }

  /** Full rebuild — call once after the project's links are loaded. */
  rebuildAll(links: Link[]) {
    const entries: MarkerEntry[] = [];
    for (const link of links) {
      this.collect(link, entries);
    }
    this.setEntries(entries);
  }

  /**
   * Rebuild from the aggregate marker map (GET /projects/{pid}/markers).
   * Used when definition CRUD fans out to many links — the aggregate API has
   * the authoritative per-link state while local link objects may be stale.
   */
  rebuildFromAggregate(map: AggregateMarkerMap) {
    const entries: MarkerEntry[] = [];
    for (const [key, entry] of Object.entries(map)) {
      // key is "{link_id}/{name}"
      const slashIdx = key.indexOf('/');
      const name = slashIdx >= 0 ? key.slice(slashIdx + 1) : key;
      entries.push({
        name,
        linkId: entry.link_id,
        bpf: entry.bpf,
        tag: entry.tag ?? null,
        color: entry.color,
      });
    }
    this.setEntries(entries);
  }

  /** Reconcile a single link's markers: drop its old entries, add the current ones. */
  reconcileLink(link: Link) {
    const entries = this._entries().filter((entry) => entry.linkId !== link.link_id);
    this.collect(link, entries);
    this.setEntries(entries);
  }

  /** Drop all entries belonging to a link (on link deletion). */
  removeLink(linkId: string) {
    const entries = this._entries().filter((entry) => entry.linkId !== linkId);
    this.setEntries(entries);
  }

  /**
   * Clear every entry (project switch). This service is an app-lifetime
   * singleton that outlives the project map component, so without this the
   * legend keeps rendering the previous project's marker pills until the new
   * project's links fetch completes — or forever if that fetch fails.
   */
  reset() {
    this._entries.set([]);
  }

  private collect(link: Link, into: MarkerEntry[]) {
    if (!link.markers) {
      return;
    }
    for (const [name, marker] of Object.entries(link.markers)) {
      into.push({ name, linkId: link.link_id, bpf: marker.bpf, tag: marker.tag, color: marker.color });
    }
  }

  private setEntries(entries: MarkerEntry[]) {
    // Only push when the projected set actually changed, so consumers (legend)
    // never re-render on a no-op reconcile.
    if (!sameSet(this._entries(), entries)) {
      this._entries.set(entries);
    }
  }
}

function sameSet(a: MarkerEntry[], b: MarkerEntry[]): boolean {
  if (a.length !== b.length) {
    return false;
  }
  const key = (e: MarkerEntry) => `${e.linkId}\0${e.name}\0${e.bpf}\0${e.tag ?? ''}\0${e.color ?? ''}`;
  const sa = new Set(a.map(key));
  for (const e of b) {
    if (!sa.has(key(e))) {
      return false;
    }
  }
  return true;
}
