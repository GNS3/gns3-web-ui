import { Injectable } from "@angular/core";
import { Subject } from "rxjs/Subject";

import { NodesDataSource } from "../../cartography/shared/datasources/nodes-datasource";
import { LinksDataSource } from "../../cartography/shared/datasources/links-datasource";
import { DrawingsDataSource } from "../../cartography/shared/datasources/drawings-datasource";
import { Link } from "../../cartography/shared/models/link";
import { Node } from "../../cartography/shared/models/node";
import { Drawing } from "../../cartography/shared/models/drawing";


export class WebServiceMessage {
  action: string;
  event: Node | Link | Drawing;
}

@Injectable()
export class ProjectWebServiceHandler {
  constructor(private nodesDataSource: NodesDataSource,
              private linksDataSource: LinksDataSource,
              private drawingsDataSource: DrawingsDataSource) {}

  public connect(ws: Subject<WebServiceMessage>) {
    const subscription = ws.subscribe((message: WebServiceMessage) => {
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
      if (message.action === 'drawing.created') {
        this.drawingsDataSource.add(message.event as Drawing);
      }
      if (message.action === 'drawing.updated') {
       this.drawingsDataSource.update(message.event as Drawing);
      }
      if (message.action === 'drawing.deleted') {
        this.drawingsDataSource.remove(message.event as Drawing);
      }
    });
    return subscription;
  }
}
