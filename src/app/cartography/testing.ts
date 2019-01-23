import { select, Selection } from 'd3-selection';

export class TestSVGCanvas {
  public svg: Selection<SVGSVGElement, any, HTMLElement, any>;
  public canvas: Selection<SVGGElement, any, HTMLElement, any>;

  constructor() {
    this.create();
  }

  public create() {
    this.svg = select('body')
      .append<SVGSVGElement>('svg')
      .attr('width', 1000)
      .attr('height', 1000);

    this.canvas = this.svg.append<SVGGElement>('g').attr('class', 'canvas');
  }

  public destroy() {
    select('body')
      .selectAll('svg')
      .remove();
  }
}
