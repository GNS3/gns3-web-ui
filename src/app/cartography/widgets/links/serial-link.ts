import { EventEmitter, Injectable } from '@angular/core';
import { path } from 'd3-path';

import { LinkContextMenu } from '../../events/event-source';
import { MapLink } from '../../models/map/map-link';
import { SVGSelection } from '../../models/types';
import { Widget } from '../widget';
import { LinkStyle } from '@models/link-style';
import { StyleTranslator } from './style-translator';

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
  private defaultSerialLinkStyle: LinkStyle = {
    color: '#800000',
    width: 2,
    type: 0,
  };

  constructor() {}

  private linkToSerialLink(link: MapLink) {
    // Validate source and target have valid coordinates
    if (
      !link.source ||
      !link.target ||
      link.source.x == null ||
      link.source.y == null ||
      link.source.width == null ||
      link.source.height == null ||
      link.target.x == null ||
      link.target.y == null ||
      link.target.width == null ||
      link.target.height == null
    ) {
      return null;
    }

    const source = {
      x: link.source.x + link.source.width / 2,
      y: link.source.y + link.source.height / 2,
    };
    const target = {
      x: link.target.x + link.target.width / 2,
      y: link.target.y + link.target.height / 2,
    };

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

    const style: LinkStyle = hasValidColor
      ? {
          color: link.link_style.color,
          width: hasValidWidth ? link.link_style.width : this.defaultSerialLinkStyle.width,
          type: link.link_style.type !== undefined ? link.link_style.type : this.defaultSerialLinkStyle.type,
        }
      : {
          color: this.defaultSerialLinkStyle.color,
          width: hasValidWidth ? link.link_style.width : this.defaultSerialLinkStyle.width,
          type: link.link_style?.type !== undefined ? link.link_style.type : this.defaultSerialLinkStyle.type,
        };

    return new SerialLinkPath([source.x, source.y], angle_source, angle_target, [target.x, target.y], style);
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
      .on('contextmenu', (event: any, datum) => {
        let link: MapLink = datum as unknown as MapLink;
        const evt = event;
        const link = this.resolveContextMenuLink(arg1, arg2);
        if (!link) {
          return;
        }
        this.onContextMenu.emit(new LinkContextMenu(evt, link));
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
      .attr('stroke-opacity', (datum) => {
        return datum.style.type === 0 ? 0 : 1;
      })
      .attr('pointer-events', (datum) => {
        return datum.style.type === 0 ? 'stroke' : null;
      })
      .attr('d', (serial) => {
        if (serial.useLegacySerialPattern) {
          return this.getLegacySerialPath(serial.source, serial.target);
        }

        return StyleTranslator.getLinkPath(serial.source, serial.target, serial.style, {
          bezierVariation: serial.bezierVariation,
          sourceOrientation: serial.sourceOrientation,
          targetOrientation: serial.targetOrientation,
          flowchartDistance:
            typeof serial.link.distance === 'number' && !Number.isNaN(serial.link.distance)
              ? serial.link.distance
              : 0,
        });
      });
  }
}
