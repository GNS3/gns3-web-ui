import { path } from "d3-path";

import { Widget } from "./widget";
import { SVGSelection } from "../models/types";
import { Link } from "../models/link";


export class SerialLinkWidget implements Widget {

  public draw(view: SVGSelection, link: Link) {
      const dx = link.target.x - link.source.x;
      const dy = link.target.y - link.source.y;

      const vector_angle = Math.atan2(dy, dx);
      const rot_angle = -Math.PI / 4.0;
      const vect_rot = [
        Math.cos(vector_angle + rot_angle),
        Math.sin(vector_angle + rot_angle)
      ];

      const angle_source = [
        link.source.x + dx / 2.0 + 15 * vect_rot[0],
        link.source.y + dy / 2.0 + 15 * vect_rot[1]
      ];

      const angle_target = [
        link.target.x - dx / 2.0 - 15 * vect_rot[0],
        link.target.y - dy / 2.0 - 15 * vect_rot[1]
      ];

      const line_data = [
        [link.source.x, link.source.y],
        angle_source,
        angle_target,
        [link.target.x, link.target.y]
      ];

      let link_path = view.select<SVGPathElement>('path');

      if (!link_path.node()) {
        link_path = view.append<SVGPathElement>('path');
      }

      const line_generator = path();
      line_generator.moveTo(line_data[0][0], line_data[0][1]);
      line_generator.lineTo(line_data[1][0], line_data[1][1]);
      line_generator.lineTo(line_data[2][0], line_data[2][1]);
      line_generator.lineTo(line_data[3][0], line_data[3][1]);

     link_path
        .attr('d', line_generator.toString())
        .attr('stroke', '#B22222')
        .attr('fill', 'none')
        .attr('stroke-width', '2');

  }

}
