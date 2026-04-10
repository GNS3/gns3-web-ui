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
   * @param targetElement Target DOM element
   */
  private createInlineWindow(
    windowId: string,
    state: InlineWindowState,
    targetElement: HTMLElement
  ): void {
    // Create container div
    const container = document.createElement('div');
    container.id = windowId;
    container.className = 'web-wireshark-inline-container';
    container.style.width = `${state.size.width}px`;
    container.style.height = `${state.size.height}px`;
    container.style.position = 'absolute';
    container.style.left = `${state.position.x}px`;
    container.style.top = `${state.position.y}px`;
    container.style.zIndex = '1000';

    // Create header
    const header = document.createElement('div');
    header.className = 'web-wireshark-inline-header';
    header.innerHTML = `
      <span class="window-title">Web Wireshark</span>
      <button class="close-button" data-window-id="${windowId}">×</button>
    `;

    // Create iframe container
    const iframeContainer = document.createElement('div');
    iframeContainer.className = 'web-wireshark-inline-iframe-container';

    // Create iframe
    const iframe = document.createElement('iframe');
    iframe.src = state.url;
    iframe.className = 'web-wireshark-inline-iframe';
    iframe.setAttribute('allowfullscreen', '');

    // Assemble
    iframeContainer.appendChild(iframe);
    container.appendChild(header);
    container.appendChild(iframeContainer);

    // Add close button handler
    const closeButton = header.querySelector('.close-button') as HTMLElement;
    closeButton.addEventListener('click', () => {
      this.closeInlineWindow(windowId);
    });

    // Store element reference
    state.element = container;

    // Append to target
    targetElement.appendChild(container);
  }
}
