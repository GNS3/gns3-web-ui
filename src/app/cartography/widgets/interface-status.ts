import { Injectable } from "@angular/core";

import { select } from "d3-selection";

import { Widget } from "./widget";
import { SVGSelection } from "../models/types";
import { LinkStatus } from "../models/link-status";
import { MapLink } from "../models/map/map-link";


@Injectable()
export class InterfaceStatusWidget implements Widget {
  constructor() {}

  public draw(view: SVGSelection) {
    view.each(function (this: SVGGElement, l: MapLink) {
      const link_group = select<SVGGElement, MapLink>(this);
      const link_path = link_group.select<SVGPathElement>('path');

      const start_point: SVGPoint = link_path.node().getPointAtLength(45);
      const end_point: SVGPoint = link_path.node().getPointAtLength(link_path.node().getTotalLength() - 45);
  
      let statuses = [];
  
      if (link_path.node().getTotalLength() > 2 * 45 + 10) {
        statuses = [
          new LinkStatus(start_point.x, start_point.y, l.source.status),
          new LinkStatus(end_point.x, end_point.y, l.target.status)
        ];
      }
  
      const status_started = link_group
        .selectAll<SVGCircleElement, LinkStatus>('circle.status_started')
          .data(statuses.filter((link_status: LinkStatus) => link_status.status === 'started'));
  
      const status_started_enter = status_started
        .enter()
          .append<SVGCircleElement>('circle');
  
      status_started
        .merge(status_started_enter)
          .attr('class', 'status_started')
          .attr('cx', (ls: LinkStatus) => ls.x)
          .attr('cy', (ls: LinkStatus) => ls.y)
          .attr('r', 6)
          .attr('fill', '#2ecc71');
  
      status_started
        .exit()
          .remove();
  
      const status_stopped = link_group
        .selectAll<SVGRectElement, LinkStatus>('rect.status_stopped')
          .data(statuses.filter((link_status: LinkStatus) => link_status.status === 'stopped'));
  
      const status_stopped_enter = status_stopped
        .enter()
          .append<SVGRectElement>('rect');
  
      const STOPPED_STATUS_RECT_WIDTH = 10;
  
      status_stopped
        .merge(status_stopped_enter)
          .attr('class', 'status_stopped')
          .attr('x', (ls: LinkStatus) => ls.x - STOPPED_STATUS_RECT_WIDTH / 2.)
          .attr('y', (ls: LinkStatus) => ls.y - STOPPED_STATUS_RECT_WIDTH / 2.)
          .attr('width', STOPPED_STATUS_RECT_WIDTH)
          .attr('height', STOPPED_STATUS_RECT_WIDTH)
          .attr('fill', 'red');
  
      status_stopped
        .exit()
          .remove();
    });
  }
}
