import { describe, it, expect, vi } from 'vitest';
import { ResizeEvent } from 'angular-resizable-element';
import { FloatingWindowChrome } from './floating-window-chrome';

/**
 * Plain-class tests (no TestBed): the chrome drives document/window listeners
 * directly, and jsdom dispatches the same events.
 */

const makeChrome = (): FloatingWindowChrome =>
  new FloatingWindowChrome({
    minWidth: 560,
    minHeight: 400,
    defaultRect: { left: 100, top: 100, width: 700, height: 500 },
  });

/** A header mousedown at (x, y) — target null skips the button guard. */
const pointerDown = (x: number, y: number): MouseEvent =>
  ({ clientX: x, clientY: y, preventDefault: vi.fn(), target: null }) as unknown as MouseEvent;

const pointerMove = (x: number, y: number): void => {
  document.dispatchEvent(new MouseEvent('mousemove', { clientX: x, clientY: y }));
};

describe('FloatingWindowChrome (drag gesture cleanup)', () => {
  it('applies the drag while moving and stops after mouseup', () => {
    const chrome = makeChrome();
    chrome.beginDrag(pointerDown(200, 200));
    expect(chrome.dragging()).toBe(true);
    pointerMove(260, 230);
    expect(chrome.left()).toBe(160);
    expect(chrome.top()).toBe(130);

    document.dispatchEvent(new MouseEvent('mouseup'));
    expect(chrome.dragging()).toBe(false);
    pointerMove(500, 500);
    expect(chrome.left()).toBe(160); // gesture over: no further movement
  });

  it('ends the drag when the window loses focus (Alt-Tab, OS dialog)', () => {
    const chrome = makeChrome();
    chrome.beginDrag(pointerDown(200, 200));
    pointerMove(260, 230);
    expect(chrome.left()).toBe(160);

    window.dispatchEvent(new Event('blur'));

    expect(chrome.dragging()).toBe(false);
    pointerMove(500, 500);
    expect(chrome.left()).toBe(160); // listener removed: the window stays put
    expect(chrome.top()).toBe(130);
  });

  it('ends the drag on pointercancel (touch/pen takeover)', () => {
    const chrome = makeChrome();
    chrome.beginDrag(pointerDown(200, 200));
    pointerMove(280, 240);
    expect(chrome.left()).toBe(180);

    document.dispatchEvent(new Event('pointercancel'));

    expect(chrome.dragging()).toBe(false);
    pointerMove(600, 600);
    expect(chrome.left()).toBe(180);
  });
});

describe('FloatingWindowChrome (resize gesture end)', () => {
  it('a gesture that never changed the size does not latch userResized', () => {
    // mwlResizable also ends a gesture that never moved (a bare handle
    // click, rectangle = the starting rect). Latching userResized there would
    // permanently kill a content-fit window's auto-height on a stray click.
    const chrome = makeChrome();
    chrome.onResizeStart();
    chrome.onResizeEnd({ rectangle: { left: 100, top: 100, width: 700, height: 500 } } as ResizeEvent);
    expect(chrome.userResized()).toBe(false);
    expect(chrome.resizing()).toBe(false);
  });

  it('a real size change still latches userResized', () => {
    const chrome = makeChrome();
    chrome.onResizeStart();
    chrome.onResizeEnd({ rectangle: { left: 100, top: 100, width: 700, height: 460 } } as ResizeEvent);
    expect(chrome.userResized()).toBe(true);
  });
});
