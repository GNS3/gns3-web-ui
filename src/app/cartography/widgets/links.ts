import { Injectable } from '@angular/core';

import { Widget } from './widget';
import { SVGSelection } from '../models/types';
import { MultiLinkCalculatorHelper } from '../helpers/multi-link-calculator-helper';
import { Layer } from '../models/layer';
import { LinkWidget } from './link';
import { MapLink } from '../models/map/map-link';

@Injectable()
export class LinksWidget implements Widget {
  constructor(private multiLinkCalculatorHelper: MultiLinkCalculatorHelper, private linkWidget: LinkWidget) {}

  public redrawLink(view: SVGSelection, link: MapLink) {
    this.linkWidget.draw(this.selectLink(view, link));
  }

  public draw(view: SVGSelection) {
    const link = view.selectAll<SVGGElement, MapLink>('g.link').data(
      (layer: Layer) => {
        if (layer.links) {
          const layer_links = layer.links.filter((l: MapLink) => {
            return l.target && l.source;
          });
          this.multiLinkCalculatorHelper.assignDataToLinks(layer_links);
          return layer_links;
        }
        return [];
      },
      (l: MapLink) => {
        return l.id;
      }
    );

    const link_enter = link
      .enter()
      .append<SVGGElement>('g')
      .attr('class', 'link')
      .attr('link_id', (l: MapLink) => l.id)
      .attr('map-source', (l: MapLink) => l.source.id)
      .attr('map-target', (l: MapLink) => l.target.id);

    const merge = link.merge(link_enter);

    this.linkWidget.draw(merge);

    link.exit().remove();
  }

  private selectLink(view: SVGSelection, link: MapLink) {
    return view.selectAll<SVGGElement, MapLink>(`g.link[link_id="${link.id}"]`);
  }
}
