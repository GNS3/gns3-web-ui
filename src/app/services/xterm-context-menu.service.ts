import { Injectable } from '@angular/core';
import { Terminal } from 'xterm';

/**
 * Service to manage xterm.js context menu
 * Provides copy/paste functionality with proper cleanup
 */
@Injectable({
  providedIn: 'root',
})
export class XtermContextMenuService {
  /**
   * Attach context menu to a terminal element
   * @returns Cleanup function to remove event listeners
   */
  attachContextMenu(terminal: Terminal, terminalElement: HTMLElement): () => void {
    const contextMenuHandler = (event: MouseEvent) => {
      event.preventDefault();
      this.showContextMenu(event, terminal);
    };

    terminalElement.addEventListener('contextmenu', contextMenuHandler);

    // Return cleanup function
    return () => {
      terminalElement.removeEventListener('contextmenu', contextMenuHandler);
    };
  }

  /**
   * Show context menu at mouse position
   * Theme styles are handled automatically via MD3 CSS variables
   */
  private showContextMenu(event: MouseEvent, terminal: Terminal): void {
    const selection = terminal.getSelection();
    const hasSelection = selection && selection.length > 0;

    // Create context menu
    const contextMenu = document.createElement('div');
    contextMenu.className = 'xterm-context-menu';

    // Calculate position to prevent overflow
    const { left, top } = this.calculateMenuPosition(event, 200, 150);
    contextMenu.style.left = `${left}px`;
    contextMenu.style.top = `${top}px`;
    contextMenu.style.position = 'absolute';
    contextMenu.style.zIndex = '10000';

    // Create menu items
    this.createMenuItems(contextMenu, terminal, hasSelection);

    // Add to document
    document.body.appendChild(contextMenu);

    // Setup cleanup handlers
    this.setupMenuCleanup(contextMenu, terminal);
  }

  /**
   * Calculate menu position to prevent viewport overflow
   */
  private calculateMenuPosition(
    event: MouseEvent,
    menuWidth: number,
    menuHeight: number
  ): { left: number; top: number } {
    let left = event.clientX;
    let top = event.clientY;

    // Prevent horizontal overflow
    if (left + menuWidth > window.innerWidth) {
      left = window.innerWidth - menuWidth - 10;
    }

    // Prevent vertical overflow
    if (top + menuHeight > window.innerHeight) {
      top = window.innerHeight - menuHeight - 10;
    }

    // Ensure menu doesn't go off screen
    left = Math.max(10, left);
    top = Math.max(10, top);

    return { left, top };
  }

  /**
   * Create menu items based on selection state
   */
  private createMenuItems(menu: HTMLElement, terminal: Terminal, hasSelection: boolean): void {
    // Copy menu item
    if (hasSelection) {
      const copyItem = this.createMenuItem('Copy', () => {
        const selection = terminal.getSelection();
        if (selection) {
          navigator.clipboard
            .writeText(selection)
            .then(() => {
              // Successfully copied
            })
            .catch((err) => {
              console.error('Failed to copy:', err);
            });
        }
      });
      menu.appendChild(copyItem);
    }

    // Paste menu item
    const pasteItem = this.createMenuItem('Paste', () => {
      navigator.clipboard
        .readText()
        .then((text) => {
          terminal.paste(text);
        })
        .catch((err) => {
          console.error('Failed to paste:', err);
        });
    });
    menu.appendChild(pasteItem);

    // Select all menu item
    const selectAllItem = this.createMenuItem('Select All', () => {
      terminal.selectAll();
    });
    menu.appendChild(selectAllItem);

    // Clear selection menu item
    if (hasSelection) {
      const clearSelectionItem = this.createMenuItem('Clear Selection', () => {
        terminal.clearSelection();
      });
      menu.appendChild(clearSelectionItem);
    }
  }

  /**
   * Create a single menu item
   */
  private createMenuItem(text: string, onClick: () => void): HTMLElement {
    const item = document.createElement('div');
    item.className = 'xterm-context-menu-item';
    item.textContent = text;
    item.setAttribute('role', 'menuitem');
    item.setAttribute('tabindex', '0');

    item.addEventListener('click', () => {
      onClick();
      // Remove menu after action
      const menu = item.closest('.xterm-context-menu');
      if (menu) {
        menu.remove();
      }
    });

    // Add keyboard support
    item.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        item.click();
      }
    });

    return item;
  }

  /**
   * Setup menu cleanup handlers (click outside, Escape key)
   */
  private setupMenuCleanup(menu: HTMLElement, terminal: Terminal): void {
    // Remove menu on click outside
    const removeMenu = (e: MouseEvent) => {
      if (!menu.contains(e.target as Node)) {
        menu.remove();
        document.removeEventListener('click', removeMenu);
        document.removeEventListener('keydown', handleEscape);
        terminal.focus();
      }
    };

    // Remove menu on Escape key
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        menu.remove();
        document.removeEventListener('click', removeMenu);
        document.removeEventListener('keydown', handleEscape);
        terminal.focus();
      }
    };

    // Delay event listener attachment to prevent immediate trigger
    setTimeout(() => {
      document.addEventListener('click', removeMenu);
      document.addEventListener('keydown', handleEscape);
    }, 0);
  }
}
