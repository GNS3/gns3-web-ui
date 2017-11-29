import {NodeContextMenuAction} from "../node-context-menu-action";
import {Node} from "../../../cartography/shared/models/node.model";
import {Server} from "../../models/server";
import {NodeService} from "../../services/node.service";


export class StartNodeAction implements NodeContextMenuAction {
  constructor(private server: Server, private nodeService: NodeService) {}

  icon(node: Node) {
    return "play_arrow";
  }

  label(node: Node) {
    return "Start";
  }

  isVisible(node: Node) {
    return node.status === 'stopped';
  }

  onClick(node: Node) {
    this.nodeService.start()
  }
}
