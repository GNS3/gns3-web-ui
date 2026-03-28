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
        // For freeform links, use control_offset as the center position
        // Icon size is 20x20, scaled to 10x10, so subtract 5 to get top-left corner
        if (link.link_style?.link_type === 'freeform' && link.link_style?.control_offset) {
          return `translate (${link.link_style.control_offset[0] - 5}, ${link.link_style.control_offset[1] - 5}) scale(0.5)`;
        }
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
        // For freeform links, use control_offset as the center position
        // Icon size is 20x20, scaled to 10x10, so subtract 5 to get top-left corner
        if (link.link_style?.link_type === 'freeform' && link.link_style?.control_offset) {
          return `translate (${link.link_style.control_offset[0] - 5}, ${link.link_style.control_offset[1] - 5}) scale(0.5)`;
        }
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

      // Drag state to track initial position and offset
      const dragState = {
        startX: 0,
        startY: 0,
        startOffset: [0, 0] as [number, number],
      };

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
            .on('start', function(event: D3DragEvent<SVGPathElement, MapLink, MapLink>) {
              select(this).attr('cursor', 'grabbing');
              // Store initial position and current control offset
              dragState.startX = event.x;
              dragState.startY = event.y;
              // Get current control position from existing offset or calculate from midpoint
              if (l.link_style?.control_offset) {
                dragState.startOffset = [l.link_style.control_offset[0], l.link_style.control_offset[1]];
              } else {
                dragState.startOffset = [midX, midY];
              }
            })
            .on('drag', function(event: D3DragEvent<SVGPathElement, MapLink, MapLink>, l: MapLink) {
              // D3 drag provides event.x/y in the path's coordinate system
              const mousePos: [number, number] = [event.x, event.y];

              // Get the stored start position and apply delta
              const startX = dragState.startX;
              const startY = dragState.startY;
              const startOffset = dragState.startOffset;

              // Calculate delta from drag start
              const deltaX = mousePos[0] - startX;
              const deltaY = mousePos[1] - startY;

              // Apply delta to initial offset to get current control position
              const controlX = startOffset[0] + deltaX;
              const controlY = startOffset[1] + deltaY;

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
                [controlX, controlY]
              );
              select(this).attr('d', newPath);

              // Update capture icons position to follow the control point
              const linkGroup = select(this.parentNode as Element);
              const captureIcon = linkGroup.select<SVGGElement>('g.capture-icon');
              if (!captureIcon.empty()) {
                captureIcon.attr('transform', `translate (${controlX - 5}, ${controlY - 5}) scale(0.5)`);
              }
              const filterCaptureIcon = linkGroup.select<SVGGElement>('g.filter-capture-icon');
              if (!filterCaptureIcon.empty()) {
                filterCaptureIcon.attr('transform', `translate (${controlX - 5}, ${controlY - 5}) scale(0.5)`);
              }

              // Store mouse position directly as control_offset
              if (!l.link_style) {
                l.link_style = {};
              }
              l.link_style.link_type = 'freeform';
              l.link_style.control_offset = [controlX, controlY];
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
