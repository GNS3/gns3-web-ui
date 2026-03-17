import { EventEmitter, Injectable } from '@angular/core';
import { event } from 'd3-selection';
import { LinkContextMenu } from '../../events/event-source';
import { MapLink } from '../../models/map/map-link';
import { SVGSelection } from '../../models/types';
import { Widget } from '../widget';
import { LinkStyle } from '@models/link-style';
import { ConnectorOrientation, StyleTranslator } from './style-translator';
import { BezierLinkLayout } from './bezier-link-layout';

class SerialLinkPath {
  constructor(
    public link: MapLink,
    public source: [number, number],
    public target: [number, number],
    public style: LinkStyle,
    public bezierVariation: number = 0,
    public useLegacySerialPattern: boolean = false,
    public sourceOrientation?: ConnectorOrientation,
    public targetOrientation?: ConnectorOrientation
  ) {}
}

@Injectable()
export class SerialLinkWidget implements Widget {
  public onContextMenu = new EventEmitter<LinkContextMenu>();
  private readonly bezierLayout = new BezierLinkLayout();
  private readonly defaultSerialLinkStyle: LinkStyle = {
    color: '#800000',
    width: 2,
    type: 0,
    link_type: StyleTranslator.DEFAULT_LINK_TYPE,
    bezier_curviness: StyleTranslator.BEZIER_CURVINESS_DEFAULT,
    flowchart_roundness: StyleTranslator.FLOWCHART_ROUNDNESS_DEFAULT,
  };

  constructor() {}

  private resolveContextMenuLink(arg1: unknown, arg2: unknown): MapLink | undefined {
    const candidates = [arg2, arg1];

    for (const candidate of candidates) {
      if (!candidate || typeof candidate !== 'object') {
        continue;
      }

      const maybePath = candidate as Partial<SerialLinkPath>;
      if (maybePath.link) {
        return maybePath.link;
      }

      const maybeMapLink = candidate as Partial<MapLink>;
      if (typeof maybeMapLink.id === 'string' && Array.isArray(maybeMapLink.nodes)) {
        return maybeMapLink as MapLink;
      }
    }

    return undefined;
  }

  private getLegacySerialPath(source: [number, number], target: [number, number]) {
    const dx = target[0] - source[0];
    const dy = target[1] - source[1];
    const vectorAngle = Math.atan2(dy, dx);
    const rotatedVectorAngle = vectorAngle - Math.PI / 4;
    const rotatedVectorX = Math.cos(rotatedVectorAngle);
    const rotatedVectorY = Math.sin(rotatedVectorAngle);
    const zigZagAmplitude = 15;
    const middleX = source[0] + dx / 2;
    const middleY = source[1] + dy / 2;

    const angleSource: [number, number] = [
      middleX + zigZagAmplitude * rotatedVectorX,
      middleY + zigZagAmplitude * rotatedVectorY,
    ];
    const angleTarget: [number, number] = [
      middleX - zigZagAmplitude * rotatedVectorX,
      middleY - zigZagAmplitude * rotatedVectorY,
    ];

    return `M${source[0]},${source[1]}L${angleSource[0]},${angleSource[1]}L${angleTarget[0]},${angleTarget[1]}L${target[0]},${target[1]}`;
  }

  private linkToSerialLink(link: MapLink) {
    const normalizedLinkType = StyleTranslator.normalizeLinkType(link.link_style?.link_type);
    const sourceCenter: [number, number] = [link.source.x + link.source.width / 2, link.source.y + link.source.height / 2];
    const targetCenter: [number, number] = [link.target.x + link.target.width / 2, link.target.y + link.target.height / 2];
    const sourceOrientation = StyleTranslator.getContinuousOrientation(sourceCenter, targetCenter);
    const targetOrientation = StyleTranslator.getContinuousOrientation(targetCenter, sourceCenter);
    const bezierVariation = normalizedLinkType === 'bezier'
      ? this.bezierLayout.getVariation(link)
      : 0;

    const hasValidColor = typeof link.link_style?.color === 'string' && link.link_style.color.length > 0;
    const hasValidWidth =
      typeof link.link_style?.width === 'number' && link.link_style.width >= this.defaultSerialLinkStyle.width;

    const style: LinkStyle = {
      color: hasValidColor ? link.link_style.color : this.defaultSerialLinkStyle.color,
      width: hasValidWidth ? link.link_style.width : this.defaultSerialLinkStyle.width,
      type: link.link_style?.type !== undefined ? link.link_style.type : this.defaultSerialLinkStyle.type,
      link_type: normalizedLinkType,
      bezier_curviness:
        normalizedLinkType === 'statemachine'
          ? StyleTranslator.normalizeStateMachineCurviness(link.link_style?.bezier_curviness)
          : StyleTranslator.normalizeBezierCurviness(link.link_style?.bezier_curviness),
      flowchart_roundness: StyleTranslator.normalizeFlowchartRoundness(link.link_style?.flowchart_roundness),
    };

    let sourcePoint = sourceCenter;
    let targetPoint = targetCenter;

    if (normalizedLinkType === 'bezier') {
      sourcePoint = this.bezierLayout.getEndpointPoint(
        sourceCenter,
        sourceOrientation,
        this.bezierLayout.getEndpointOrder(link, 0)
      );
      targetPoint = this.bezierLayout.getEndpointPoint(
        targetCenter,
        targetOrientation,
        this.bezierLayout.getEndpointOrder(link, 1)
      );

      const majorAnchor = StyleTranslator.getEffectiveBezierMajorAnchor(style.bezier_curviness, bezierVariation);
      const curveSideDirection = StyleTranslator.getBezierSideSign(
        sourcePoint,
        targetPoint,
        majorAnchor,
        sourceOrientation,
        targetOrientation
      );

      this.bezierLayout.applyLabelRenderOffsets(
        link,
        sourcePoint,
        targetPoint,
        curveSideDirection,
        majorAnchor
      );
    } else {
      this.bezierLayout.clearLabelRenderOffsets(link);
    }

    return new SerialLinkPath(
      link,
      sourcePoint,
      targetPoint,
      style,
      bezierVariation,
      normalizedLinkType === StyleTranslator.DEFAULT_LINK_TYPE,
      sourceOrientation,
      targetOrientation
    );
  }

  public draw(view: SVGSelection) {
    const linksInView = view.data() as MapLink[];
    this.bezierLayout.buildEndpointOrder(Array.isArray(linksInView) ? linksInView : []);

    const link = view.selectAll<SVGPathElement, SerialLinkPath>('path.serial_link').data((l) => {
      if (l.linkType === 'serial') {
        const serialLink = this.linkToSerialLink(l);
        return serialLink ? [serialLink] : [];
      }
      return [];
    });

    const link_enter = link
      .enter()
      .append<SVGPathElement>('path')
      .attr('class', 'serial_link')
      .attr('fill', 'none')
      .on('contextmenu', (arg1: unknown, arg2: unknown) => {
        const evt = event;
        const link = this.resolveContextMenuLink(arg1, arg2);
        if (!link) {
          return;
        }
        this.onContextMenu.emit(new LinkContextMenu(evt, link));
      })
      .attr('stroke', (datum) => {
        return datum.style.color;
      })
      .attr('stroke-width', (datum) => {
        return datum.style.width;
      })
      .attr('stroke-dasharray', (datum) => {
        return StyleTranslator.getLinkStyle(datum.style);
      });

    const link_merge = link.merge(link_enter);

    link_merge
      .attr('transform', (datum) => {
        return StyleTranslator.getLinkTransform(datum.style);
      })
      .attr('fill', 'none')
      .attr('stroke', (datum) => {
        return datum.style.color;
      })
      .attr('stroke-width', (datum) => {
        return datum.style.width;
      })
      .attr('stroke-dasharray', (datum) => {
        return StyleTranslator.getLinkStyle(datum.style);
      })
      .attr('d', (serial) => {
        if (serial.useLegacySerialPattern) {
          return this.getLegacySerialPath(serial.source, serial.target);
        }

        return StyleTranslator.getLinkPath(serial.source, serial.target, serial.style, {
          bezierVariation: serial.bezierVariation,
          sourceOrientation: serial.sourceOrientation,
          targetOrientation: serial.targetOrientation,
        });
      });
  }
}
