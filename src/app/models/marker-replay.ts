/**
 * Wire models for marker tag aggregated replay
 * (`/projects/{pid}/markers/tags/{tag}/replay/*` — server feature "marker-tag-replay").
 *
 * RED LINE — `ts` is an epoch-seconds STRING with µs precision
 * ("1788196663.226372"). It must round-trip VERBATIM to the frames/detail
 * endpoints: re-serializing through a number drops the fractional part
 * ("…663.000000" becomes "…663") and the server 404s on the mismatch. Parsing
 * for display/geometry is confined to the pure helpers in
 * `replay-timeline-math.ts`. `ts` is also NOT unique — two links can hit the
 * same microsecond — so never key a Map/Set by ts alone; identity is the full
 * `(ts, node_id, link_id, marker, frame_number)` tuple.
 */

/** One captured frame on the merged timeline. */
export interface ReplayFrame {
  /** Epoch-seconds string with µs precision — round-trips verbatim, never a number. */
  ts: string;
  /** Captured frame length in bytes. */
  len: number;
  node_id: string;
  link_id: string;
  /** Source marker name. */
  marker: string;
  /** 1-based record number inside the source pcap. */
  frame_number: number;
  /**
   * Wireshark list-column summaries (sharkd engine). `src`/`dst` fall back to
   * the layer-2 address for non-IP traffic, same as Wireshark's columns.
   */
  src?: string | null;
  dst?: string | null;
  proto?: string | null;
  info?: string | null;
  /**
   * Wireshark coloring-rule row colors, hex WITHOUT the '#' prefix
   * ("fff3d6"). Runtime DATA colors — applied via inline `[style]` bindings
   * (`'#' + bg`), not SCSS, so the hardcoded-color rule never applies.
   */
  bg?: string | null;
  fg?: string | null;
}

/** Per-source stats from the range response (one entry per marker under the tag). */
export interface ReplaySource {
  node_id: string;
  link_id: string;
  marker: string;
  data_link_type?: string;
  count: number;
}

/**
 * The `range` response: list metadata + the FULL merged frame list — no cap,
 * no truncation (`frame_count` == `frames.length`, always). `start`/`end` are
 * null when nothing was captured under the tag.
 */
export interface ReplayRangeResponse {
  tag: number;
  start: string | null;
  end: string | null;
  /** == frames.length — the full merged total under the current filter/link. */
  frame_count: number;
  sources: ReplaySource[];
  frames?: ReplayFrame[];
}

/**
 * Protocol tree node decoded by the server's sharkd engine. `element`
 * distinguishes protocol rows from field rows; `label` is the single display
 * text (Wireshark-style) and `filter_expr` a ready-made display filter for the
 * field ("ip.ttl == 64" — click-to-filter). Every attribute except `generated`
 * stays a string — numeric interpretation is client-side business only.
 */
export interface ProtocolTreeNode {
  element: 'proto' | 'field';
  name: string;
  label: string;
  /** Ready display-filter expression addressing this field with its value. */
  filter_expr?: string;
  size?: string;
  pos?: string;
  /** Expert-info severity name ("Chat"/"Warn"/"Error") when present. */
  expert?: string;
  /** Protocol-added (computed) field — Wireshark shows these italic. */
  generated?: boolean;
  children?: ProtocolTreeNode[];
}

/** Single-frame lazy decode (invoked only when the user opens a frame). */
export interface ReplayFrameDetail {
  ts: string;
  source: {
    node_id: string;
    link_id: string;
    marker: string;
    frame_number: number;
  };
  /** Mapped node count — client-side sanity check against `tree`. */
  field_count: number;
  /** Raw frame bytes (hex). Not rendered in v1; kept for the future hex view. */
  hex: string;
  tree: ProtocolTreeNode[];
}

/** Detail pane state machine. `frame` on error enables Retry without a parent lookup. */
export type DetailState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ok'; detail: ReplayFrameDetail }
  | {
      status: 'error';
      /** `unavailable` = 501/502 (sharkd missing/failed), `missing` = 404 (stale ts), `network` = transport. */
      kind: 'unavailable' | 'missing' | 'network';
      message: string;
      frame: ReplayFrame;
    };

/**
 * A frame frozen into its own comparison window (Wireshark's "open packet in
 * a new window"): the entry carries its OWN detail lifecycle so the snapshot
 * survives both cursor moves and detail-cache (LRU) eviction. Pinned per
 * session, capped — the service drops the oldest past the cap.
 */
export interface PinnedDetail {
  id: number;
  frame: ReplayFrame;
  /**
   * ts of the FIRST row of the list this frame was pinned from — the frozen
   * delta-chip baseline. The live list keeps moving (filters, window exit);
   * a snapshot's "+Xs" must not be retroactively rewritten by it.
   */
  listStartTs: string;
  state: DetailState;
}

/**
 * A transient double-click detail window ("peek"): pinned-window LOOK, but
 * positioned at the mouse and owned by no comparison set — nothing docks,
 * joins the cross-window diff, or counts against the pin cap. One at a
 * time; double-clicking another row retargets it.
 */
export interface ReplayPeek {
  /** Bumped per openPeek call — a BIRTH (open/retarget), not a state update. */
  seq: number;
  frame: ReplayFrame;
  detail: DetailState;
  /** Viewport point of the opening double-click — the window's birth spot. */
  at: { x: number; y: number };
}
