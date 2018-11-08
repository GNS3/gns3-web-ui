import { Injectable } from "@angular/core";

import { Widget } from "./widget";
import { SVGSelection } from "../models/types";
import { Link } from "../../models/link";
import { MultiLinkCalculatorHelper } from "../helpers/multi-link-calculator-helper";
import { Layer } from "../models/layer";
import { LinkWidget } from "./link";

@Injectable()
export class LinksWidget implements Widget {
  constructor(
    private multiLinkCalculatorHelper: MultiLinkCalculatorHelper,
    private linkWidget: LinkWidget
  ) {
  }

  public redrawLink(view: SVGSelection, link: Link) {
    this.linkWidget.draw(this.selectLink(view, link));
  }

  public draw(view: SVGSelection) {
    const link = view
      .selectAll<SVGGElement, Link>("g.link")
      .data((layer: Layer) => {
        if (layer.links) {
          const layer_links = layer.links.filter((l: Link) => {
              return l.target && l.source;
          });
          this.multiLinkCalculatorHelper.assignDataToLinks(layer_links);
          return layer_links;
        }
        return [];
      }, (l: Link) => {
        return l.link_id;
      });

    const link_enter = link.enter()
      .append<SVGGElement>('g')
        .attr('class', 'link')
        .attr('link_id', (l: Link) => l.link_id)
        .attr('map-source', (l: Link) => l.source.node_id)
        .attr('map-target', (l: Link) => l.target.node_id);

    const merge = link.merge(link_enter);

    this.linkWidget.draw(merge);

    link
      .exit()
        .remove();
  }

  private selectLink(view: SVGSelection, link: Link) {
    return view.selectAll<SVGGElement, Link>(`g.link[link_id="${link.link_id}"]`);
  }
}
