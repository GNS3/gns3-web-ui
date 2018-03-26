import {Injectable} from "@angular/core";
import {NodesDataSource} from "../../cartography/shared/datasources/nodes-datasource";
import {LinksDataSource} from "../../cartography/shared/datasources/links-datasource";
import {Subject} from "rxjs/Subject";
import {Link} from "../../cartography/shared/models/link";
import {Node} from "../../cartography/shared/models/node";


export class WebServiceMessage {
  action: string;
  event: Node | Link;
}

@Injectable()
export class ProjectWebServiceHandler {
  constructor(private nodesDataSource: NodesDataSource,
              private linksDataSource: LinksDataSource) {}

  public connect(ws: Subject<WebServiceMessage>) {
    ws.subscribe((message: WebServiceMessage) => {
      if (message.action === 'node.updated') {
        this.nodesDataSource.update(message.event as Node);
      }
      if (message.action === 'node.created') {
        this.nodesDataSource.add(message.event as Node);
      }
      if (message.action === 'node.deleted') {
        this.nodesDataSource.remove(message.event as Node);
      }
      if (message.action === 'link.created') {
        this.linksDataSource.add(message.event as Link);
      }
      if (message.action === 'link.updated') {
       this.linksDataSource.update(message.event as Link);
      }
      if (message.action === 'link.deleted') {
        this.linksDataSource.remove(message.event as Link);
      }
    });
  }
}
