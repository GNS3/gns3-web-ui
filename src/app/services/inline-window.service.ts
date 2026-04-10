import { Injectable } from '@angular/core';
import { Link } from '@models/link';
import { Controller } from '@models/controller';
import { XpraConsoleService } from './xpra-console.service';

/**
 * Interface for inline window state
 */
export interface InlineWindowState {
  linkId: string;
  url: string;
  size: { width: number; height: number };
  position: { x: number; y: number };
  isOpen: boolean;
  element?: HTMLElement;
}

/**
 * Service for managing inline windows in the GNS3 canvas
 */
@Injectable({
  providedIn: 'root',
})
export class InlineWindowService {
  private windows = new Map<string, InlineWindowState>();
  private nextId = 1;

  constructor(private xpraConsoleService: XpraConsoleService) {}

  /**
   * Open an inline Web Wireshark window for a link
   *
   * @param link Link to capture
   * @param controller GNS3 controller
   * @param targetElement Target DOM element to attach the window
   * @returns Window ID for managing the window
   */
  openInlineWebWireshark(
    link: Link,
    controller: Controller,
    targetElement: HTMLElement
  ): string {
    const windowId = `inline-wireshark-${this.nextId++}`;
    const wsUrl = this.xpraConsoleService.buildXpraWebSocketUrlForWebWireshark(controller, link);
    const pageUrl = this.xpraConsoleService.buildXpraConsolePageUrl(wsUrl);

    const state: InlineWindowState = {
      linkId: link.link_id,
      url: pageUrl,
      size: { width: 800, height: 600 },
      position: { x: 0, y: 0 },
      isOpen: true,
    };

    this.windows.set(windowId, state);
    this.createInlineWindow(windowId, state, targetElement);

    return windowId;
  }

  /**
   * Close an inline window
   *
   * @param windowId Window ID to close
   */
  closeInlineWindow(windowId: string): void {
    const state = this.windows.get(windowId);
    if (!state) return;

    if (state.element) {
      state.element.remove();
    }

    state.isOpen = false;
    this.windows.delete(windowId);
  }

  /**
   * Get window state
   *
   * @param windowId Window ID
   * @returns Window state or undefined
   */
  getWindowState(windowId: string): InlineWindowState | undefined {
    return this.windows.get(windowId);
  }

  /**
   * Get all open windows
   *
   * @returns Map of window ID to window state
   */
  getAllWindows(): Map<string, InlineWindowState> {
    return new Map(this.windows);
  }

  /**
   * Check if a link has an open inline window
   *
   * @param linkId Link ID to check
   * @returns true if link has an open inline window
   */
  hasOpenWindowForLink(linkId: string): boolean {
    for (const [id, state] of this.windows) {
      if (state.linkId === linkId && state.isOpen) {
        return true;
      }
    }
    return false;
  }

  /**
   * Close all windows for a specific link
   *
   * @param linkId Link ID
   */
  closeWindowsForLink(linkId: string): void {
    const toClose: string[] = [];
    for (const [id, state] of this.windows) {
      if (state.linkId === linkId) {
        toClose.push(id);
      }
    }
    toClose.forEach((id) => this.closeInlineWindow(id));
  }

  /**
   * Create the inline window DOM element
   *
   * @param windowId Window ID
   * @param state Window state
   * @param targetElement Target SVG element
   */
  private createInlineWindow(
    windowId: string,
    state: InlineWindowState,
    targetElement: HTMLElement
  ): void {
    // Get SVG namespace
    const svgNamespace = 'http://www.w3.org/2000/svg';
    const xlinkNamespace = 'http://www.w3.org/1999/xlink';

    // Create foreignObject for embedding HTML in SVG
    const foreignObject = document.createElementNS(svgNamespace, 'foreignObject');
    foreignObject.setAttribute('id', windowId);
    foreignObject.setAttribute('class', 'web-wireshark-inline-foreign-object');
    foreignObject.setAttribute('x', '0');
    foreignObject.setAttribute('y', '0');
    foreignObject.setAttribute('width', state.size.width.toString());
    foreignObject.setAttribute('height', state.size.height.toString());
    foreignObject.style.position = 'absolute';
    foreignObject.style.zIndex = '1000';

    // Create HTML container div
    const container = document.createElement('div');
    container.className = 'web-wireshark-inline-html-container';
    container.style.width = state.size.width + 'px';
    container.style.height = state.size.height + 'px';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.position = 'relative';
    container.style.overflow = 'hidden';

    // Create header
    const header = document.createElement('div');
    header.className = 'web-wireshark-inline-header';
    header.style.flexShrink = '0';
    header.innerHTML = `
      <span class="window-title">Web Wireshark</span>
      <button class="close-button" data-window-id="${windowId}">×</button>
    `;

    // Create iframe container
    const iframeContainer = document.createElement('div');
    iframeContainer.className = 'web-wireshark-inline-iframe-container';
    iframeContainer.style.flex = '1';
    iframeContainer.style.position = 'relative';
    iframeContainer.style.overflow = 'hidden';
    iframeContainer.style.minHeight = '400px';

    // Create iframe
    const iframe = document.createElement('iframe');
    iframe.src = state.url;
    iframe.className = 'web-wireshark-inline-iframe';
    iframe.setAttribute('allowfullscreen', '');
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.border = 'none';
    iframe.style.display = 'block';

    // Assemble
    iframeContainer.appendChild(iframe);
    container.appendChild(header);
    container.appendChild(iframeContainer);

    // Add close button handler
    const closeButton = header.querySelector('.close-button') as HTMLElement;
    if (closeButton) {
      closeButton.addEventListener('click', () => {
        this.closeInlineWindow(windowId);
      });
    }

    // Append container to foreignObject
    foreignObject.appendChild(container);

    // Append foreignObject to SVG
    targetElement.appendChild(foreignObject);

    // Store element reference
    state.element = foreignObject;

    // Log for debugging
    console.log('[InlineWindow] Created window:', windowId, {
      x: state.position.x,
      y: state.position.y,
      width: state.size.width,
      height: state.size.height,
      svgElement: targetElement.tagName
    });
  }
}
