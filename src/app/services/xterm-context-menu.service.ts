import { Injectable, inject } from '@angular/core';
import { Terminal } from 'xterm';
import { ToasterService } from './toaster.service';

/**
 * Service to manage xterm.js context menu
 * Provides copy/paste functionality with proper cleanup
 */
@Injectable({
  providedIn: 'root',
})
export class XtermContextMenuService {
  private toaster = inject(ToasterService);
  private currentMenu: HTMLElement | null = null;

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
    // Remove any existing menu first to prevent duplicates
    this.dismissCurrentMenu();

    // Check for selection - use hasSelection() API if available, fallback to getSelection()
    let hasSelection = false;
    try {
      // Try using hasSelection() first (xterm.js 5.0+)
      if (typeof (terminal as any).hasSelection === 'function') {
        hasSelection = (terminal as any).hasSelection();
      } else {
        // Fallback to getSelection() for older versions
        const selection = terminal.getSelection();
        hasSelection = selection != null && selection.trim().length > 0;
      }
    } catch (e) {
      console.error('Error checking selection:', e);
      const selection = terminal.getSelection();
      hasSelection = selection != null && selection.trim().length > 0;
    }

    // Create context menu
    const contextMenu = document.createElement('div');
    contextMenu.className = 'xterm-context-menu';
    this.currentMenu = contextMenu;

    // Calculate position to prevent overflow
    const { left, top } = this.calculateMenuPosition(event);
    contextMenu.style.left = `${left}px`;
    contextMenu.style.top = `${top}px`;

    // Create menu items
    this.createMenuItems(contextMenu, terminal, hasSelection);

    // Add to document
    document.body.appendChild(contextMenu);

    // Setup cleanup handlers
    this.setupMenuCleanup(contextMenu, terminal);
  }

  /**
   * Dismiss the currently visible menu (if any)
   */
  private dismissCurrentMenu(): void {
    if (this.currentMenu && this.currentMenu.parentNode) {
      this.currentMenu.remove();
    }
    this.currentMenu = null;
  }

  /**
   * Calculate menu position to prevent viewport overflow
   */
  private calculateMenuPosition(event: MouseEvent): { left: number; top: number } {
    let left = event.clientX;
    let top = event.clientY;

    const estimatedWidth = 180;
    const estimatedHeight = 120;

    // Prevent horizontal overflow
    if (left + estimatedWidth > window.innerWidth) {
      left = window.innerWidth - estimatedWidth - 10;
    }

    // Prevent vertical overflow
    if (top + estimatedHeight > window.innerHeight) {
      top = window.innerHeight - estimatedHeight - 10;
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
    // Copy menu item (only show if there's a selection)
    if (hasSelection) {
      const copyItem = this.createMenuItem('Copy', 'Ctrl+Shift+C', () => {
        try {
          const selection = terminal.getSelection();
          if (selection) {
            navigator.clipboard
              .writeText(selection)
              .then(() => {
                this.toaster.success('Copied to clipboard');
                terminal.clearSelection();
              })
              .catch((err) => {
                console.error('Failed to copy:', err);
                if (err.name === 'NotAllowedError') {
                  this.toaster.error('Clipboard permission denied. Please allow clipboard access.');
                } else {
                  this.toaster.error('Failed to copy. Please try again.');
                }
              });
          }
        } catch (e) {
          console.error('Error copying:', e);
          this.toaster.error('Failed to copy. Please try again.');
        }
      });
      menu.appendChild(copyItem);
    }

    // Paste menu item (always show)
    const pasteItem = this.createMenuItem('Paste', 'Ctrl+Shift+V', () => {
      try {
        navigator.clipboard
          .readText()
          .then((text) => {
            if (text) {
              terminal.paste(text);
            } else {
              this.toaster.warning('Nothing to paste. Clipboard is empty.');
            }
          })
          .catch((err) => {
            console.error('Failed to paste:', err);
            if (err.name === 'NotAllowedError') {
              this.toaster.error('Clipboard permission denied. Please allow clipboard access.');
            } else {
              this.toaster.error('Failed to paste. Please try again.');
            }
          });
      } catch (e) {
        console.error('Error pasting:', e);
        this.toaster.error('Failed to paste. Please try again.');
      }
    });
    menu.appendChild(pasteItem);

    // Add separator before Select All
    const separator = document.createElement('div');
    separator.className = 'xterm-context-menu-separator';
    menu.appendChild(separator);

    // Select all menu item (always show)
    const selectAllItem = this.createMenuItem('Select All', '', () => {
      try {
        terminal.selectAll();
      } catch (e) {
        console.error('Error selecting all:', e);
      }
    });
    menu.appendChild(selectAllItem);

    // Clear selection menu item (only show if there's a selection)
    if (hasSelection) {
      const clearSelectionItem = this.createMenuItem('Clear Selection', '', () => {
        try {
          terminal.clearSelection();
        } catch (e) {
          console.error('Error clearing selection:', e);
        }
      });
      menu.appendChild(clearSelectionItem);
    }
  }

  /**
   * Create a single menu item
   */
  private createMenuItem(text: string, shortcut: string, onClick: () => void): HTMLElement {
    const item = document.createElement('div');
    item.className = 'xterm-context-menu-item';
    item.textContent = text;
    item.setAttribute('role', 'menuitem');
    item.setAttribute('tabindex', '0');
    if (shortcut) {
      item.setAttribute('data-shortcut', shortcut);
    }

    item.addEventListener('click', () => {
      onClick();
      // Remove menu after action
      this.dismissCurrentMenu();
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
    // Track whether menu has been dismissed to prevent multiple cleanup calls
    let dismissed = false;

    const cleanup = () => {
      if (dismissed) return;
      dismissed = true;

      // Only remove if this is still the current menu
      if (this.currentMenu === menu) {
        this.currentMenu = null;
      }
      menu.remove();
      document.removeEventListener('click', removeMenu);
      document.removeEventListener('keydown', handleEscape);
      terminal.focus();
    };

    // Remove menu on click outside
    const removeMenu = (e: MouseEvent) => {
      if (!menu.contains(e.target as Node)) {
        cleanup();
      }
    };

    // Remove menu on Escape key
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        cleanup();
      }
    };

    // Use MutationObserver to detect when menu is removed from DOM
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'childList' && mutation.removedNodes.length > 0) {
          const removedNodes = Array.from(mutation.removedNodes);
          for (const node of removedNodes) {
            if (node === menu) {
              // Menu was removed, cleanup event listeners
              document.removeEventListener('click', removeMenu);
              document.removeEventListener('keydown', handleEscape);
              observer.disconnect();
              return;
            }
          }
        }
      }
    });

    observer.observe(document.body, { childList: true, subtree: false });

    // Delay event listener attachment to prevent immediate trigger
    setTimeout(() => {
      if (!dismissed) {
        document.addEventListener('click', removeMenu);
        document.addEventListener('keydown', handleEscape);
      }
    }, 0);
  }
}
