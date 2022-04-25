import { EventEmitter, Injectable } from '@angular/core';
import { path } from 'd3-path';
import { LinkContextMenu } from '../../events/event-source';
import { MapLink } from '../../models/map/map-link';
import { SVGSelection } from '../../models/types';
import { Widget } from '../widget';
import { LinkStyle } from '../../../models/link-style';
import { StyleTranslator} from './style-translator';

class SerialLinkPath {
  constructor(
    public source: [number, number],
    public source_angle: [number, number],
    public target_angle: [number, number],
    public target: [number, number],
    public style: LinkStyle
  ) {}
}

@Injectable()
export class SerialLinkWidget implements Widget {
  public onContextMenu = new EventEmitter<LinkContextMenu>();
  private defaultSerialLinkStyle : LinkStyle = {
    color: "#B22222",
    width: 2,
    type: 0
  };

  constructor() {}

  private linkToSerialLink(link: MapLink) {
    const source = {
      x: link.source.x + link.source.width / 2,
      y: link.source.y + link.source.height / 2,
    };
    const target = {
      x: link.target.x + link.target.width / 2,
      y: link.target.y + link.target.height / 2,
    };

    const dx = target.x - source.x;
    const dy = target.y - source.y;

    const vector_angle = Math.atan2(dy, dx);
    const rot_angle = -Math.PI / 4.0;
    const vect_rot = [Math.cos(vector_angle + rot_angle), Math.sin(vector_angle + rot_angle)];

    const angle_source: [number, number] = [
      source.x + dx / 2.0 + 15 * vect_rot[0],
      source.y + dy / 2.0 + 15 * vect_rot[1],
    ];

    const angle_target: [number, number] = [
      target.x - dx / 2.0 - 15 * vect_rot[0],
      target.y - dy / 2.0 - 15 * vect_rot[1],
    ];

    return new SerialLinkPath(
      [source.x, source.y], 
      angle_source, 
      angle_target, 
      [target.x, target.y], 
      link.link_style.color ? link.link_style : this.defaultSerialLinkStyle);
  }

  public draw(view: SVGSelection) {
    const link = view.selectAll<SVGPathElement, SerialLinkPath>('path.serial_link').data((l) => {
      if (l.linkType === 'serial') {
        return [this.linkToSerialLink(l)];
      }
      return [];
    });

    const link_enter = link
      .enter()
      .append<SVGPathElement>('path')
      .attr('class', 'serial_link')
      .on('contextmenu', (datum) => {
        let link: MapLink = (datum as unknown) as MapLink;
        const evt = event;
        this.onContextMenu.emit(new LinkContextMenu(evt, link));
      });

    link_enter
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

    link_merge.attr('d', (serial) => {
      const line_generator = path();
      line_generator.moveTo(serial.source[0], serial.source[1]);
      line_generator.lineTo(serial.source_angle[0], serial.source_angle[1]);
      line_generator.lineTo(serial.target_angle[0], serial.target_angle[1]);
      line_generator.lineTo(serial.target[0], serial.target[1]);
      return line_generator.toString();
    });
  }
}
