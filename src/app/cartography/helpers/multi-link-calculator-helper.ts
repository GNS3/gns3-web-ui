import {Link} from "../../models/link";
import { Injectable } from "@angular/core";

@Injectable()
export class MultiLinkCalculatorHelper {
  LINK_WIDTH = 2;

  public linkTranslation(
    distance: number,
    point0: {x: number, y: number},
    point1: {x: number, y: number}): {dx: number, dy: number} {

    const x1_x0 = point1.x - point0.x;
    const y1_y0 = point1.y - point0.y;
    let x2_x0;
    let y2_y0;

    if (y1_y0 === 0) {
      x2_x0 = 0;
      y2_y0 = distance;
    } else {
      const angle = Math.atan((x1_x0) / (y1_y0));
      x2_x0 = -distance * Math.cos(angle);
      y2_y0 = distance * Math.sin(angle);
    }
    return {
      dx: x2_x0,
      dy: y2_y0
    };
  }

  public assignDataToLinks(links: Link[]) {
    const links_from_nodes = {};
    links.forEach((l: Link, i: number) => {
      const sid = l.source.node_id;
      const tid = l.target.node_id;
      const key = (sid < tid ? sid + "," + tid : tid + "," + sid);
      let idx = 1;
      if (!(key in links_from_nodes)) {
        links_from_nodes[key] = [i];
      } else {
        idx = links_from_nodes[key].push(i);
      }
      l.distance =  (idx % 2 === 0 ? idx * this.LINK_WIDTH : (-idx + 1) * this.LINK_WIDTH);
    });
  }
}
