import { Injectable } from '@angular/core';
import { select, Selection } from 'd3-selection';
import { MapSettingsService } from '@services/mapsettings.service';
import { LinkStatus } from '../models/link-status';
import { MapLink } from '../models/map/map-link';
import { SVGSelection } from '../models/types';
import { Widget } from './widget';

@Injectable()
export class InterfaceStatusWidget implements Widget {
  private static readonly MAX_INLINE_LABELS_PARALLEL_LINKS = 4;
  private static readonly LABEL_DISTANCE = 60;
  private static readonly MIN_LINK_LENGTH_FOR_LABELS = 180;
  private static readonly LABEL_HEIGHT = 18;
  private static readonly LABEL_MIN_WIDTH = 34;
  private static readonly LABEL_HORIZONTAL_PADDING = 2;
  private static readonly LABEL_RADIUS = 8;
  private static readonly LABEL_STROKE_WIDTH = 3;
  private static readonly LABEL_FONT_SIZE = 10;
  private static readonly LABEL_FONT_FAMILY = '"Noto Sans", "DejaVu Sans", "Segoe UI", sans-serif';
  private static readonly LABEL_BACKGROUND_COLOR = '#E2E8FF';

  constructor(private mapSettingsService: MapSettingsService) {}

  public draw(view: SVGSelection) {
    const self = this;

    view.each(function (this: SVGGElement, l: MapLink) {
      l.isMultiplied = (l.parallelLinksCount || 1) > 1;

      const link_group = select<SVGGElement, MapLink>(this);
      const link_path = link_group.select<SVGPathElement>('path');
      const showInterfaceLabels = self.mapSettingsService.showInterfaceLabels;
      const useIntegratedLabels = showInterfaceLabels && self.mapSettingsService.integrateLinkLabelsToLinks;
      const useTooltipOnlyLabels = showInterfaceLabels && self.shouldRenderTooltipOnly(l);

      let statuses: LinkStatus[] = [];
      const pathNode = link_path.node();
      if (pathNode) {
        const totalLength = pathNode.getTotalLength();

        if (
          l.source &&
          l.target &&
          (useTooltipOnlyLabels || totalLength > InterfaceStatusWidget.MIN_LINK_LENGTH_FOR_LABELS)
        ) {
          const labelDistance = useTooltipOnlyLabels
            ? Math.min(InterfaceStatusWidget.LABEL_DISTANCE, totalLength / 4)
            : InterfaceStatusWidget.LABEL_DISTANCE;
          const start_point: SVGPoint = pathNode.getPointAtLength(labelDistance);
          const end_point: SVGPoint = pathNode.getPointAtLength(totalLength - labelDistance);
          const sourcePort = l.nodes?.find((node) => node.nodeId === l.source.id)?.label?.text || '';
          const destinationPort = l.nodes?.find((node) => node.nodeId === l.target.id)?.label?.text || '';

          statuses = [
            new LinkStatus(
              start_point.x,
              start_point.y,
              l.suspend ? 'suspended' : l.source.status,
              sourcePort
            ),
            new LinkStatus(
              end_point.x,
              end_point.y,
              l.suspend ? 'suspended' : l.target.status,
              destinationPort
            ),
          ];
        }
      }

      self.renderEndpointHoverTooltips(link_group, statuses, useTooltipOnlyLabels);
      self.bindEndpointTooltipHover(link_path, link_group, useTooltipOnlyLabels);

      link_group.selectAll<SVGCircleElement, LinkStatus>('circle.status_started').remove();
      link_group.selectAll<SVGCircleElement, LinkStatus>('circle.status_stopped').remove();
      link_group.selectAll<SVGCircleElement, LinkStatus>('circle.status_suspended').remove();

      link_group.selectAll<SVGRectElement, LinkStatus>('rect.status_started').remove();
      link_group.selectAll<SVGTextElement, LinkStatus>('text.status_started_label').remove();
      link_group.selectAll<SVGRectElement, LinkStatus>('rect.status_stopped').remove();
      link_group.selectAll<SVGTextElement, LinkStatus>('text.status_stopped_label').remove();
      link_group.selectAll<SVGRectElement, LinkStatus>('rect.status_suspended').remove();
      link_group.selectAll<SVGTextElement, LinkStatus>('text.status_suspended_label').remove();

      if (useIntegratedLabels && !useTooltipOnlyLabels) {
        const status_labels = link_group.selectAll('g.status_label').data(statuses);
        const status_labels_enter = status_labels.enter().append('g').attr('class', 'status_label');

        const status_labels_merge = status_labels
          .merge(status_labels_enter)
          .attr('transform', (ls: LinkStatus) => `translate(${ls.x}, ${ls.y})`);

        const status_rects = status_labels_merge.selectAll('rect').data((ls: LinkStatus) => [ls]);
        status_rects
          .enter()
          .append('rect')
          .merge(status_rects)
          .attr('class', (ls: LinkStatus) => `status_${ls.status}`)
          .attr('width', (ls: LinkStatus) => self.getLabelWidth(ls.port))
          .attr('height', InterfaceStatusWidget.LABEL_HEIGHT)
          .attr('x', (ls: LinkStatus) => -(self.getLabelWidth(ls.port) / 2))
          .attr('y', -InterfaceStatusWidget.LABEL_HEIGHT / 2)
          .attr('rx', InterfaceStatusWidget.LABEL_RADIUS)
          .attr('ry', InterfaceStatusWidget.LABEL_RADIUS)
          .style('fill', InterfaceStatusWidget.LABEL_BACKGROUND_COLOR)
          .style('fill-opacity', 1)
          .attr('stroke', (ls: LinkStatus) => self.getStatusStrokeColor(ls.status))
          .attr('stroke-width', InterfaceStatusWidget.LABEL_STROKE_WIDTH);
        status_rects.exit().remove();

        const status_texts = status_labels_merge.selectAll('text').data((ls: LinkStatus) => [ls]);
        status_texts
          .enter()
          .append('text')
          .merge(status_texts)
          .attr('class', (ls: LinkStatus) => `status_${ls.status}_label`)
          .text((ls: LinkStatus) => ls.port || '')
          .attr('x', 0)
          .attr('y', 0)
          .attr('dy', '0em')
          .attr('text-anchor', 'middle')
          .attr('dominant-baseline', 'central')
          .attr('alignment-baseline', 'central')
          .attr('fill', '#111111')
          .style('font-family', InterfaceStatusWidget.LABEL_FONT_FAMILY)
          .style('font-size', `${InterfaceStatusWidget.LABEL_FONT_SIZE}px`)
          .style('font-weight', '500');
        status_texts.exit().remove();

        status_labels.exit().remove();
      } else {
        link_group.selectAll<SVGGElement, LinkStatus>('g.status_label').remove();

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
          .attr('text', (ls: LinkStatus) => ls.port || '')
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

  private getLabelWidth(port?: string): number {
    const text = port || '';
    const averageCharacterWidth = InterfaceStatusWidget.LABEL_FONT_SIZE * 0.62;
    const estimatedWidth = text.length * averageCharacterWidth + InterfaceStatusWidget.LABEL_HORIZONTAL_PADDING * 2;

    return Math.max(InterfaceStatusWidget.LABEL_MIN_WIDTH, Math.ceil(estimatedWidth));
  }

  private getStatusStrokeColor(status: string): string {
    if (status === 'started') {
      return '#2ecc71';
    }
    if (status === 'stopped') {
      return 'red';
    }
    return '#FFFF00';
  }

  private shouldRenderTooltipOnly(link: MapLink): boolean {
    return (link.parallelLinksCount || 1) > InterfaceStatusWidget.MAX_INLINE_LABELS_PARALLEL_LINKS;
  }

  private renderEndpointHoverTooltips(
    linkGroup: Selection<SVGGElement, MapLink, SVGElement, any>,
    statuses: LinkStatus[],
    enabled: boolean
  ) {
    const tooltips = linkGroup
      .selectAll<SVGGElement, LinkStatus>('g.status_hover_tooltip')
      .data(enabled ? statuses : []);

    const tooltipsEnter = tooltips
      .enter()
      .append<SVGGElement>('g')
      .attr('class', 'status_hover_tooltip')
      .attr('visibility', 'hidden');

    const tooltipsMerge = tooltips
      .merge(tooltipsEnter)
      .style('pointer-events', 'none')
      .attr('transform', (ls: LinkStatus) => `translate(${ls.x}, ${ls.y})`);

    tooltipsMerge.raise();

    const tooltipRects = tooltipsMerge.selectAll<SVGRectElement, LinkStatus>('rect').data((ls) => [ls]);
    tooltipRects
      .enter()
      .append<SVGRectElement>('rect')
      .merge(tooltipRects)
      .attr('class', 'status_hover_tooltip_rect')
      .attr('width', (ls: LinkStatus) => this.getLabelWidth(ls.port))
      .attr('height', InterfaceStatusWidget.LABEL_HEIGHT)
      .attr('x', (ls: LinkStatus) => -(this.getLabelWidth(ls.port) / 2))
      .attr('y', -InterfaceStatusWidget.LABEL_HEIGHT / 2)
      .attr('rx', InterfaceStatusWidget.LABEL_RADIUS)
      .attr('ry', InterfaceStatusWidget.LABEL_RADIUS)
      .style('fill', InterfaceStatusWidget.LABEL_BACKGROUND_COLOR)
      .style('fill-opacity', 1)
      .attr('stroke', (ls: LinkStatus) => this.getStatusStrokeColor(ls.status))
      .attr('stroke-width', InterfaceStatusWidget.LABEL_STROKE_WIDTH);
    tooltipRects.exit().remove();

    const tooltipTexts = tooltipsMerge.selectAll<SVGTextElement, LinkStatus>('text').data((ls) => [ls]);
    tooltipTexts
      .enter()
      .append<SVGTextElement>('text')
      .merge(tooltipTexts)
      .attr('class', 'status_hover_tooltip_label')
      .text((ls: LinkStatus) => ls.port || '')
      .attr('x', 0)
      .attr('y', 0)
      .attr('dy', '0em')
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'central')
      .attr('alignment-baseline', 'central')
      .attr('fill', '#111111')
      .style('font-family', InterfaceStatusWidget.LABEL_FONT_FAMILY)
      .style('font-size', `${InterfaceStatusWidget.LABEL_FONT_SIZE}px`)
      .style('font-weight', '500');
    tooltipTexts.exit().remove();

    tooltips.exit().remove();
  }

  private bindEndpointTooltipHover(
    linkPath: Selection<SVGPathElement, MapLink, SVGGElement, MapLink>,
    linkGroup: Selection<SVGGElement, MapLink, SVGElement, any>,
    enabled: boolean
  ) {
    const linkGroupNode = linkGroup.node();
    const linkContainer =
      linkGroupNode && linkGroupNode.parentNode
        ? select<SVGGElement, MapLink>(linkGroupNode.parentNode as SVGGElement)
        : null;

    if (!enabled) {
      linkPath.on('mouseover.status_hover_tooltip', null);
      linkPath.on('mouseout.status_hover_tooltip', null);
      linkPath.attr('pointer-events', null);
      linkGroup.selectAll<SVGGElement, LinkStatus>('g.status_hover_tooltip').attr('visibility', 'hidden');
      return;
    }

    linkPath.attr('pointer-events', 'stroke');

    linkPath
      .on('mouseover.status_hover_tooltip', () => {
        if (linkContainer) {
          linkContainer.raise();
        }
        linkGroup
          .selectAll<SVGGElement, LinkStatus>('g.status_hover_tooltip')
          .raise()
          .attr('visibility', 'visible');
      })
      .on('mouseout.status_hover_tooltip', () => {
        linkGroup.selectAll<SVGGElement, LinkStatus>('g.status_hover_tooltip').attr('visibility', 'hidden');
      });

    const pathNode = linkPath.node();
    const isHovered = pathNode ? pathNode.matches(':hover') : false;
    const tooltipSelection = linkGroup.selectAll<SVGGElement, LinkStatus>('g.status_hover_tooltip');
    if (isHovered) {
      if (linkContainer) {
        linkContainer.raise();
      }
      tooltipSelection.raise();
    }
    tooltipSelection.attr('visibility', isHovered ? 'visible' : 'hidden');
  }
}
