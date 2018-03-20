import {Widget} from "./widget";
import {SVGSelection} from "../../../map/models/types";

import { line } from "d3-shape";
import {Link} from "../models/link";

export class EthernetLinkWidget implements Widget {

  public draw(view: SVGSelection, link: Link) {
      const link_data = [[
        [link.source.x, link.source.y],
        [link.target.x, link.target.y]
      ]];

      const value_line = line();

      let link_path = view.select<SVGPathElement>('path');

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
