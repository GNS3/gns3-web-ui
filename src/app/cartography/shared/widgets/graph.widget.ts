import { Context } from "../models/context";
import { Node } from "../models/node";
import { Link } from "../models/link";
import { NodesWidget } from "./nodes.widget";
import { Widget } from "./widget";
import { SVGSelection } from "../models/types";
import { LinksWidget } from "./links.widget";
import { Drawing } from "../models/drawing";
import { DrawingsWidget } from "./drawings.widget";
import { DrawingLineWidget } from "./drawing-line.widget";
import {SelectionTool} from "../tools/selection-tool";
import {MovingTool} from "../tools/moving-tool";
import {LayersWidget} from "./layers.widget";
import {Layer} from "../models/layer";


export class GraphLayout implements Widget {
  private nodes: Node[] = [];
  private links: Link[] = [];
  private drawings: Drawing[] = [];

  private linksWidget: LinksWidget;
  private nodesWidget: NodesWidget;
  private drawingsWidget: DrawingsWidget;
  private drawingLineTool: DrawingLineWidget;
  private selectionTool: SelectionTool;
  private movingTool: MovingTool;
  private layersWidget: LayersWidget;

  private centerZeroZeroPoint = true;

  constructor() {
    this.linksWidget = new LinksWidget();
    this.nodesWidget = new NodesWidget();
    this.drawingsWidget = new DrawingsWidget();
    this.drawingLineTool = new DrawingLineWidget();
    this.selectionTool = new SelectionTool();
    this.movingTool = new MovingTool();
    this.layersWidget = new LayersWidget();
  }

  public setNodes(nodes: Node[]) {
    this.nodes = nodes;
  }

  public setLinks(links: Link[]) {
    this.links = links;
  }

  public setDrawings(drawings: Drawing[]) {
    this.drawings = drawings;
  }

  public getNodesWidget() {
    return this.nodesWidget;
  }

  public getLinksWidget() {
    return this.linksWidget;
  }

  public getDrawingsWidget() {
    return this.drawingsWidget;
  }

  public getDrawingLineTool() {
    return this.drawingLineTool;
  }

  public getMovingTool() {
    return this.movingTool;
  }

  public getSelectionTool() {
    return this.selectionTool;
  }

  connect(view: SVGSelection, context: Context) {
    this.drawingLineTool.connect(view, context);
    this.selectionTool.connect(view, context);
    this.movingTool.connect(view, context);

    this.selectionTool.activate();
  }

  draw(view: SVGSelection, context: Context) {
    const canvas = view
      .selectAll<SVGGElement, Context>('g.canvas')
      .data([context]);

    const canvasEnter = canvas.enter()
        .append<SVGGElement>('g')
        .attr('class', 'canvas');

    if (this.centerZeroZeroPoint) {
      canvas.attr(
        'transform',
        (ctx: Context) => `translate(${ctx.getSize().width / 2}, ${ctx.getSize().height / 2})`);
    }


    const layers = {};

    this.nodes.forEach((n: Node) => {
      const key = n.z.toString();
      if (!(key in layers)) {
        layers[key] = new Layer();
        layers[key].nodes = [];
        layers[key].drawings = [];
        layers[key].links = [];
      }
      layers[key].nodes.push(n);
    });


    this.drawings.forEach((d: Drawing) => {
      const key = d.z.toString();
      if (!(key in layers)) {
        layers[key] = new Layer();
        layers[key].nodes = [];
        layers[key].drawings = [];
        layers[key].links = [];
      }
      layers[key].drawings.push(d);
    });

    this.links.forEach((l: Link) => {
      if (!l.source || !l.target) {
        return;
      }

      const key = Math.min(l.source.z, l.target.z).toString();

      if (!(key in layers)) {
        layers[key] = new Layer();
        layers[key].nodes = [];
        layers[key].drawings = [];
        layers[key].links = [];
      }
      layers[key].links.push(l);
    });

    const layers_list: Layer[] = Object.keys(layers).sort((a: string, b: string) => {
      return Number(a) - Number(b);
    }).map((key: string) => {
      return layers[key];
    });

    this.layersWidget.graphLayout = this;
    this.layersWidget.draw(canvas, layers_list);

    this.drawingLineTool.draw(view, context);
    this.selectionTool.draw(view, context);
    this.movingTool.draw(view, context);
  }

  disconnect(view: SVGSelection) {
    if (view.empty && !view.empty()) {
      view.selectAll('*').remove();
    }
  }
}
