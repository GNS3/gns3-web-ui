import { EventEmitter, Injectable } from '@angular/core';

import { select } from 'd3-selection';
import { Draggable } from '../events/draggable';
import { LabelContextMenu } from '../events/event-source';
import { CssFixer } from '../helpers/css-fixer';
import { FontFixer } from '../helpers/font-fixer';
import { MapSettingsManager } from '../managers/map-settings-manager';
import { SelectionManager } from '../managers/selection-manager';
import { TextElement } from '../models/drawings/text-element';
import { MapLabel } from '../models/map/map-label';
import { MapNode } from '../models/map/map-node';
import { SVGSelection } from '../models/types';
import { Widget } from './widget';

@Injectable()
export class LabelWidget implements Widget {

  constructor(
    private cssFixer: CssFixer,
    private fontFixer: FontFixer,
    private selectionManager: SelectionManager,
    private mapSettings: MapSettingsManager
  ) {}

  static NODE_LABEL_MARGIN = 3;
  public onContextMenu = new EventEmitter<LabelContextMenu>();
  public draggable = new Draggable<SVGGElement, MapLabel>();

  public redrawLabel(view: SVGSelection, label: MapLabel) {
    this.drawLabel(this.selectLabel(view, label));
  }

  public draw(view: SVGSelection) {
    const self = this;
    const label_view = view.selectAll<SVGGElement, MapLabel>('g.label_container').data((node: MapNode) => {
      return [node.label];
    });

    const label_enter = label_view
      .enter()
      .append<SVGGElement>('g')
      .attr('class', 'label_container')
      .attr('label_id', (label: MapLabel) => label.id);

    const merge = label_view
      .merge(label_enter)
      .on('contextmenu', (n: MapLabel, i: number) => {
        event.preventDefault();
        self.onContextMenu.emit(new LabelContextMenu(event, n));
      });

    this.drawLabel(merge);

    label_view.exit().remove();

    if (!this.mapSettings.isReadOnly) {
      this.draggable.call(label_view);
    }
  }

  private drawLabel(view: SVGSelection) {
    const label_body = view.selectAll<SVGGElement, MapLabel>('g.label_body').data(label => [label]);

    const label_body_enter = label_body
      .enter()
      .append<SVGGElement>('g')
      .attr('class', 'label_body');

    // add label of node
    label_body_enter.append<SVGTextElement>('text').attr('class', 'label');

    label_body_enter.append<SVGRectElement>('rect').attr('class', 'label_selection');

    const label_body_merge = label_body
      .merge(label_body_enter);

    label_body_merge
      .select<SVGTextElement>('text.label')
      .attr('label_id', (label: MapLabel) => label.id)
      .attr('style', (label: MapLabel) => {
        let styles = this.cssFixer.fix(label.style);
        styles = this.fontFixer.fixStyles(styles);
        return styles;
      })
      .text((label: MapLabel) => label.text)
      .attr('x', (label: MapLabel) => label.x)
      .attr('y', (label: MapLabel) => label.y)
      .attr('transform', (label: MapLabel) => {
        return `rotate(${label.rotation}, ${label.x}, ${label.y})`;
      });

    label_body_merge
      .select<SVGRectElement>('rect.label_selection')
      .attr('visibility', (l: MapLabel) => {
        return (this.selectionManager.isSelected(l) ? 'visible' : 'hidden');
      })
      .attr('stroke', 'black')
      .attr('stroke-dasharray', '3,3')
      .attr('stroke-width', '0.5')
      .attr('fill', 'none')
      .each(function(this: SVGRectElement, label: MapLabel) {
        const current = select(this);
        const textLabel = label_body_merge.select<SVGTextElement>(`text[label_id="${label.id}"]`);
        const bbox = textLabel.node().getBBox();
        const border = 2;

        current.attr('width', bbox.width + border * 2);
        current.attr('height', bbox.height + border * 2);
        current.attr('x', bbox.x - border);
        current.attr('y', bbox.y - border);
        current.attr('transform', `rotate(${label.rotation},  ${label.x}, ${label.y})`);
      });
  }

  private selectLabel(view: SVGSelection, label: MapLabel) {
    return view.selectAll<SVGGElement, MapLabel>(`g.label_container[label_id="${label.id}"]`);
  }
}
