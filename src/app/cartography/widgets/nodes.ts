import { Injectable, EventEmitter } from "@angular/core";

import { event, select, Selection } from "d3-selection";
import { D3DragEvent, drag } from "d3-drag";

import { Widget } from "./widget";
import { Node } from "../models/node";
import { SVGSelection } from "../models/types";
import { Symbol } from "../../models/symbol";
import { Layer  } from "../models/layer";
import { CssFixer } from "../helpers/css-fixer";
import { FontFixer } from "../helpers/font-fixer";
import { NodeDragging, NodeDragged, NodeContextMenu, NodeClicked } from "../events/nodes";


@Injectable()
export class NodesWidget implements Widget {
  static NODE_LABEL_MARGIN = 3;

  private debug = false;
  private draggingEnabled = false;

  private symbols: Symbol[] = [];

  public onContextMenu = new EventEmitter<NodeContextMenu>();
  public onNodeClicked = new EventEmitter<NodeClicked>();
  public onNodeDragged = new EventEmitter<NodeDragged>();
  public onNodeDragging = new EventEmitter<NodeDragging>();

  constructor(
    private cssFixer: CssFixer,
    private fontFixer: FontFixer
  ) {
    this.symbols = [];
  }

  public setSymbols(symbols: Symbol[]) {
    this.symbols = symbols;
  }

  public setDraggingEnabled(enabled: boolean) {
    this.draggingEnabled = enabled;
  }

  public revise(selection: SVGSelection) {
    selection
      .attr('transform', (n: Node) => {
        return `translate(${n.x},${n.y})`;
      });

    selection
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
          return n.label.x + NodesWidget.NODE_LABEL_MARGIN;
        })
        .attr('y', function (this: SVGTextElement, n: Node) {
          let bbox = this.getBBox();

          if (n.label.x === null) {
            // center
            bbox = this.getBBox();
            return - n.height / 2. - bbox.height ;
          }
          return n.label.y + bbox.height - NodesWidget.NODE_LABEL_MARGIN;
        });

    selection
      .select<SVGTextElement>('text.node_point_label')
        .text((n: Node) => `(${n.x}, ${n.y})`);

  }

  public draw(view: SVGSelection, nodes?: Node[]) {
    const self = this;

    let nodes_selection: Selection<SVGGElement, Node, any, any> = view
      .selectAll<SVGGElement, Node>('g.node');

    if (nodes) {
      nodes_selection = nodes_selection.data(nodes);
    } else {
      nodes_selection = nodes_selection.data((l: Layer) => {
        return l.nodes;
      }, (n: Node) => {
        return n.node_id;
      });
    }

    const node_enter = nodes_selection
      .enter()
        .append<SVGGElement>('g')
        .attr('class', 'node');

    // add image to node
    node_enter
      .append<SVGImageElement>('image');

    // add label of node
    node_enter
      .append<SVGTextElement>('text')
        .attr('class', 'label');

    if (this.debug) {
      node_enter
        .append<SVGCircleElement>('circle')
          .attr('class', 'node_point')
          .attr('r', 2);

      node_enter
        .append<SVGTextElement>('text')
          .attr('class', 'node_point_label')
          .attr('x', '-100')
          .attr('y', '0');
    }

    const node_merge = nodes_selection
      .merge(node_enter)
        .classed('selected', (n: Node) => n.is_selected)
        .on("contextmenu", function (n: Node, i: number) {
          event.preventDefault();
          self.onContextMenu.emit(new NodeContextMenu(event, n));
        })
        .on('click', (n: Node) => {
          this.onNodeClicked.emit(new NodeClicked(event, n));
        });

    // update image of node
    node_merge
        .select<SVGImageElement>('image')
          .attr('xlink:href', (n: Node) => {
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

    this.revise(node_merge);

    const callback = function (this: SVGGElement, n: Node) {
      const e: D3DragEvent<SVGGElement, Node, Node> = event;

      n.x = e.x;
      n.y = e.y;

      self.revise(select(this));
      self.onNodeDragging.emit(new NodeDragging(event, n));
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
      node_merge.call(dragging());
    }

    nodes_selection
      .exit()
        .remove();
  }
}
