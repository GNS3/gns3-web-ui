import {SelectionTool} from "./selection-tool";
import {select} from "d3-selection";
import {Context} from "../../../map/models/context";
import {SVGSelection} from "../../../map/models/types";


describe('SelectionTool', () => {
  let tool: SelectionTool;
  let svg: SVGSelection;
  let context: Context;
  let selection_line_tool: SVGSelection;
  let path_selection: SVGSelection;

  beforeEach(() => {
    tool = new SelectionTool();

    svg = select('body')
        .append<SVGSVGElement>('svg')
        .attr('width', 1000)
        .attr('height', 1000);

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
      window.dispatchEvent(new MouseEvent('mousemove', {clientX: 300, clientY: 300}));
      window.dispatchEvent(new MouseEvent('mouseup', {clientX: 300, clientY: 300}));
    });

    it('path should be hidden', () => {
        expect(path_selection.attr('visibility')).toEqual('hidden');
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
