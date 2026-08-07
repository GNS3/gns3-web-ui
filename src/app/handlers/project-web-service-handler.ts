import { EventEmitter, Injectable } from '@angular/core';
import { DrawingsDataSource } from '../cartography/datasources/drawings-datasource';
import { LinksDataSource } from '../cartography/datasources/links-datasource';
import { NodesDataSource } from '../cartography/datasources/nodes-datasource';
import { Drawing } from '../cartography/models/drawing';
import { Node } from '../cartography/models/node';
import { Link } from '@models/link';
import { MarkerMatchEvent } from '@models/marker';
import { MarkerFlashService } from '@services/marker-flash.service';
import { MarkerRegistryService } from '@services/marker-registry.service';

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
    private drawingsDataSource: DrawingsDataSource,
    private markerRegistryService: MarkerRegistryService,
    private markerFlashService: MarkerFlashService
  ) {}

  public handleMessage(message: WebServiceMessage) {
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
      const link = message.event as Link;
      this.linksDataSource.add(link);
      this.markerRegistryService.reconcileLink(link);
      this.linkNotificationEmitter.emit(message);
    }
    if (message.action === 'link.updated') {
      const link = message.event as Link;
      this.linksDataSource.update(link);
      this.markerRegistryService.reconcileLink(link);
      this.linkNotificationEmitter.emit(message);
    }
    if (message.action === 'link.deleted') {
      const link = message.event as Link;
      this.linksDataSource.remove(link);
      this.markerRegistryService.removeLink(link.link_id);
      this.linkNotificationEmitter.emit(message);
    }
    if (message.action === 'marker.match') {
      const event = message.event as MarkerMatchEvent;
      // Resolve the marker's color + highlight_duration from link state (event carries
      // neither). `filter` is the marker name; null color ⇒ default theme color;
      // null duration ⇒ UI default (see MarkerFlashService). `dir` + `node_id` orient
      // the direction arrow; null/absent `dir` (old uBridge) ⇒ flash without arrow.
      const link = this.linksDataSource.get(event.link_id);
      const marker = link?.markers?.[event.filter];
      this.markerFlashService.flash(
        event.link_id,
        marker?.color ?? null,
        marker?.highlight_duration ?? null,
        event.dir ?? null,
        event.node_id
      );
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
  }
}
