import {SelectionTool} from "./selection-tool";
import {select} from "d3-selection";
import {Context} from "../../../map/models/context";
import {SVGSelection} from "../../../map/models/types";
import {Node} from "../models/node.model";


class OnSelectedListenerMock {
  public constructor(public nodes: Node[] = []) {}

  public listen(nodes: Node[]) {
    this.nodes = nodes;
  }
}

describe('SelectionTool', () => {
  let tool: SelectionTool;
  let svg: SVGSelection;
  let context: Context;
  let selection_line_tool: SVGSelection;
  let path_selection: SVGSelection;
  let selected_nodes: Node[];

  beforeEach(() => {
    tool = new SelectionTool();

    tool.selectedSubject.subscribe((nodes: Node[]) => {
      selected_nodes = nodes;
    });

    svg = select('body')
        .append<SVGSVGElement>('svg')
        .attr('width', 1000)
        .attr('height', 1000);

    const node_1 = new Node();
    node_1.name = "Node 1";
    node_1.x = 150;
    node_1.y = 150;

    const node_2 = new Node();
    node_2.name = "Node 2";
    node_2.x = 300;
    node_2.y = 300;

    svg.selectAll<SVGGElement, any>('g.node')
        .data([node_1, node_2], (n: Node) => {
          return n.node_id;
        })
      .enter()
        .append<SVGGElement>('g')
        .attr('class', 'node selectable');


    svg.append<SVGGElement>('g').attr('class', 'canvas');

    context = new Context();

    tool.connect(svg, context);
    tool.draw(svg, context);
    tool.activate();

    selection_line_tool = svg.select('g.selection-line-tool');
    path_selection = selection_line_tool.select('path.selection');
  });

  it('creates selection-line-tool container with path', () => {
    expect(selection_line_tool.node()).not.toBeNull();
    expect(selection_line_tool.select('path')).not.toBeNull();
    expect(path_selection.attr('visibility')).toEqual('hidden');
  });

  describe('SelectionTool can handle start of selection', () => {
    beforeEach(() => {
      svg.node().dispatchEvent(new MouseEvent('mousedown', {clientX: 100, clientY: 100}));
    });

    it('path should be visible and have parameters', () => {
        expect(path_selection.attr('visibility')).toEqual('visible');
        expect(path_selection.attr('d')).toEqual('M95,86 l0,0 l0,0 l0,0z');
    });
  });

  describe('SelectionTool can handle move of selection', () => {
    beforeEach(() => {
      svg.node().dispatchEvent(new MouseEvent('mousedown', {clientX: 100, clientY: 100}));
      window.dispatchEvent(new MouseEvent('mousemove', {clientX: 300, clientY: 300}));
    });

    it('path should have got changed parameters', () => {
        expect(path_selection.attr('d')).toEqual('M95,86 l200,0 l0,200 l-200,0z');
    });
  });

  describe('SelectionTool can handle end of selection', () => {
    beforeEach(() => {
      svg.node().dispatchEvent(new MouseEvent('mousedown', {clientX: 100, clientY: 100}));
      window.dispatchEvent(new MouseEvent('mousemove', {clientX: 200, clientY: 200}));
      window.dispatchEvent(new MouseEvent('mouseup', {clientX: 200, clientY: 200}));
    });

    it('path should be hidden', () => {
      expect(path_selection.attr('visibility')).toEqual('hidden');
    });

    it('node should be selected', () => {
      expect(svg.selectAll('.selected').size()).toEqual(1);
      expect(svg.select('.selected').datum().name).toEqual("Node 1");
    });

    it('selectedSubject should update nodes', () => {
      expect(selected_nodes.length).toEqual(1);
    });

    describe('SelectionTool can deselect after click outside', () => {
      beforeEach(() => {
        svg.node().dispatchEvent(new MouseEvent('mousedown', {clientX: 300, clientY: 300}));
        window.dispatchEvent(new MouseEvent('mouseup', {clientX: 300, clientY: 300}));
      });

      it('should have no selection', () => {
        expect(svg.selectAll('.selected').size()).toEqual(0);
      });

      it('selectedSubject should clear nodes', () => {
        expect(selected_nodes.length).toEqual(0);
      });
    });

  });

  describe('SelectionTool can handle end of selection in reverse direction', () => {
    beforeEach(() => {
      svg.node().dispatchEvent(new MouseEvent('mousedown', {clientX: 200, clientY: 200}));
      window.dispatchEvent(new MouseEvent('mousemove', {clientX: 100, clientY: 100}));
      window.dispatchEvent(new MouseEvent('mouseup', {clientX: 100, clientY: 100}));
    });

    it('node should be selected', () => {
        expect(svg.select('.selected').datum().name).toEqual("Node 1");
    });
  });

  describe('SelectionTool can be deactivated', () => {
    beforeEach(() => {
      tool.deactivate();
      svg.node().dispatchEvent(new MouseEvent('mousedown', {clientX: 100, clientY: 100}));
    });

    it('path should be still hiden', () => {
        expect(path_selection.attr('visibility')).toEqual('hidden');
    });
  });


});
