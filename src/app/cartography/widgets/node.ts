import { Injectable, EventEmitter } from "@angular/core";

import { Widget } from "./widget";
import { SVGSelection } from "../models/types";
import { NodeContextMenu, NodeClicked } from "../events/nodes";
import { CssFixer } from "../helpers/css-fixer";
import { FontFixer } from "../helpers/font-fixer";
import { select, event } from "d3-selection";
import { MapSymbol } from "../models/map/map-symbol";
import { MapNode } from "../models/map/map-node";
import { GraphDataManager } from "../managers/graph-data-manager";
import { SelectionManager } from "../managers/selection-manager";


@Injectable()
export class NodeWidget implements Widget {
  static NODE_LABEL_MARGIN = 3;

  public onContextMenu = new EventEmitter<NodeContextMenu>();
  public onNodeClicked = new EventEmitter<NodeClicked>();

  constructor(
    private cssFixer: CssFixer,
    private fontFixer: FontFixer,
    private graphDataManager: GraphDataManager,
    private selectionManager: SelectionManager
  ) {}

  public draw(view: SVGSelection) {
    const self = this;

    const node_body = view.selectAll<SVGGElement, MapNode>("g.node_body")
      .data((n) => [n]);

    const node_body_enter = node_body.enter()
      .append<SVGGElement>('g')
        .attr("class", "node_body");

    node_body_enter
        .append<SVGImageElement>('image');
  
      // add label of node
    node_body_enter
        .append<SVGTextElement>('text')
          .attr('class', 'label');

    const node_body_merge = node_body.merge(node_body_enter)
        .classed('selected', (n: MapNode) => this.selectionManager.isSelected(n))
        .on("contextmenu", function (n: MapNode, i: number) {
          event.preventDefault();
          self.onContextMenu.emit(new NodeContextMenu(event, n));
        })
        .on('click', (n: MapNode) => {
          this.onNodeClicked.emit(new NodeClicked(event, n));
        });

    // update image of node
    node_body_merge
        .select<SVGImageElement>('image')
          .attr('xnode:href', (n: MapNode) => {
            const symbol = this.graphDataManager.getSymbols().find((s: MapSymbol) => s.id === n.symbol);
            if (symbol) {
              return 'data:image/svg+xml;base64,' + btoa(symbol.raw);
            }
            // @todo; we need to have default image
            return 'data:image/svg+xml;base64,none';
          })
          .attr('width', (n: MapNode) => n.width)
          .attr('height', (n: MapNode) => n.height)
          .attr('x', (n: MapNode) => 0)
          .attr('y', (n: MapNode) => 0)
          .on('mouseover', function (this, n: MapNode) {
            select(this).attr("class", "over");
          })
          .on('mouseout', function (this, n: MapNode) {
            select(this).attr("class", "");
          });

    node_body_merge
      .attr('transform', (n: MapNode) => {
        return `translate(${n.x},${n.y})`;
      });
  
    node_body_merge
      .select<SVGTextElement>('text.label')
        // .attr('y', (n: Node) => n.label.y - n.height / 2. + 10)  // @todo: server computes y in auto way
        .attr('style', (n: MapNode) => {
          let styles = this.cssFixer.fix(n.label.style);
          styles = this.fontFixer.fixStyles(styles);
          return styles;
        })
        .text((n: MapNode) => n.label.text)
        .attr('x', function (this: SVGTextElement, n: MapNode) {
          if (n.label.x === null) {
            // center
            const bbox = this.getBBox();
            return -bbox.width / 2.;
          }
          return n.label.x + NodeWidget.NODE_LABEL_MARGIN;
        })
        .attr('y', function (this: SVGTextElement, n: MapNode) {
          let bbox = this.getBBox();

          if (n.label.x === null) {
            // center
            bbox = this.getBBox();
            return - n.height / 2. - bbox.height ;
          }
          return n.label.y + bbox.height - NodeWidget.NODE_LABEL_MARGIN;
        });
  }
}
