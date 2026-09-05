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
}

/** Per-source stats from the range response (one entry per marker under the tag). */
export interface ReplaySource {
  node_id: string;
  link_id: string;
  marker: string;
  data_link_type?: string;
  count: number;
}

/** One per-second histogram bucket (present only when `truncated` — over 5000 frames). */
export interface ReplayBucket {
  /** Second-boundary ts string ("….000000") — feeds the frames endpoint verbatim. */
  ts: string;
  count: number;
}

/**
 * The `range` response. Check `truncated` FIRST: over the frame cap the
 * `frames` key is ABSENT from the payload and `buckets` is returned instead —
 * never assume `frames` exists. `start`/`end` are null when nothing was
 * captured under the tag (all markers paused, zero matches).
 */
export interface ReplayRangeResponse {
  tag: number;
  start: string | null;
  end: string | null;
  frame_count: number;
  truncated: boolean;
  sources: ReplaySource[];
  frames?: ReplayFrame[];
  buckets?: ReplayBucket[];
}

/** Frames-in-window response. An empty array is a normal, successful answer. */
export interface ReplayFramesResponse {
  frames: ReplayFrame[];
}

/**
 * PDML-isomorphic protocol tree node. `element` distinguishes `<proto>` from
 * `<field>`; every other key mirrors a PDML attribute and EVERY value stays a
 * string — numeric interpretation is client-side business only.
 */
export interface ProtocolTreeNode {
  element: 'proto' | 'field';
  name: string;
  showname: string;
  show?: string;
  value?: string;
  size?: string;
  pos?: string;
  hide?: string;
  mask?: string;
  unmaskedvalue?: string;
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
  tshark_version: string;
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
      /** `unavailable` = 501/502 (tshark), `missing` = 404 (stale ts), `network` = transport. */
      kind: 'unavailable' | 'missing' | 'network';
      message: string;
      frame: ReplayFrame;
    };

/** Which list the timeline tape is currently navigating. */
export type TimelineMode = 'frames' | 'buckets';

/**
 * A frame frozen into its own comparison window (Wireshark's "open packet in
 * a new window"): the entry carries its OWN detail lifecycle so the snapshot
 * survives both cursor moves and detail-cache (LRU) eviction. Pinned per
 * session, capped — the service drops the oldest past the cap.
 */
export interface PinnedDetail {
  id: number;
  frame: ReplayFrame;
  state: DetailState;
}
