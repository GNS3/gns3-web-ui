import { EventEmitter, Injectable } from '@angular/core';
import { select } from 'd3-selection';

import { MapSettingsService } from '@services/mapsettings.service';
import { ClickedDataEvent } from '../events/event-source';
import { NodeClicked, NodeContextMenu } from '../events/nodes';
import { NodesEventSource } from '../events/nodes-event-source';
import { SelectionManager } from '../managers/selection-manager';
import { MapNode } from '../models/map/map-node';
import { SVGSelection } from '../models/types';
import { LabelWidget } from './label';
import { Widget } from './widget';

const LOCKED_ICON_PATH =
  'M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z';
// Outer contour only (no inner rect subpath) — gives a solid filled shape so stroke only traces the outside edge
const UNLOCKED_OUTER_PATH =
  'M18 8h-8V6c0-1.1.9-2 2-2s2 .9 2 2h2c0-2.21-1.79-4-4-4S8 3.79 8 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2z';
const LOCKED_ICON_COLOR = 'var(--gns3-lock-badge-locked-color)';
const UNLOCKED_ICON_COLOR = 'var(--gns3-lock-badge-unlocked-color)';
const BADGE_OUTLINE_COLOR = 'var(--gns3-lock-badge-outline-color)';

@Injectable()
export class NodeWidget implements Widget {
  public onContextMenu = new EventEmitter<NodeContextMenu>();
  public onContextConsoleMenu = new EventEmitter<NodeContextMenu>();
  public onNodeClicked = new EventEmitter<NodeClicked>();

  constructor(
    private selectionManager: SelectionManager,
    private labelWidget: LabelWidget,
    private nodesEventSource: NodesEventSource,
    private mapSettingsService: MapSettingsService
  ) {}

  public draw(view: SVGSelection) {
    const self = this;

    const node_body = view.selectAll<SVGGElement, MapNode>('g.node_body').data((n) => [n]);

    const node_body_enter = node_body.enter().append<SVGGElement>('g').attr('class', 'node_body');

    node_body_enter.append<SVGImageElement>('image');

    const node_body_merge = node_body
      .merge(node_body_enter)
      .classed('selected', (n: MapNode) => this.selectionManager.isSelected(n))
      .classed('locked', (n: MapNode) => n.locked)
      .on('click', (event: any, node: MapNode) => {
        this.nodesEventSource.clicked.emit(new ClickedDataEvent<MapNode>(node, event.pageX, event.pageY));
      });

    node_body_merge.select('.layer_label_wrapper').remove();
    if (this.mapSettingsService.isLayerNumberVisible) {
      node_body_merge
        .append<SVGRectElement>('rect')
        .attr('class', 'layer_label_wrapper')
        .attr('width', '26')
        .attr('height', '26')
        .attr('x', (n: MapNode) => n.width / 2 - 13)
        .attr('y', (n: MapNode) => n.height / 2 - 13)
        .attr('fill', 'red');
    }

    node_body_merge.select('.layer_label').remove();
    if (this.mapSettingsService.isLayerNumberVisible) {
      node_body_merge
        .append<SVGTextElement>('text')
        .attr('class', 'layer_label')
        .text((n: MapNode) => {
          return n.z;
        })
        .attr('x', function (n: MapNode) {
          if (n.z >= 100) return n.width / 2 - 13;
          else if (n.z >= 10) return n.width / 2 - 9;
          else return n.width / 2 - 5;
        })
        .attr('y', (n: MapNode) => n.height / 2 + 5)
        .attr('style', () => {
          const styles: string[] = [];
          styles.push(`font-family: "Noto Sans"`);
          styles.push(`font-size: 11pt`);
          styles.push(`font-weight: bold`);
          return styles.join('; ');
        })
        .attr('fill', `#ffffff`);
    }

    node_body_merge.select('.node_lock_status_badge').remove();
    if (this.mapSettingsService.isItemLockStatusVisible) {
      const lockStatusBadge = node_body_merge
        .append<SVGGElement>('g')
        .attr('class', 'node_lock_status_badge')
        .attr('pointer-events', 'none')
        .attr('transform', (n: MapNode) => {
          const w = n.width > 0 ? n.width : 60;
          const h = n.height > 0 ? n.height : 60;
          // Place badge 25% inward from the top-right corner so it is always
          // clearly inside the item regardless of size.
          // Cloud/NAT nodes (and any node whose symbol name contains 'nat' or 'cloud')
          // are oval-shaped — use a fixed 12px inset from the 45° arc point so the
          // badge stays fully inside even on small nodes (badge half-size ≈ 8px).
          const isOval =
            n.nodeType === 'cloud' ||
            n.nodeType === 'nat' ||
            (n.symbol && (n.symbol.toLowerCase().includes('nat') || n.symbol.toLowerCase().includes('cloud')));
          if (isOval) {
            const bx = w / 2 + (w / 2 - 12) / Math.SQRT2;
            const by = h / 2 - (h / 2 - 12) / Math.SQRT2;
            return `translate(${bx}, ${by})`;
          }
          return `translate(${w * 0.80}, ${h * 0.20})`;
        });

      const lockedBadge = lockStatusBadge.filter((n: MapNode) => n.locked);
      lockedBadge
        .append<SVGPathElement>('path')
        .attr('d', LOCKED_ICON_PATH)
        .attr('transform', 'translate(-7.68, -7.68) scale(0.64)')
        .attr('fill', LOCKED_ICON_COLOR)
        .attr('stroke', BADGE_OUTLINE_COLOR)
        .attr('stroke-width', 1.2)
        .attr('stroke-linejoin', 'round')
        .attr('paint-order', 'stroke fill');

      const unlockedBadge = lockStatusBadge.filter((n: MapNode) => !n.locked);
      const unlockedIconGroup = unlockedBadge
        .append<SVGGElement>('g')
        .attr('transform', 'translate(-7.68, -7.68) scale(0.64)');

      // Solid outer contour path (no inner rect subpath) — stroke traces only the outside edge, no inner white border
      unlockedIconGroup
        .append<SVGPathElement>('path')
        .attr('d', UNLOCKED_OUTER_PATH)
        .attr('fill', UNLOCKED_ICON_COLOR)
        .attr('stroke', BADGE_OUTLINE_COLOR)
        .attr('stroke-width', 1.2)
        .attr('stroke-linejoin', 'round')
        .attr('paint-order', 'stroke fill');

      // White dot centered in the body (matching locked keyhole style)
      unlockedIconGroup
        .append<SVGCircleElement>('circle')
        .attr('cx', 12)
        .attr('cy', 15)
        .attr('r', 2)
        .attr('fill', BADGE_OUTLINE_COLOR);
    }

    // update image of node
    node_body_merge
      .select<SVGImageElement>('image')
      .on('contextmenu', function (this: SVGImageElement, event: MouseEvent, n: MapNode) {
        event.preventDefault();
        self.onContextMenu.emit(new NodeContextMenu(event, n));
      })
      .on('dblclick', function (this: SVGImageElement, event: MouseEvent, n: MapNode) {
        event.preventDefault();
        self.onContextConsoleMenu.emit(new NodeContextMenu(event, n));
      })
      .each(function (n: MapNode) {
        const currentHref = (this as Element).getAttribute('href');
        if (currentHref !== n.symbolUrl) {
          // Force browser to reload the image by:
          // 1. Removing the href attribute
          // 2. Forcing a reflow
          // 3. Setting the new href
          (this as Element).removeAttribute('href');
          // Force reflow by accessing a layout property
          void (this as Element).getClientRects();
          (this as Element).setAttribute('href', n.symbolUrl);
        }
      })
      .attr('width', (n: MapNode) => {
        if (!n.width) return 60;
        return n.width;
      })
      .attr('height', (n: MapNode) => {
        if (!n.height) return 60;
        return n.height;
      })
      .attr('x', (n: MapNode) => {
        return 0;
      })
      .attr('y', (n: MapNode) => {
        return 0;
      })
      .on('mouseover', function (this, n: MapNode) {
        select(this).attr('class', 'over');
      })
      .on('mouseout', function (this, n: MapNode) {
        select(this).attr('class', '');
      });

    node_body_merge.attr('transform', (n: MapNode) => {
      if (!n.width) return `translate(${n.x - 30},${n.y - 30})`;
      return `translate(${n.x},${n.y})`;
    });

    this.labelWidget.draw(node_body_merge);
  }
}
