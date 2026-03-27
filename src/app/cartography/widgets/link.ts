import { EventEmitter, Injectable } from '@angular/core';
import { drag, D3DragEvent } from 'd3-drag';
import { select } from 'd3-selection';

import { LinkContextMenu } from '../events/event-source';
import { LinksEventSource } from '../events/links-event-source';
import { MultiLinkCalculatorHelper } from '../helpers/multi-link-calculator-helper';
import { SelectionManager } from '../managers/selection-manager';
import { MapLink } from '../models/map/map-link';
import { SVGSelection } from '../models/types';
import { InterfaceLabelWidget } from './interface-label';
import { InterfaceStatusWidget } from './interface-status';
import { EthernetLinkWidget } from './links/ethernet-link';
import { SerialLinkWidget } from './links/serial-link';
import { StyleTranslator } from './links/style-translator';
import { Widget } from './widget';

@Injectable()
export class LinkWidget implements Widget {
  public onContextMenu = new EventEmitter<LinkContextMenu>();

  constructor(
    private multiLinkCalculatorHelper: MultiLinkCalculatorHelper,
    private interfaceLabelWidget: InterfaceLabelWidget,
    private interfaceStatusWidget: InterfaceStatusWidget,
    private selectionManager: SelectionManager,
    private ethernetLinkWidget: EthernetLinkWidget,
    private serialLinkWidget: SerialLinkWidget,
    private linksEventSource: LinksEventSource
  ) {}

  public draw(view: SVGSelection) {
    const link_body = view.selectAll<SVGGElement, MapLink>('g.link_body').data((l) => [l]);

    const link_body_enter = link_body.enter().append<SVGGElement>('g').attr('class', 'link_body');

    const link_body_merge = link_body.merge(link_body_enter).attr('transform', (link) => {
      const translation = this.multiLinkCalculatorHelper.linkTranslation(link.distance, link.source, link.target);
      return `translate (${translation.dx}, ${translation.dy})`;
    });

    link_body.select('.capture-icon').remove();
    link_body
      .filter((l) => {
        return (
          l.capturing &&
          !l.suspend &&
          !(l.filters.bpf || l.filters.corrupt || l.filters.delay || l.filters.frequency_drop || l.filters.packet_loss)
        );
      })
      .append<SVGGElement>('g')
      .on('contextmenu', (event: any, datum: MapLink) => {
        const evt = event;
        this.onContextMenu.emit(new LinkContextMenu(evt, datum));
      })
      .attr('class', 'capture-icon')
      .attr('transform', (link) => {
        return `translate (${(link.source.x + link.target.x) / 2 + 24}, ${
          (link.source.y + link.target.y) / 2 + 24
        }) scale(0.5)`;
      })
      .attr('viewBox', '0 0 20 20')
      .append<SVGImageElement>('image')
      .attr('xlink:href', 'assets/resources/images/inspect.svg');

    link_body.select('.filter-capture-icon').remove();
    link_body
      .filter((l) => {
        return (
          l.capturing &&
          !l.suspend &&
          (l.filters.bpf || l.filters.corrupt || l.filters.delay || l.filters.frequency_drop || l.filters.packet_loss)
        );
      })
      .append<SVGGElement>('g')
      .on('contextmenu', (event: any, datum: MapLink) => {
        const evt = event;
        this.onContextMenu.emit(new LinkContextMenu(evt, datum));
      })
      .attr('class', 'filter-capture-icon')
      .attr('transform', (link) => {
        return `translate (${(link.source.x + link.target.x) / 2 + 24}, ${
          (link.source.y + link.target.y) / 2 + 24
        }) scale(0.5)`;
      })
      .attr('viewBox', '0 0 20 20')
      .append<SVGImageElement>('image')
      .attr('xlink:href', 'assets/resources/images/filter-capture.svg');

    link_body.select('.filter-icon').remove();
    link_body
      .filter((l) => {
        return (
          !l.capturing &&
          !l.suspend &&
          (l.filters.bpf || l.filters.corrupt || l.filters.delay || l.filters.frequency_drop || l.filters.packet_loss)
        );
      })
      .append<SVGGElement>('g')
      .on('contextmenu', (event: any, datum: MapLink) => {
        const evt = event;
        this.onContextMenu.emit(new LinkContextMenu(evt, datum));
      })
      .attr('class', 'filter-icon')
      .attr('width', '48px')
      .attr('height', '48px')
      .attr('transform', (link) => {
        return `translate (${(link.source.x + link.target.x) / 2 + 24}, ${
          (link.source.y + link.target.y) / 2 + 24
        }) scale(0.5)`;
      })
      .attr('viewBox', '0 0 20 20')
      .append<SVGImageElement>('image')
      .attr('width', '48px')
      .attr('height', '48px')
      .attr('xlink:href', 'assets/resources/images/filter.svg');

    link_body.select('.pause-icon').remove();
    link_body
      .filter((l) => {
        return l.suspend;
      })
      .append<SVGGElement>('g')
      .on('contextmenu', (event: any, datum: MapLink) => {
        const evt = event;
        this.onContextMenu.emit(new LinkContextMenu(evt, datum));
      })
      .attr('class', 'pause-icon')
      .attr('transform', (link) => {
        return `translate (${(link.source.x + link.target.x) / 2 + 24}, ${
          (link.source.y + link.target.y) / 2 + 24
        }) scale(0.5)`;
      })
      .attr('viewBox', '0 0 20 20')
      .append<SVGImageElement>('image')
      .attr('xlink:href', 'assets/resources/images/pause.svg');

    this.serialLinkWidget.draw(link_body_merge);
    this.ethernetLinkWidget.draw(link_body_merge);

    link_body_merge
      .select<SVGPathElement>('path')
      .classed('selected', (l: MapLink) => this.selectionManager.isSelected(l));

    // Curviness drag: directly drag path to adjust bezier/statemachine/freeform curvature (Photoshop-like)
    const self = this;
    link_body_merge.each(function(l: MapLink) {
      const linkType = StyleTranslator.normalizeLinkType(l.link_style?.link_type);
      if (linkType !== 'bezier' && linkType !== 'statemachine' && linkType !== 'freeform') return;

      const linkGroup = select(this);
      const path = linkGroup.select<SVGPathElement>('path');
      if (path.empty()) return;

      // Get actual center points (same as used in linkToXxxLink methods)
      const sourceCenterX = l.source.x + l.source.width / 2;
      const sourceCenterY = l.source.y + l.source.height / 2;
      const targetCenterX = l.target.x + l.target.width / 2;
      const targetCenterY = l.target.y + l.target.height / 2;

      // Calculate perpendicular and tangent directions to the link
      const dx = targetCenterX - sourceCenterX;
      const dy = targetCenterY - sourceCenterY;
      const length = Math.hypot(dx, dy) || 1;
      const perpX = -dy / length;
      const perpY = dx / length;
      const tangentX = dx / length;
      const tangentY = dy / length;

      // Midpoint of the link
      const midX = (sourceCenterX + targetCenterX) / 2;
      const midY = (sourceCenterY + targetCenterY) / 2;

      // Add drag behavior to path
      path
        .attr('cursor', 'grab')
        .on('mouseenter', function() {
          select(this).attr('cursor', 'grab');
        })
        .on('mouseleave', function() {
          select(this).attr('cursor', 'default');
        })
        .call(
          drag<SVGPathElement, MapLink>()
            .on('start', function() {
              select(this).attr('cursor', 'grabbing');
            })
            .on('drag', function(event: D3DragEvent<SVGPathElement, MapLink, MapLink>, l: MapLink) {
              // Get mouse position from sourceEvent (native mouse event)
              const sourceEvent = event.sourceEvent;
              const svgElement = (sourceEvent.target as SVGElement).ownerSVGElement;
              const point = svgElement.createSVGPoint();
              point.x = sourceEvent.clientX;
              point.y = sourceEvent.clientY;
              const ctm = svgElement.getScreenCTM();
              if (ctm) {
                const svgPoint = point.matrixTransform(ctm.inverse());
                // svgPoint.x, svgPoint.y is in SVG coordinate system

                // Update path in real-time using freeform bezier
                const sourceCenter: [number, number] = [sourceCenterX, sourceCenterY];
                const targetCenter: [number, number] = [targetCenterX, targetCenterY];
                const sourceOrientation = StyleTranslator.getContinuousOrientation(sourceCenter, targetCenter);
                const targetOrientation = StyleTranslator.getContinuousOrientation(targetCenter, sourceCenter);
                const newPath = StyleTranslator.getFreeformBezierPath(
                  sourceCenter,
                  targetCenter,
                  sourceOrientation,
                  targetOrientation,
                  [svgPoint.x, svgPoint.y]
                );
                select(this).attr('d', newPath);

                // Store control_offset for final save (relative to midpoint)
                const offsetX = svgPoint.x - midX;
                const offsetY = svgPoint.y - midY;

                if (!l.link_style) {
                  l.link_style = {};
                }
                l.link_style.link_type = 'freeform';
                l.link_style.control_offset = [offsetX, offsetY];
              }
            })
            .on('end', function(event: D3DragEvent<SVGPathElement, MapLink, MapLink>, l: MapLink) {
              select(this).attr('cursor', 'grab');
              // Emit edited event to persist changes
              self.linksEventSource.edited.next(l);
            })
        );
    });

    this.interfaceLabelWidget.draw(link_body_merge);
    this.interfaceStatusWidget.draw(link_body_merge);
  }
}
