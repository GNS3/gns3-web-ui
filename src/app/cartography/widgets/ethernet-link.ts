import { line } from "d3-shape";

import { Widget } from "./widget";
import { SVGSelection } from "../models/types";
import { Link } from "../../models/link";


export class EthernetLinkWidget implements Widget {

  public draw(view: SVGSelection, link: Link) {

      const link_data = [[
        [link.source.x + link.source.width / 2., link.source.y + link.source.height / 2.],
        [link.target.x + link.target.width / 2., link.target.y + link.target.height / 2.]
      ]];

      const value_line = line();

      let link_path = view.select<SVGPathElement>('path');
      link_path.classed('selected', (l: Link) => l.is_selected);

      if (!link_path.node()) {
        link_path = view.append<SVGPathElement>('path');
      }

      const link_path_data = link_path.data(link_data);

      link_path_data
        .attr('d', value_line)
        .attr('stroke', '#000')
        .attr('stroke-width', '2');

  }

}
