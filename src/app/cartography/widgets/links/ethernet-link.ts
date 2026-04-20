import { EventEmitter, Injectable } from '@angular/core';
import { LinkContextMenu } from '../../events/event-source';
import { MapLink } from '../../models/map/map-link';
import { SVGSelection } from '../../models/types';
import { Widget } from '../widget';
import { LinkStyle } from '@models/link-style';
import { ConnectorOrientation, StyleTranslator } from './style-translator';
import { BezierLinkLayout } from './bezier-link-layout';

class EthernetLinkPath {
  constructor(
    public link: MapLink,
    public source: [number, number],
    public target: [number, number],
    public style: LinkStyle,
    public bezierVariation: number = 0,
    public sourceOrientation?: ConnectorOrientation,
    public targetOrientation?: ConnectorOrientation,
    public controlOffset?: [number, number]
  ) {}
}

@Injectable()
export class EthernetLinkWidget implements Widget {
  public onContextMenu = new EventEmitter<LinkContextMenu>();
  private readonly bezierLayout = new BezierLinkLayout();
  private readonly defaultEthernetLinkStyle: LinkStyle = {
    color: '#000000',
    width: 2,
    type: 1,
    link_type: StyleTranslator.DEFAULT_LINK_TYPE,
    bezier_curviness: StyleTranslator.BEZIER_CURVINESS_DEFAULT,
    flowchart_roundness: StyleTranslator.FLOWCHART_ROUNDNESS_DEFAULT,
  };

  constructor() {}

  private linktoEthernetLink(link: MapLink) {
    const normalizedLinkType = StyleTranslator.normalizeLinkType(link.link_style?.link_type);
    const sourceCenter: [number, number] = [
      link.source.x + link.source.width / 2,
      link.source.y + link.source.height / 2,
    ];
    const targetCenter: [number, number] = [
      link.target.x + link.target.width / 2,
      link.target.y + link.target.height / 2,
    ];
    const sourceOrientation = StyleTranslator.getContinuousOrientation(sourceCenter, targetCenter);
    const targetOrientation = StyleTranslator.getContinuousOrientation(targetCenter, sourceCenter);
    const bezierVariation = normalizedLinkType === 'bezier' ? this.bezierLayout.getVariation(link) : 0;

    const hasValidColor = typeof link.link_style?.color === 'string' && link.link_style.color.length > 0;
    const hasValidWidth =
      typeof link.link_style?.width === 'number' && link.link_style.width >= this.defaultEthernetLinkStyle.width;

    const style: LinkStyle = {
      color: hasValidColor ? link.link_style.color : this.defaultEthernetLinkStyle.color,
      width: hasValidWidth ? link.link_style.width : this.defaultEthernetLinkStyle.width,
      type: link.link_style?.type !== undefined ? link.link_style.type : this.defaultEthernetLinkStyle.type,
      link_type: normalizedLinkType,
      bezier_curviness:
        normalizedLinkType === 'statemachine'
          ? StyleTranslator.normalizeStateMachineCurviness(link.link_style?.bezier_curviness)
          : StyleTranslator.normalizeBezierCurviness(link.link_style?.bezier_curviness),
      flowchart_roundness: StyleTranslator.normalizeFlowchartRoundness(link.link_style?.flowchart_roundness),
      control_offset: link.link_style?.control_offset,
    };

    let sourcePoint = sourceCenter;
    let targetPoint = targetCenter;

    if (normalizedLinkType === 'bezier') {
      sourcePoint = this.bezierLayout.getEndpointPoint(
        sourceCenter,
        sourceOrientation,
        this.bezierLayout.getRenderEndpointOrder(link, 0)
      );
      targetPoint = this.bezierLayout.getEndpointPoint(
        targetCenter,
        targetOrientation,
        this.bezierLayout.getRenderEndpointOrder(link, 1)
      );

      const majorAnchor = StyleTranslator.getEffectiveBezierMajorAnchor(style.bezier_curviness, bezierVariation);
      const curveSideDirection = StyleTranslator.getBezierSideSign(
        sourcePoint,
        targetPoint,
        majorAnchor,
        sourceOrientation,
        targetOrientation
      );

      this.bezierLayout.applyLabelRenderOffsets(link, sourcePoint, targetPoint, curveSideDirection, majorAnchor);
    } else {
      this.bezierLayout.clearLabelRenderOffsets(link);
    }

    return new EthernetLinkPath(
      link,
      sourcePoint,
      targetPoint,
      style,
      bezierVariation,
      sourceOrientation,
      targetOrientation,
      style.control_offset
    );
  }

  public draw(view: SVGSelection) {
    const linksInView = view.data() as MapLink[];
    this.bezierLayout.buildEndpointOrder(Array.isArray(linksInView) ? linksInView : []);

    const link = view.selectAll('path.ethernet_link').data((l: MapLink) => {
      if (l.linkType === 'ethernet') {
        const ethernetLink = this.linktoEthernetLink(l);
        return ethernetLink ? [ethernetLink] : [];
      }
      return [];
    });

    const link_enter = link.enter().append<SVGPathElement>('path').attr('class', 'ethernet_link');

    const link_merge = link.merge(link_enter);

    link_merge
      .on('contextmenu', (evt: any, datum: any) => {
        const link: MapLink = datum;
        if (!link) {
          return;
        }
        this.onContextMenu.emit(new LinkContextMenu(evt, link));
      })
      .attr('transform', (datum) => {
        return StyleTranslator.getLinkTransform(datum.style);
      })
      .attr('fill', 'none')
      .attr('stroke', (datum) => {
        // Use CSS variable for default color, custom color if set
        if (!datum.style.color || datum.style.color === this.defaultEthernetLinkStyle.color) {
          return 'var(--gns3-canvas-link-color)';
        }
        return datum.style.color;
      })
      .attr('stroke-width', (datum) => {
        return datum.style.width;
      })
      .attr('stroke-dasharray', (datum) => {
        return StyleTranslator.getLinkStyle(datum.style);
      })
      .classed('link_hidden', (datum) => datum.style.type === 0)
      .attr('pointer-events', (datum) => {
        return datum.style.type === 0 ? 'stroke' : null;
      })
      .attr('d', (ethernet) => {
        // Use freeform bezier if link_type is freeform OR if control_offset exists
        // (control_offset is only set for freeform links when user drags to adjust curve)
        if (ethernet.style.link_type === 'freeform' || ethernet.controlOffset) {
          return StyleTranslator.getFreeformBezierPath(
            ethernet.source,
            ethernet.target,
            ethernet.sourceOrientation,
            ethernet.targetOrientation,
            ethernet.controlOffset
          );
        }
        return StyleTranslator.getLinkPath(ethernet.source, ethernet.target, ethernet.style, {
          bezierVariation: ethernet.bezierVariation,
          sourceOrientation: ethernet.sourceOrientation,
          targetOrientation: ethernet.targetOrientation,
          flowchartDistance:
            typeof ethernet.link.distance === 'number' && !Number.isNaN(ethernet.link.distance)
              ? ethernet.link.distance
              : 0,
        });
      });
  }
}
