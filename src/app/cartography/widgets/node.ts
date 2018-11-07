import { Injectable, EventEmitter } from "@angular/core";

import { Widget } from "./widget";
import { SVGSelection } from "../models/types";
import { Node } from "../models/node";
import { NodeContextMenu, NodeClicked, NodeDragged, NodeDragging } from "../events/nodes";
import { CssFixer } from "../helpers/css-fixer";
import { FontFixer } from "../helpers/font-fixer";
import { select, event } from "d3-selection";
import { Symbol } from "../../models/symbol";
import { D3DragEvent, drag } from "d3-drag";


@Injectable()
export class NodeWidget implements Widget {
  static NODE_LABEL_MARGIN = 3;

  public onContextMenu = new EventEmitter<NodeContextMenu>();
  public onNodeClicked = new EventEmitter<NodeClicked>();
  public onNodeDragged = new EventEmitter<NodeDragged>();
  public onNodeDragging = new EventEmitter<NodeDragging>();

  private symbols: Symbol[] = [];
  private draggingEnabled = false;

  constructor(
    private cssFixer: CssFixer,
    private fontFixer: FontFixer,
  ) {}

  public setSymbols(symbols: Symbol[]) {
    this.symbols = symbols;
  }

  public setDraggingEnabled(enabled: boolean) {
    this.draggingEnabled = enabled;
  }
  
  public draw(view: SVGSelection) {
    const self = this;

    const node_body = view.selectAll<SVGGElement, Node>("g.node_body")
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
        .classed('selected', (n: Node) => n.is_selected)
        .on("contextmenu", function (n: Node, i: number) {
          event.preventDefault();
          self.onContextMenu.emit(new NodeContextMenu(event, n));
        })
        .on('click', (n: Node) => {
          this.onNodeClicked.emit(new NodeClicked(event, n));
        });

    // update image of node
    node_body_merge
        .select<SVGImageElement>('image')
          .attr('xnode:href', (n: Node) => {
            const symbol = this.symbols.find((s: Symbol) => s.symbol_id === n.symbol);
            if (symbol) {
              return 'data:image/svg+xml;base64,' + btoa(symbol.raw);
            }
            // @todo; we need to have default image
            return 'data:image/svg+xml;base64,none';
          })
          .attr('width', (n: Node) => n.width)
          .attr('height', (n: Node) => n.height)
          .attr('x', (n: Node) => 0)
          .attr('y', (n: Node) => 0)
          .on('mouseover', function (this, n: Node) {
            select(this).attr("class", "over");
          })
          .on('mouseout', function (this, n: Node) {
            select(this).attr("class", "");
          });

    node_body_merge
      .attr('transform', (n: Node) => {
        return `translate(${n.x},${n.y})`;
      });
  
    node_body_merge
      .select<SVGTextElement>('text.label')
        // .attr('y', (n: Node) => n.label.y - n.height / 2. + 10)  // @todo: server computes y in auto way
        .attr('style', (n: Node) => {
          let styles = this.cssFixer.fix(n.label.style);
          styles = this.fontFixer.fixStyles(styles);
          return styles;
        })
        .text((n: Node) => n.label.text)
        .attr('x', function (this: SVGTextElement, n: Node) {
          if (n.label.x === null) {
            // center
            const bbox = this.getBBox();
            return -bbox.width / 2.;
          }
          return n.label.x + NodeWidget.NODE_LABEL_MARGIN;
        })
        .attr('y', function (this: SVGTextElement, n: Node) {
          let bbox = this.getBBox();

          if (n.label.x === null) {
            // center
            bbox = this.getBBox();
            return - n.height / 2. - bbox.height ;
          }
          return n.label.y + bbox.height - NodeWidget.NODE_LABEL_MARGIN;
        });
  
    const callback = function (this: SVGGElement, n: Node) {
      const e: D3DragEvent<SVGGElement, Node, Node> = event;
      self.onNodeDragging.emit(new NodeDragging(e, n));
    };

    const dragging = () => {
      return drag<SVGGElement, Node>()
        .on('drag', callback)
        .on('end', (n: Node) => {
          const e: D3DragEvent<SVGGElement, Node, Node> = event;
          self.onNodeDragged.emit(new NodeDragged(e, n));
        });
    };

    if (this.draggingEnabled) {
      node_body_merge.call(dragging());
    }
  }
}
