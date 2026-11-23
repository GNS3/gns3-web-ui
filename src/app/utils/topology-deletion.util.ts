/**
 * One deletion plan for every topology "delete selection" entry point — the
 * context menu's Delete action and the Del keyboard shortcut. Both MUST apply
 * the same rules: locked items are never sent to the server, links are left
 * to the server when nodes or drawings are deleted with them (nodes cascade
 * their links), and the privilege set is derived from what will actually be
 * deleted — notably Node.Allocate only when at least one UNLOCKED node is in
 * the selection.
 */

/** A topology item the lock flag can protect from deletion (nodes, drawings). */
export interface LockableTopologyItem {
  locked: boolean;
}

export interface TopologyDeletionPlan<TNode, TDrawing, TLink> {
  /** Items that will be deleted. */
  deletableNodes: TNode[];
  deletableDrawings: TDrawing[];
  deletableLinks: TLink[];
  /** Selected items kept back because they are locked. */
  lockedNodes: TNode[];
  lockedDrawings: TDrawing[];
  /** Privileges the selection requires, combined with `every`. */
  requiredPrivileges: string[];
}

/**
 * Partition a selected topology set into what may be deleted and the
 * privileges the operation needs. `links` are only deletable while no node or
 * drawing is part of the selection — mirroring the context menu's action
 * table, where deleting a node implies deleting its links server-side.
 */
export function planTopologyDeletion<
  TNode extends LockableTopologyItem,
  TDrawing extends LockableTopologyItem,
  TLink,
>(nodes: readonly TNode[], drawings: readonly TDrawing[], links: readonly TLink[]): TopologyDeletionPlan<TNode, TDrawing, TLink> {
  const deletableNodes = nodes.filter((node) => !node.locked);
  const deletableDrawings = drawings.filter((drawing) => !drawing.locked);

  const requiredPrivileges: string[] = [];
  if (deletableNodes.length > 0) {
    requiredPrivileges.push('Node.Allocate');
  }
  if (drawings.length > 0) {
    requiredPrivileges.push('Drawing.Allocate');
  }
  if (links.length > 0) {
    requiredPrivileges.push('Link.Allocate');
  }

  return {
    deletableNodes,
    deletableDrawings,
    deletableLinks: nodes.length === 0 && drawings.length === 0 ? [...links] : [],
    lockedNodes: nodes.filter((node) => node.locked),
    lockedDrawings: drawings.filter((drawing) => drawing.locked),
    requiredPrivileges,
  };
}
