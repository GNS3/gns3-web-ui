import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnDestroy, OnInit, inject, input } from '@angular/core';
import { Subscription } from 'rxjs';
import { MapNodeToNodeConverter } from '../../../cartography/converters/map/map-node-to-node-converter';
import { MapPortToPortConverter } from '../../../cartography/converters/map/map-port-to-port-converter';
import { LinksDataSource } from '../../../cartography/datasources/links-datasource';
import { MapLinkCreated } from '../../../cartography/events/links';
import { LinksEventSource } from '../../../cartography/events/links-event-source';
import { Link } from '@models/link';
import { Project } from '@models/project';
import { Controller } from '@models/controller';
import { LinkService } from '@services/link.service';
import { ProjectService } from '@services/project.service';
import { ToasterService } from '@services/toaster.service';

@Component({
  selector: 'app-link-created',
  templateUrl: './link-created.component.html',
  styleUrl: './link-created.component.scss',
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LinkCreatedComponent implements OnInit, OnDestroy {
  readonly controller = input<Controller>(undefined);
  @Input() project: Project;
  private linkCreated: Subscription;

  private projectService = inject(ProjectService);
  private linkService = inject(LinkService);
  private linksDataSource = inject(LinksDataSource);
  private linksEventSource = inject(LinksEventSource);
  private mapNodeToNode = inject(MapNodeToNodeConverter);
  private mapPortToPort = inject(MapPortToPortConverter);
  private toasterService = inject(ToasterService);
  private cdr = inject(ChangeDetectorRef);

  ngOnInit() {
    this.linkCreated = this.linksEventSource.created.subscribe((evt) => this.onLinkCreated(evt));
  }

  onLinkCreated(linkCreated: MapLinkCreated) {
    const xLength = Math.abs(linkCreated.sourceNode.x - linkCreated.targetNode.x);
    const yLength = Math.abs(linkCreated.sourceNode.y - linkCreated.targetNode.y);
    const zLength = Math.sqrt(Math.pow(xLength, 2) + Math.pow(yLength, 2));
    //from law of sines
    const sinY = yLength / zLength;

    const x = (45 / zLength) * xLength;
    const y = (45 / zLength) * yLength;

    let xLabelSourceNode = 0;
    let yLabelSourceNode = 0;
    let xLabelTargetNode = 0;
    let yLabelTargetNode = 0;

    if (linkCreated.sourceNode.x <= linkCreated.targetNode.x && linkCreated.sourceNode.y <= linkCreated.targetNode.y) {
      xLabelSourceNode = Math.floor(linkCreated.sourceNode.width / 2) + Math.round(x) + 5;
      yLabelSourceNode = Math.floor(linkCreated.sourceNode.height / 2) + Math.round(y) + 5;
      xLabelTargetNode = Math.floor(linkCreated.targetNode.width / 2) - Math.round(x) - 5 - Math.round(20 * sinY);
      yLabelTargetNode = Math.floor(linkCreated.targetNode.height / 2) - Math.round(y) + 5 - Math.round(20 * sinY);
    } else if (
      linkCreated.sourceNode.x > linkCreated.targetNode.x &&
      linkCreated.sourceNode.y < linkCreated.targetNode.y
    ) {
      xLabelSourceNode = Math.floor(linkCreated.sourceNode.width / 2) - Math.round(x) - 5 - Math.round(20 * sinY);
      yLabelSourceNode = Math.floor(linkCreated.sourceNode.height / 2) + Math.round(y) + 5 - Math.round(20 * sinY);
      xLabelTargetNode = Math.floor(linkCreated.targetNode.width / 2) + Math.round(x) + 5;
      yLabelTargetNode = Math.floor(linkCreated.targetNode.height / 2) - Math.round(y) - 5;
    } else if (
      linkCreated.sourceNode.x < linkCreated.targetNode.x &&
      linkCreated.sourceNode.y > linkCreated.targetNode.y
    ) {
      xLabelSourceNode = Math.floor(linkCreated.sourceNode.width / 2) + Math.round(x) + 5 - Math.round(20 * sinY);
      yLabelSourceNode = Math.floor(linkCreated.sourceNode.height / 2) - Math.round(y) - 5 - Math.round(20 * sinY);
      xLabelTargetNode = Math.floor(linkCreated.targetNode.width / 2) - Math.round(x) - 5;
      yLabelTargetNode = Math.floor(linkCreated.targetNode.height / 2) + Math.round(y) + 5;
    } else if (
      linkCreated.sourceNode.x >= linkCreated.targetNode.x &&
      linkCreated.sourceNode.y >= linkCreated.targetNode.y
    ) {
      xLabelSourceNode = Math.floor(linkCreated.sourceNode.width / 2) - Math.round(x) - 5 - Math.round(20 * sinY);
      yLabelSourceNode = Math.floor(linkCreated.sourceNode.height / 2) - Math.round(y) + 5 - Math.round(20 * sinY);
      xLabelTargetNode = Math.floor(linkCreated.targetNode.width / 2) + Math.round(x) + 5;
      yLabelTargetNode = Math.floor(linkCreated.targetNode.height / 2) + Math.round(y) + 5;
    }

    const sourceNode = this.mapNodeToNode.convert(linkCreated.sourceNode);
    const sourcePort = this.mapPortToPort.convert(linkCreated.sourcePort);
    const targetNode = this.mapNodeToNode.convert(linkCreated.targetNode);
    const targetPort = this.mapPortToPort.convert(linkCreated.targetPort);

    this.linkService
      .createLink(
        this.controller(),
        sourceNode,
        sourcePort,
        targetNode,
        targetPort,
        xLabelSourceNode,
        yLabelSourceNode,
        xLabelTargetNode,
        yLabelTargetNode
      )
      .subscribe({
        next: () => {
          this.projectService.links(this.controller(), this.project.project_id).subscribe((links: Link[]) => {
            this.linksDataSource.set(links);
          });
        },
        error: (err) => {
          const message = err.error?.message || err.message || 'Failed to create link';
          this.toasterService.error(message);
          this.cdr.markForCheck();
        },
      });
  }

  ngOnDestroy() {
    this.linkCreated.unsubscribe();
  }
}
