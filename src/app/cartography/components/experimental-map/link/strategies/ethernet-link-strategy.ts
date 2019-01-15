import { LinkStrategy } from './link-strategy';
import { path } from 'd3-path';
import { MapLink } from '../../../../models/map/map-link';

export class EthernetLinkStrategy implements LinkStrategy {
  public d(link: MapLink): string {
    const points = [
      [link.source.x + link.source.width / 2, link.source.y + link.source.height / 2],
      [link.target.x + link.target.width / 2, link.target.y + link.target.height / 2]
    ];

    const line_generator = path();
    line_generator.moveTo(points[0][0], points[0][1]);
    line_generator.lineTo(points[1][0], points[1][1]);
    return line_generator.toString();
  }
}
