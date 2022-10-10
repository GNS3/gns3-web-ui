import { EventEmitter, Injectable } from '@angular/core';
import { DrawingsDataSource } from '../cartography/datasources/drawings-datasource';
import { LinksDataSource } from '../cartography/datasources/links-datasource';
import { NodesDataSource } from '../cartography/datasources/nodes-datasource';
import { Drawing } from '../cartography/models/drawing';
import { Node } from '../cartography/models/node';
import { Link } from '../models/link';

export class WebServiceMessage {
  action: string;
  event: Node | Link | Drawing | any;
}

@Injectable()
export class ProjectWebServiceHandler {
  public nodeNotificationEmitter = new EventEmitter<WebServiceMessage>();
  public linkNotificationEmitter = new EventEmitter<WebServiceMessage>();
  public drawingNotificationEmitter = new EventEmitter<WebServiceMessage>();

  public infoNotificationEmitter = new EventEmitter<any>();
  public warningNotificationEmitter = new EventEmitter<any>();
  public errorNotificationEmitter = new EventEmitter<any>();

  constructor(
    private nodesDataSource: NodesDataSource,
    private linksDataSource: LinksDataSource,
    private drawingsDataSource: DrawingsDataSource
  ) {}

  public handleMessage(message: WebServiceMessage) {
    console.log('----------------------',message.action)
    if (message.action === 'node.updated') {
      this.nodesDataSource.update(message.event as Node);
      this.nodeNotificationEmitter.emit(message);
    }
    if (message.action === 'node.created') {
      this.nodesDataSource.add(message.event as Node);
      this.nodeNotificationEmitter.emit(message);
    }
    if (message.action === 'node.deleted') {
      this.nodesDataSource.remove(message.event as Node);
      this.nodeNotificationEmitter.emit(message);
    }
    if (message.action === 'link.created') {
      this.linksDataSource.add(message.event as Link);
      this.linkNotificationEmitter.emit(message);
    }
    if (message.action === 'link.updated') {
      this.linksDataSource.update(message.event as Link);
      this.linkNotificationEmitter.emit(message);
    }
    if (message.action === 'link.deleted') {
      this.linksDataSource.remove(message.event as Link);
      this.linkNotificationEmitter.emit(message);
    }
    if (message.action === 'drawing.created') {
      this.drawingsDataSource.add(message.event as Drawing);
      this.drawingNotificationEmitter.emit(message);
    }
    if (message.action === 'drawing.updated') {
      this.drawingsDataSource.update(message.event as Drawing);
      this.drawingNotificationEmitter.emit(message);
    }
    if (message.action === 'drawing.deleted') {
      this.drawingsDataSource.remove(message.event as Drawing);
      this.drawingNotificationEmitter.emit(message);
    }
    if (message.action === 'log.error') {
      this.errorNotificationEmitter.emit(message.event.message);
    }
    if (message.action === 'log.warning') {
      this.warningNotificationEmitter.emit(message.event.message);
    }
    if (message.action === 'log.info') {
      this.infoNotificationEmitter.emit(message.event.message);
    }
    // Controller notification
    if (message.action === 'template.deleted') {
      this.infoNotificationEmitter.emit(message.event.message);
    }
    if (message.action === 'template.updated') {
      this.infoNotificationEmitter.emit(message.event.message);
    }
    if (message.action === 'template.added') {
      this.infoNotificationEmitter.emit(message.event.message);
    }
    // if (message.action === 'compute.updated') {
    //   this.infoNotificationEmitter.emit(message.event.message);
    // }
  }
}
