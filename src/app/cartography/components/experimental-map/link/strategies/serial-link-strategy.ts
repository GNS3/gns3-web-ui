import { path } from 'd3-path';
import { LinkStrategy } from './link-strategy';
import { MapLink } from '../../../../models/map/map-link';

export class SerialLinkStrategy implements LinkStrategy {
  private linkToPoints(link: MapLink) {
    const source = {
      x: link.source.x + link.source.width / 2,
      y: link.source.y + link.source.height / 2
    };
    const target = {
      x: link.target.x + link.target.width / 2,
      y: link.target.y + link.target.height / 2
    };

    const dx = target.x - source.x;
    const dy = target.y - source.y;

    const vector_angle = Math.atan2(dy, dx);
    const rot_angle = -Math.PI / 4.0;
    const vect_rot = [Math.cos(vector_angle + rot_angle), Math.sin(vector_angle + rot_angle)];

    const angle_source: [number, number] = [
      source.x + dx / 2.0 + 15 * vect_rot[0],
      source.y + dy / 2.0 + 15 * vect_rot[1]
    ];

    const angle_target: [number, number] = [
      target.x - dx / 2.0 - 15 * vect_rot[0],
      target.y - dy / 2.0 - 15 * vect_rot[1]
    ];

    return [[source.x, source.y], angle_source, angle_target, [target.x, target.y]];
  }

  d(link: MapLink): string {
    const points = this.linkToPoints(link);

    const line_generator = path();
    line_generator.moveTo(points[0][0], points[0][1]);
    line_generator.lineTo(points[1][0], points[1][1]);
    line_generator.lineTo(points[2][0], points[2][1]);
    line_generator.lineTo(points[3][0], points[3][1]);
    return line_generator.toString();
  }
}
