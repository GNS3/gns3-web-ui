import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  effect,
  inject,
  input,
  model,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

import { ProtocolTreeNode } from '@models/marker-replay';
import {
  FlatRow,
  ancestorKeys,
  collectKeys,
  flattenTree,
  rowSearchText,
  rowText,
  rowTooltip,
} from './protocol-tree';
import { ancestorPaths } from './replay-tree-diff';

/** Attribute-selector-safe row key ("/0/1" is safe already — stay robust). */
function cssEscape(s: string): string {
  return typeof CSS !== 'undefined' && typeof CSS.escape === 'function' ? CSS.escape(s) : s;
}

/**
 * Wireshark-style packet-detail tree, rendered FLAT (one component, one
 * `@for`): the PDML tree is flattened by {@link flattenTree} against an
 * expansion-key set, so these all stay simple signal writes:
 *
 *  - COLLAPSED BY DEFAULT — the initial view is just the protocol list
 *    (Ethernet II / IP / TCP…); the crumbs row above gives the chain at a
 *    glance, clicking a protocol dives in;
 *  - indentation is fixed-width guide columns (one 12px column per ancestor,
 *    hairline on its left edge) instead of piled-up row padding — columns
 *    align across rows, so the hierarchy reads as vertical rails;
 *  - clicking a row SELECTS it (Wireshark's blue row highlight) and toggles
 *    expansion when it carries children;
 *  - an Expand-all / Collapse-all toolbar mirrors Wireshark's tree buttons;
 *  - a 🔍 in that toolbar opens a find-in-details bar — the query is SHARED
 *    across every window ({@link searchQuery}), matches auto-expand their
 *    ancestors, Enter/Shift+Enter walk them.
 *
 * `hide="true"` fields never render (Wireshark hides them too); monospace is
 * deliberate — bit-mask rows (`0100 .... = Version: 4`) only align in a
 * fixed-width font.
 */
@Component({
  selector: 'app-protocol-tree',
  templateUrl: './protocol-tree.component.html',
  styleUrl: './protocol-tree.component.scss',
  imports: [CommonModule, MatIconModule, MatTooltipModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProtocolTreeComponent {
  readonly tree = input.required<ProtocolTreeNode[]>();
  /**
   * Cross-window comparison diff (pinned windows with ≥2 decoded frames):
   * paths of leaves that differ between them, plus (derived) their ancestors
   * so collapsed protocol rows still flag "something inside changed". Null on
   * the live window — there is nothing to compare it against.
   */
  readonly changedPaths = input<ReadonlySet<string> | null>(null);
  /**
   * Live text-search query, TWO-WAY bound to the session-shared signal in
   * MarkerReplayService — typing here lights up the matches in EVERY window
   * (live + pinned) at once; each tree keeps its own match position/count.
   */
  readonly searchQuery = model('');
  /** Whether the search bar is open in THIS tree (✕/Esc closes it). */
  readonly searchOpen = signal(false);

  readonly expanded = signal<ReadonlySet<string>>(new Set());
  readonly selectedKey = signal<string | null>(null);
  private readonly matchIdx = signal(0);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly searchInput = viewChild<ElementRef<HTMLInputElement>>('searchInput');
  /** Focus owed to a LOCAL toggle-on (never to a query arriving from a sibling window). */
  private focusPending = false;

  readonly rows = computed(() => flattenTree(this.tree(), this.expanded()));
  readonly hasExpandable = computed(() => collectKeys(this.tree()).length > 0);
  readonly diffAncestors = computed(() => {
    const changed = this.changedPaths();
    return changed ? ancestorPaths(changed) : new Set<string>();
  });

  // ---- text search ----

  /** Every row as if fully expanded — search must see into collapsed branches. */
  private readonly allRows = computed(() => {
    const tree = this.tree();
    return flattenTree(tree, new Set(collectKeys(tree)));
  });

  /** Rows matching the query, in tree order — the navigation sequence. */
  readonly matches = computed(() => {
    const q = this.searchQuery().trim().toLowerCase();
    if (!q) return [];
    return this.allRows().filter((r) => rowSearchText(r.node).includes(q));
  });

  /** Semantic paths of the matches — the row-highlight keyspace (like the diff). */
  readonly matchPaths = computed(() => new Set(this.matches().map((m) => m.path)));

  readonly matchCount = computed(() => this.matches().length);

  readonly currentMatchKey = computed(() => {
    const m = this.matches();
    if (!m.length) return null;
    return m[Math.min(this.matchIdx(), m.length - 1)].key;
  });

  /** "2/17" for the search bar. */
  readonly matchLabel = computed(() => {
    const n = this.matchCount();
    return n ? `${Math.min(this.matchIdx(), n - 1) + 1}/${n}` : '0';
  });

  constructor() {
    // New query or tree → restart at the first match and REVEAL every match by
    // unioning ancestor keys into the expansion set. Grow-only: clearing the
    // query leaves the opened branches for browsing (Collapse-all still
    // works). The current expansion is read UNTRACKED — a manual expand must
    // not re-run this (and reset the match position).
    effect(() => {
      const matches = this.matches();
      this.matchIdx.set(0);
      if (!matches.length) return;
      const next = new Set(untracked(() => this.expanded()));
      let grew = false;
      for (const m of matches) {
        for (const a of ancestorKeys(m.key)) {
          if (!next.has(a)) {
            next.add(a);
            grew = true;
          }
        }
      }
      if (grew) this.expanded.set(next);
    });
    // Keep the CURRENT match on screen — follows navigation, query edits and
    // tree swaps (the reset effect above feeds this one).
    effect(() => {
      const key = this.currentMatchKey();
      if (!key) return;
      const el = (this.host.nativeElement as HTMLElement).querySelector<HTMLElement>(
        `[data-key="${cssEscape(key)}"]`
      );
      if (el && typeof el.scrollIntoView === 'function') el.scrollIntoView({ block: 'center' });
    });
    // Focus the freshly revealed input — but ONLY on a local toggle-on: the
    // bar also appears when the shared query arrives from ANOTHER window, and
    // stealing focus there would fight the window being typed in.
    effect(() => {
      if (!this.searchOpen() || !this.focusPending) return;
      const el = this.searchInput()?.nativeElement;
      if (!el) return; // not rendered yet — viewChild re-triggers this effect
      this.focusPending = false;
      el.focus();
    });
  }

  readonly rowText = rowText;
  readonly rowTooltip = rowTooltip;

  /** 🔍 in the toolbar — reveal the search bar and focus it. */
  openSearch(): void {
    this.searchOpen.set(true);
    this.focusPending = true;
  }

  /** ✕ / Esc — close the bar and clear the SHARED query everywhere. */
  closeSearch(): void {
    this.searchOpen.set(false);
    this.searchQuery.set('');
  }

  onSearchInput(e: Event): void {
    this.searchQuery.set((e.target as HTMLInputElement).value);
  }

  /** Enter/Shift+Enter navigate; Esc clears + closes. */
  onSearchKey(e: KeyboardEvent): void {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (e.shiftKey) this.prevMatch();
      else this.nextMatch();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      this.closeSearch();
    }
  }

  nextMatch(): void {
    const n = this.matchCount();
    if (!n) return;
    this.matchIdx.set((Math.min(this.matchIdx(), n - 1) + 1) % n);
  }

  prevMatch(): void {
    const n = this.matchCount();
    if (!n) return;
    this.matchIdx.set((Math.min(this.matchIdx(), n - 1) - 1 + n) % n);
  }

  /** Click = select (always) + toggle expansion (when it carries children). */
  toggle(row: FlatRow): void {
    this.selectedKey.set(row.key);
    if (!row.hasChildren) return;
    const next = new Set(this.expanded());
    if (next.has(row.key)) next.delete(row.key);
    else next.add(row.key);
    this.expanded.set(next);
  }

  expandAll(): void {
    this.expanded.set(new Set(collectKeys(this.tree())));
  }

  collapseAll(): void {
    this.expanded.set(new Set());
  }

  /** One empty guide column per ancestor level (`@for` needs an iterable). */
  guides(depth: number): undefined[] {
    return Array.from({ length: depth });
  }
}
