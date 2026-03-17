import { Injectable } from '@angular/core';
import { MultiLinkCalculatorHelper } from '../helpers/multi-link-calculator-helper';
import { Layer } from '../models/layer';
import { MapLink } from '../models/map/map-link';
import { SVGSelection } from '../models/types';
import { LinkWidget } from './link';
import { Widget } from './widget';

@Injectable()
export class LinksWidget implements Widget {
  constructor(private multiLinkCalculatorHelper: MultiLinkCalculatorHelper, private linkWidget: LinkWidget) {}

  public redrawLink(view: SVGSelection, link: MapLink) {
    const selection = this.selectLink(view, link);

    selection.each((existingLink: MapLink) => {
      this.mergeDefinedFields(existingLink, link);
      if (link.link_style) {
        existingLink.link_style = {
          ...(existingLink.link_style || {}),
          ...link.link_style,
        };
      }
    });

    this.linkWidget.draw(selection);
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

  private mergeDefinedFields(target: MapLink, source: MapLink) {
    if (!target || !source) {
      return;
    }

    Object.keys(source).forEach((key) => {
      const value = source[key];
      if (value !== undefined && key !== 'link_style') {
        target[key] = value;
      }
    });
  }
}
