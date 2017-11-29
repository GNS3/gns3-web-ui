import {NodeContextMenuAction} from "../node-context-menu-action";
import {Node} from "../../../cartography/shared/models/node.model";
import {Server} from "../../models/server";
import {Project} from "../../models/project";
import {NodeService} from "../../services/node.service";


export class StopNodeAction implements NodeContextMenuAction {
  constructor(server: Server, nodeService: NodeService) {}

  icon(node: Node) {
    return "stop";
  }

  label(node: Node) {
    return "Stop";
  }

  isVisible(node: Node) {
    return node.status === 'started';
  }

  onClick(node: Node) {

  }
}
