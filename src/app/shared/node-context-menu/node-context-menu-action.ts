import {Node} from "../../cartography/shared/models/node.model";

export interface NodeContextMenuAction {
  icon(node: Node): string;
  label(node: Node): string;
  isVisible(node: Node): boolean;
  onClick(node: Node);
}
