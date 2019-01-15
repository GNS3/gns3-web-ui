import { Component, OnDestroy, Input, OnInit } from '@angular/core';
import { Server } from '../../../models/server';
import { LinkService } from '../../../services/link.service';
import { ProjectService } from '../../../services/project.service';
import { MapNodeToNodeConverter } from '../../../cartography/converters/map/map-node-to-node-converter';
import { MapPortToPortConverter } from '../../../cartography/converters/map/map-port-to-port-converter';
import { LinksDataSource } from '../../../cartography/datasources/links-datasource';
import { Subscription } from 'rxjs';
import { Project } from '../../../models/project';
import { MapLinkCreated } from '../../../cartography/events/links';
import { Link } from '../../../models/link';
import { LinksEventSource } from '../../../cartography/events/links-event-source';

@Component({
  selector: 'app-link-created',
  templateUrl: './link-created.component.html',
  styleUrls: ['./link-created.component.css']
})
export class LinkCreatedComponent implements OnInit, OnDestroy {
  @Input() server: Server;
  @Input() project: Project;
  private linkCreated: Subscription;

  constructor(
    private projectService: ProjectService,
    private linkService: LinkService,
    private linksDataSource: LinksDataSource,
    private linksEventSource: LinksEventSource,
    private mapNodeToNode: MapNodeToNodeConverter,
    private mapPortToPort: MapPortToPortConverter
  ) {}

  ngOnInit() {
    this.linkCreated = this.linksEventSource.created.subscribe(evt => this.onLinkCreated(evt));
  }

  onLinkCreated(linkCreated: MapLinkCreated) {
    const sourceNode = this.mapNodeToNode.convert(linkCreated.sourceNode);
    const sourcePort = this.mapPortToPort.convert(linkCreated.sourcePort);
    const targetNode = this.mapNodeToNode.convert(linkCreated.targetNode);
    const targetPort = this.mapPortToPort.convert(linkCreated.targetPort);

    this.linkService.createLink(this.server, sourceNode, sourcePort, targetNode, targetPort).subscribe(() => {
      this.projectService.links(this.server, this.project.project_id).subscribe((links: Link[]) => {
        this.linksDataSource.set(links);
      });
    });
  }

  ngOnDestroy() {
    this.linkCreated.unsubscribe();
  }
}
