import { Injectable } from '@angular/core';

import { select } from 'd3-selection';

import { Widget } from './widget';
import { SVGSelection } from '../models/types';
import { LinkStatus } from '../models/link-status';
import { MapLink } from '../models/map/map-link';
import { MapSettingsService } from '../../services/mapsettings.service';

@Injectable()
export class InterfaceStatusWidget implements Widget {
  private mapSettingsService: MapSettingsService

  constructor(
    private _mapSettingsService: MapSettingsService
  ) {
    this.mapSettingsService = _mapSettingsService;
  }

  public draw(view: SVGSelection) {
    const self = this;

    view.each(function(this: SVGGElement, l: MapLink) {
      const link_group = select<SVGGElement, MapLink>(this);
      const link_path = link_group.select<SVGPathElement>('path');

      let statuses = [];
      if (link_path.node()) {
        const start_point: SVGPoint = link_path.node().getPointAtLength(100);
        const end_point: SVGPoint = link_path.node().getPointAtLength(link_path.node().getTotalLength() - 100);

        if (link_path.node().getTotalLength() > 2 * 45 + 10) {
          if (l.source && l.target) {
            let sourcePort = l.nodes.find(node => node.nodeId === l.source.id).label.text;
            let destinationPort = l.nodes.find(node => node.nodeId === l.target.id).label.text;
            statuses = [
              new LinkStatus(start_point.x, start_point.y, (l.capturing && l.suspend) ? 'suspended' : l.source.status, sourcePort),
              new LinkStatus(end_point.x, end_point.y, (l.capturing && l.suspend) ? 'suspended' : l.target.status, destinationPort)
            ];
          }
        }
      }

      link_group
        .selectAll<SVGCircleElement, LinkStatus>('circle.status_started').remove();
      link_group
        .selectAll<SVGCircleElement, LinkStatus>('circle.status_stopped').remove();
      link_group
        .selectAll<SVGCircleElement, LinkStatus>('circle.status_suspended').remove();

      link_group
        .selectAll<SVGRectElement, LinkStatus>('rect.status_started').remove();
      link_group
        .selectAll<SVGTextElement, LinkStatus>('text.status_started_label').remove();
      link_group
        .selectAll<SVGRectElement, LinkStatus>('rect.status_stopped').remove();
      link_group
        .selectAll<SVGTextElement, LinkStatus>('text.status_stopped_label').remove();
      link_group
        .selectAll<SVGRectElement, LinkStatus>('rect.status_suspended').remove();
      link_group
        .selectAll<SVGTextElement, LinkStatus>('text.status_suspended_label').remove();

      if (self.mapSettingsService.integrateLinkLabelsToLinks) {
        const status_started = link_group
          .selectAll<SVGRectElement, LinkStatus>('rect.status_started')
          .data(statuses.filter((link_status: LinkStatus) => link_status.status === 'started'));
        const status_started_enter = status_started.enter().append<SVGRectElement>('rect');
        status_started
          .merge(status_started_enter)
          .attr('class', 'status_started')
          .attr('width', 40)
          .attr('height', 20)
          .attr('x', (ls: LinkStatus) => ls.x - 10)
          .attr('y', (ls: LinkStatus) => ls.y - 10)
          .attr('rx', 8)
          .attr('ry', 8)
          .style('fill', 'white')
          .attr('stroke', '#2ecc71')
          .attr('stroke-width', 3);
        status_started.exit().remove();
        const status_started_label = link_group
          .selectAll<SVGTextElement, LinkStatus>('text.status_started_label')
          .data(statuses.filter((link_status: LinkStatus) => link_status.status === 'started'));
        const status_started_label_enter = status_started_label.enter().append<SVGTextElement>('text');
        status_started_label
          .merge(status_started_label_enter)
          .attr('class', 'status_started_label')
          .text((ls: LinkStatus) => ls.port)
          .attr('x', (ls: LinkStatus) => ls.x - 5)
          .attr('y', (ls: LinkStatus) => ls.y + 5)
          .attr('fill', `black`);
        status_started_label.exit().remove();
        
        const status_stopped = link_group
          .selectAll<SVGRectElement, LinkStatus>('rect.status_stopped')
          .data(statuses.filter((link_status: LinkStatus) => link_status.status === 'stopped'));
        const status_stopped_enter = status_stopped.enter().append<SVGRectElement>('rect');
        status_stopped
          .merge(status_stopped_enter)
          .attr('class', 'status_stopped')
          .attr('width', 40)
          .attr('height', 20)
          .attr('x', (ls: LinkStatus) => ls.x - 10)
          .attr('y', (ls: LinkStatus) => ls.y - 10)
          .attr('rx', 8)
          .attr('ry', 8)
          .style('fill', 'white')
          .attr('stroke', 'red')
          .attr('stroke-width', 3);
        status_stopped.exit().remove();
        const status_stopped_label = link_group
          .selectAll<SVGTextElement, LinkStatus>('text.status_stopped_label')
          .data(statuses.filter((link_status: LinkStatus) => link_status.status === 'stopped'));
        const status_stopped_label_enter = status_stopped_label.enter().append<SVGTextElement>('text');
        status_stopped_label
          .merge(status_stopped_label_enter)
          .attr('class', 'status_stopped_label')
          .text((ls: LinkStatus) => ls.port)
          .attr('x', (ls: LinkStatus) => ls.x - 5)
          .attr('y', (ls: LinkStatus) => ls.y + 5)
          .attr('fill', `black`);
        status_stopped_label.exit().remove();

        const status_suspended = link_group
          .selectAll<SVGRectElement, LinkStatus>('rect.status_suspended')
          .data(statuses.filter((link_status: LinkStatus) => link_status.status === 'suspended'));
        const status_suspended_enter = status_suspended.enter().append<SVGRectElement>('rect');
        status_suspended
          .merge(status_suspended_enter)
          .attr('class', 'status_suspended')
          .attr('width', 40)
          .attr('height', 20)
          .attr('x', (ls: LinkStatus) => ls.x - 10)
          .attr('y', (ls: LinkStatus) => ls.y - 10)
          .attr('rx', 8)
          .attr('ry', 8)
          .style('fill', 'white')
          .attr('stroke', '#FFFF00')
          .attr('stroke-width', 3);
        status_suspended.exit().remove();
        const status_suspended_label = link_group
          .selectAll<SVGTextElement, LinkStatus>('text.status_suspended_label')
          .data(statuses.filter((link_status: LinkStatus) => link_status.status === 'suspended'));
        const status_suspended_label_enter = status_suspended_label.enter().append<SVGTextElement>('text');
        status_suspended_label
          .merge(status_suspended_label_enter)
          .attr('class', 'status_suspended_label')
          .text((ls: LinkStatus) => ls.port)
          .attr('x', (ls: LinkStatus) => ls.x - 5)
          .attr('y', (ls: LinkStatus) => ls.y + 5)
          .attr('fill', `black`);
        status_suspended_label.exit().remove();
      } else {
        const status_started = link_group
          .selectAll<SVGCircleElement, LinkStatus>('circle.status_started')
          .data(statuses.filter((link_status: LinkStatus) => link_status.status === 'started'));

        const status_started_enter = status_started.enter().append<SVGCircleElement>('circle');

        status_started
          .merge(status_started_enter)
          .attr('class', 'status_started')
          .attr('cx', (ls: LinkStatus) => ls.x)
          .attr('cy', (ls: LinkStatus) => ls.y)
          .attr('r', 6)
          .attr('text', (ls: LinkStatus) => ls.port)
          .attr('fill', '#2ecc71');

        status_started.exit().remove();

        const status_stopped = link_group
          .selectAll<SVGRectElement, LinkStatus>('rect.status_stopped')
          .data(statuses.filter((link_status: LinkStatus) => link_status.status === 'stopped'));

        const status_stopped_enter = status_stopped.enter().append<SVGRectElement>('rect');

        const STOPPED_STATUS_RECT_WIDTH = 10;

        status_stopped
          .merge(status_stopped_enter)
          .attr('class', 'status_stopped')
          .attr('x', (ls: LinkStatus) => ls.x - STOPPED_STATUS_RECT_WIDTH / 2)
          .attr('y', (ls: LinkStatus) => ls.y - STOPPED_STATUS_RECT_WIDTH / 2)
          .attr('width', STOPPED_STATUS_RECT_WIDTH)
          .attr('height', STOPPED_STATUS_RECT_WIDTH)
          .attr('fill', 'red');

        status_stopped.exit().remove();

        const status_suspended = link_group
          .selectAll<SVGCircleElement, LinkStatus>('circle.status_suspended')
          .data(statuses.filter((link_status: LinkStatus) => link_status.status === 'suspended'));

        const status_suspended_enter = status_suspended.enter().append<SVGCircleElement>('circle');

        status_suspended
          .merge(status_suspended_enter)
          .attr('class', 'status_suspended')
          .attr('cx', (ls: LinkStatus) => ls.x)
          .attr('cy', (ls: LinkStatus) => ls.y)
          .attr('r', 6)
          .attr('fill', '#FFFF00');

        status_suspended.exit().remove();
      }
    });
  }
}
