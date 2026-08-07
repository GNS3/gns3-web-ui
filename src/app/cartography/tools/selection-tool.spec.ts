import { select } from 'd3-selection';
import { Subject } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SelectionEventSource } from '../events/selection-event-source';
import { Context } from '../models/context';
import { Rectangle } from '../models/rectangle';
import { SVGSelection } from '../models/types';
import { SelectionTool } from './selection-tool';

describe('SelectionTool context menu', () => {
  let svg: SVGSelection;
  let tool: SelectionTool;

  beforeEach(() => {
    const context = {
      transformation: { x: 0, y: 0, k: 1 },
      getZeroZeroTransformationPoint: () => ({ x: 0, y: 0 }),
    } as Context;
    const selectionEventSource = { selected: new Subject() } as SelectionEventSource;
    svg = select(document.createElementNS('http://www.w3.org/2000/svg', 'svg')) as SVGSelection;
    svg.append('g').attr('class', 'canvas');
    tool = new SelectionTool(context, selectionEventSource);
  });

  it('should emit only for an actual right-click while enabled', () => {
    const listener = vi.fn();
    tool.contextMenuOpened.subscribe(listener);
    tool.setEnabled(true);
    tool.draw(svg, null);

    const event = new MouseEvent('mousedown', { button: 2 });
    svg.node().dispatchEvent(event);

    expect(listener).toHaveBeenCalledOnce();
    expect(listener).toHaveBeenCalledWith(event);
  });

  it('should prevent the browser context menu while enabled', () => {
    tool.setEnabled(true);
    tool.draw(svg, null);
    const event = new MouseEvent('contextmenu', { cancelable: true });

    svg.node().dispatchEvent(event);

    expect(event.defaultPrevented).toBe(true);
  });

  it('should remove its mouse handlers when disabled', () => {
    const listener = vi.fn();
    tool.contextMenuOpened.subscribe(listener);
    tool.setEnabled(true);
    tool.draw(svg, null);
    tool.setEnabled(false);
    tool.draw(svg, null);

    const mouseDown = new MouseEvent('mousedown', { button: 2 });
    const contextMenu = new MouseEvent('contextmenu', { cancelable: true });
    svg.node().dispatchEvent(mouseDown);
    svg.node().dispatchEvent(contextMenu);

    expect(listener).not.toHaveBeenCalled();
    expect(contextMenu.defaultPrevented).toBe(false);
  });
});

describe('SelectionTool rubber-band rectangle', () => {
  /** Build a tool wired to a fake context + a capture Subject for emitted rects. */
  const makeTool = (k: number) => {
    const context = {
      transformation: { x: 0, y: 0, k },
      getZeroZeroTransformationPoint: () => ({ x: 0, y: 0 }),
    } as Context;
    const selected$ = new Subject<Rectangle>();
    const selectionEventSource = { selected: selected$ } as SelectionEventSource;
    const tool = new SelectionTool(context, selectionEventSource);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fire = (start: [number, number], end: [number, number]) =>
      (tool as any).selectedEvent(start, end);
    return { fire, selected$ };
  };

  it('divides the rectangle by zoom k so hit-testing uses canvas space', () => {
    const { fire, selected$ } = makeTool(2);
    const emitted: Rectangle[] = [];
    selected$.subscribe((r) => emitted.push(r));

    // start/end are what transformation() yields (screen minus pan, NOT /k);
    // with k=2 the emitted canvas-space rectangle must be halved.
    fire([0, 0], [200, 100]);

    expect(emitted).toHaveLength(1);
    expect(emitted[0]).toMatchObject({ x: 0, y: 0, width: 100, height: 50 });
  });

  it('keeps a 1:1 mapping when k is 1 (no zoom)', () => {
    const { fire, selected$ } = makeTool(1);
    const emitted: Rectangle[] = [];
    selected$.subscribe((r) => emitted.push(r));

    fire([10, 20], [110, 70]);

    expect(emitted[0]).toMatchObject({ x: 10, y: 20, width: 100, height: 50 });
  });

  it('does not emit when k is 0 (guards against NaN / divide-by-zero)', () => {
    const { fire, selected$ } = makeTool(0);
    const emitted: Rectangle[] = [];
    selected$.subscribe((r) => emitted.push(r));

    fire([0, 0], [100, 100]);
    expect(emitted).toHaveLength(0);
  });
});
