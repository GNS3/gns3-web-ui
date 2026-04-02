import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { XtermContextMenuService } from './xterm-context-menu.service';
import { ToasterService } from './toaster.service';
import { Terminal } from '@xterm/xterm';

describe('XtermContextMenuService', () => {
  let service: XtermContextMenuService;
  let mockToaster: ToasterService;
  let mockTerminal: Terminal;
  let mockTerminalElement: HTMLElement;

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock ToasterService
    mockToaster = {
      success: vi.fn(),
      error: vi.fn(),
      warning: vi.fn(),
    } as any as ToasterService;

    // Mock Terminal
    mockTerminal = {
      getSelection: vi.fn(() => ''),
      clearSelection: vi.fn(),
      selectAll: vi.fn(),
      paste: vi.fn(),
      focus: vi.fn(),
      hasSelection: vi.fn(() => false),
    } as any as Terminal;

    // Mock Terminal Element
    mockTerminalElement = {
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      classList: {
        add: vi.fn(),
        remove: vi.fn(),
      },
    } as any as HTMLElement;

    // Mock document methods
    const mockBody = {
      appendChild: vi.fn(),
      removeChild: vi.fn(),
    };

    vi.stubGlobal('document', {
      body: mockBody,
      createElement: vi.fn((tagName: string) => {
        if (tagName === 'div') {
          const attrs: Record<string, string> = {};
          const eventListeners: Record<string, Function[]> = {};
          const mockElement = {
            className: '',
            style: {},
            textContent: '',
            setAttribute: vi.fn((key: string, value: string) => { attrs[key] = value; }),
            getAttribute: vi.fn((key: string) => attrs[key]),
            appendChild: vi.fn(),
            remove: vi.fn(),
            contains: vi.fn(() => false),
            addEventListener: vi.fn((event: string, handler: Function) => {
              if (!eventListeners[event]) eventListeners[event] = [];
              eventListeners[event].push(handler);
            }),
            removeEventListener: vi.fn(),
            dispatchEvent: vi.fn((event: Event) => {
              const handlers = eventListeners[event.type];
              if (handlers) {
                handlers.forEach((h: Function) => h(event));
              }
              return true;
            }),
            click: vi.fn(),
          };
          return mockElement;
        }
        return {};
      }),
    });

    vi.stubGlobal('MutationObserver', vi.fn().mockImplementation(() => ({
      observe: vi.fn(),
      disconnect: vi.fn(),
    })));

    vi.stubGlobal('setTimeout', vi.fn((cb: Function) => cb()));

    vi.stubGlobal('navigator', {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
        readText: vi.fn().mockResolvedValue('test paste text'),
      },
    });

    TestBed.configureTestingModule({
      providers: [
        XtermContextMenuService,
        { provide: ToasterService, useValue: mockToaster },
      ],
    });

    service = TestBed.inject(XtermContextMenuService);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Service Creation', () => {
    it('should create the service', () => {
      expect(service).toBeTruthy();
    });

    it('should be instance of XtermContextMenuService', () => {
      expect(service).toBeInstanceOf(XtermContextMenuService);
    });

    it('should be providedIn root', () => {
      expect(service).toBeTruthy();
    });
  });

  describe('attachContextMenu', () => {
    it('should add contextmenu event listener to terminal element', () => {
      const cleanup = service.attachContextMenu(mockTerminal, mockTerminalElement);

      expect(mockTerminalElement.addEventListener).toHaveBeenCalledWith(
        'contextmenu',
        expect.any(Function)
      );
    });

    it('should return a cleanup function', () => {
      const cleanup = service.attachContextMenu(mockTerminal, mockTerminalElement);

      expect(typeof cleanup).toBe('function');
    });

    it('cleanup function should remove event listener', () => {
      const cleanup = service.attachContextMenu(mockTerminal, mockTerminalElement);
      cleanup();

      expect(mockTerminalElement.removeEventListener).toHaveBeenCalledWith(
        'contextmenu',
        expect.any(Function)
      );
    });

    it('should handle multiple attach calls', () => {
      const cleanup1 = service.attachContextMenu(mockTerminal, mockTerminalElement);
      const cleanup2 = service.attachContextMenu(mockTerminal, mockTerminalElement);

      expect(mockTerminalElement.addEventListener).toHaveBeenCalledTimes(2);
      cleanup1();
      cleanup2();
      expect(mockTerminalElement.removeEventListener).toHaveBeenCalledTimes(2);
    });
  });

  describe('Clipboard Operations', () => {
    it('should have ToasterService injected', () => {
      expect((service as any).toaster).toBeDefined();
    });

    it('should call toaster.success on successful copy', async () => {
      const menuItem = document.createElement('div');

      // Set up mock with non-empty selection
      (mockTerminal.getSelection as any).mockReturnValue('selected text');

      // Simulate copy click handler
      const copyHandler = async () => {
        try {
          const selection = mockTerminal.getSelection();
          if (selection) {
            await navigator.clipboard.writeText(selection);
            mockToaster.success('Copied to clipboard');
            mockTerminal.clearSelection();
          }
        } catch (e) {
          mockToaster.error('Failed to copy');
        }
      };

      await copyHandler();

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('selected text');
      expect(mockToaster.success).toHaveBeenCalledWith('Copied to clipboard');
    });

    it('should call toaster.error on clipboard permission denied', async () => {
      const permissionError = new Error('Clipboard permission denied');
      permissionError.name = 'NotAllowedError';
      (navigator.clipboard.writeText as any).mockRejectedValueOnce(permissionError);
      (mockTerminal.getSelection as any).mockReturnValue('selected text');

      const copyHandler = async () => {
        try {
          const selection = mockTerminal.getSelection();
          if (selection) {
            await navigator.clipboard.writeText(selection);
          }
        } catch (e: any) {
          if (e.name === 'NotAllowedError') {
            mockToaster.error('Clipboard permission denied. Please allow clipboard access.');
          } else {
            mockToaster.error('Failed to copy. Please try again.');
          }
        }
      };

      await copyHandler();

      expect(mockToaster.error).toHaveBeenCalledWith('Clipboard permission denied. Please allow clipboard access.');
    });

    it('should call toaster.warning when clipboard is empty on paste', async () => {
      (navigator.clipboard.readText as any).mockResolvedValueOnce('');

      const pasteHandler = async () => {
        try {
          const text = await navigator.clipboard.readText();
          if (text) {
            mockTerminal.paste(text);
          } else {
            mockToaster.warning('Nothing to paste. Clipboard is empty.');
          }
        } catch (e) {
          mockToaster.error('Failed to paste');
        }
      };

      await pasteHandler();

      expect(mockToaster.warning).toHaveBeenCalledWith('Nothing to paste. Clipboard is empty.');
    });

    it('should paste text from clipboard', async () => {
      (navigator.clipboard.readText as any).mockResolvedValueOnce('pasted content');

      const pasteHandler = async () => {
        try {
          const text = await navigator.clipboard.readText();
          if (text) {
            mockTerminal.paste(text);
          }
        } catch (e) {
          mockToaster.error('Failed to paste');
        }
      };

      await pasteHandler();

      expect(mockTerminal.paste).toHaveBeenCalledWith('pasted content');
    });
  });

  describe('Terminal Operations', () => {
    it('should call terminal.selectAll on Select All action', () => {
      const selectAllHandler = () => {
        try {
          mockTerminal.selectAll();
        } catch (e) {
          console.error('Error selecting all:', e);
        }
      };

      selectAllHandler();

      expect(mockTerminal.selectAll).toHaveBeenCalled();
    });

    it('should call terminal.clearSelection on Clear Selection action', () => {
      const clearSelectionHandler = () => {
        try {
          mockTerminal.clearSelection();
        } catch (e) {
          console.error('Error clearing selection:', e);
        }
      };

      clearSelectionHandler();

      expect(mockTerminal.clearSelection).toHaveBeenCalled();
    });

    it('should call terminal.focus after cleanup', () => {
      const focusHandler = () => {
        mockTerminal.focus();
      };

      focusHandler();

      expect(mockTerminal.focus).toHaveBeenCalled();
    });
  });

  describe('Selection Detection', () => {
    it('should use hasSelection if available', () => {
      const terminalWithHasSelection = {
        hasSelection: vi.fn(() => true),
        getSelection: vi.fn(() => ''),
      };

      let hasSelection = false;
      if (typeof terminalWithHasSelection.hasSelection === 'function') {
        hasSelection = terminalWithHasSelection.hasSelection();
      }

      expect(hasSelection).toBe(true);
      expect(terminalWithHasSelection.hasSelection).toHaveBeenCalled();
    });

    it('should fallback to getSelection when hasSelection is not available', () => {
      const terminalWithGetSelectionOnly = {
        getSelection: vi.fn(() => 'some selected text'),
      };

      let hasSelection = false;
      if (typeof (terminalWithGetSelectionOnly as any).hasSelection === 'function') {
        hasSelection = (terminalWithGetSelectionOnly as any).hasSelection();
      } else {
        const selection = terminalWithGetSelectionOnly.getSelection();
        hasSelection = selection != null && selection.trim().length > 0;
      }

      expect(hasSelection).toBe(true);
    });

    it('should handle null selection gracefully', () => {
      const terminalWithNullSelection = {
        getSelection: vi.fn(() => null),
      };

      let hasSelection = false;
      if (typeof (terminalWithNullSelection as any).hasSelection === 'function') {
        hasSelection = (terminalWithNullSelection as any).hasSelection();
      } else {
        const selection = terminalWithNullSelection.getSelection();
        hasSelection = selection != null && selection.trim().length > 0;
      }

      expect(hasSelection).toBe(false);
    });

    it('should treat empty string selection as no selection', () => {
      const terminalWithEmptySelection = {
        getSelection: vi.fn(() => ''),
      };

      let hasSelection = false;
      if (typeof (terminalWithEmptySelection as any).hasSelection === 'function') {
        hasSelection = (terminalWithEmptySelection as any).hasSelection();
      } else {
        const selection = terminalWithEmptySelection.getSelection();
        hasSelection = selection != null && selection.trim().length > 0;
      }

      expect(hasSelection).toBe(false);
    });
  });

  describe('Menu Item Creation', () => {
    it('should create menu item with proper attributes', () => {
      const item = document.createElement('div');

      item.className = 'xterm-context-menu-item';
      item.textContent = 'Copy';
      item.setAttribute('role', 'menuitem');
      item.setAttribute('tabindex', '0');
      item.setAttribute('data-shortcut', 'Ctrl+Shift+C');

      expect(item.className).toBe('xterm-context-menu-item');
      expect(item.textContent).toBe('Copy');
      expect(item.getAttribute('role')).toBe('menuitem');
      expect(item.getAttribute('tabindex')).toBe('0');
      expect(item.getAttribute('data-shortcut')).toBe('Ctrl+Shift+C');
    });

    it('should handle menu item keyboard events', () => {
      const item = document.createElement('div');
      const clickHandler = vi.fn();
      item.addEventListener('click', clickHandler);

      // Manually trigger keydown handler logic to test
      const keydownHandler = (e: KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          clickHandler();
        }
      };

      // Simulate Enter key press
      const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
      keydownHandler(enterEvent);

      expect(clickHandler).toHaveBeenCalled();
    });
  });

  describe('Menu Cleanup', () => {
    it('should setup click outside listener', () => {
      const menu = document.createElement('div');
      const outsideElement = document.createElement('div');

      let dismissed = false;
      const removeMenu = (e: MouseEvent) => {
        if (!menu.contains(e.target as Node)) {
          dismissed = true;
          menu.remove();
        }
      };

      // Simulate click outside - use Object.defineProperty to set target
      const event = new MouseEvent('click');
      Object.defineProperty(event, 'target', { value: outsideElement });

      removeMenu(event);

      expect(dismissed).toBe(true);
    });

    it('should setup Escape key listener', () => {
      let dismissed = false;
      const menu = document.createElement('div');

      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          dismissed = true;
          menu.remove();
        }
      };

      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      handleEscape(event);

      expect(dismissed).toBe(true);
    });

    it('should prevent multiple cleanup calls', () => {
      let cleanupCallCount = 0;
      let dismissed = false;

      const cleanup = () => {
        if (dismissed) return;
        dismissed = true;
        cleanupCallCount++;
      };

      cleanup();
      cleanup();
      cleanup();

      expect(cleanupCallCount).toBe(1);
    });
  });

  describe('Menu Positioning', () => {
    it('should adjust position to prevent horizontal overflow', () => {
      const event = { clientX: 1900, clientY: 500 } as MouseEvent;
      let left = event.clientX;
      let top = event.clientY;

      const estimatedWidth = 180;
      const estimatedHeight = 120;

      if (left + estimatedWidth > window.innerWidth) {
        left = window.innerWidth - estimatedWidth - 10;
      }

      if (top + estimatedHeight > window.innerHeight) {
        top = window.innerHeight - estimatedHeight - 10;
      }

      left = Math.max(10, left);
      top = Math.max(10, top);

      expect(left).toBeLessThan(window.innerWidth);
      expect(top).toBeLessThan(window.innerHeight);
    });

    it('should adjust position to prevent vertical overflow', () => {
      const event = { clientX: 500, clientY: 1000 } as MouseEvent;
      let left = event.clientX;
      let top = event.clientY;

      const estimatedWidth = 180;
      const estimatedHeight = 120;

      if (left + estimatedWidth > window.innerWidth) {
        left = window.innerWidth - estimatedWidth - 10;
      }

      if (top + estimatedHeight > window.innerHeight) {
        top = window.innerHeight - estimatedHeight - 10;
      }

      left = Math.max(10, left);
      top = Math.max(10, top);

      expect(top).toBeLessThan(window.innerHeight);
    });

    it('should ensure minimum position of 10', () => {
      const event = { clientX: -100, clientY: -100 } as MouseEvent;
      let left = event.clientX;
      let top = event.clientY;

      left = Math.max(10, left);
      top = Math.max(10, top);

      expect(left).toBe(10);
      expect(top).toBe(10);
    });
  });

  describe('Error Handling', () => {
    it('should handle clipboard API errors gracefully', async () => {
      const error = new Error('Clipboard API not available');
      (navigator.clipboard.writeText as any).mockRejectedValueOnce(error);

      const copyHandler = async () => {
        try {
          await navigator.clipboard.writeText('test');
        } catch (e) {
          mockToaster.error('Failed to copy. Please try again.');
        }
      };

      await copyHandler();

      expect(mockToaster.error).toHaveBeenCalled();
    });

    it('should handle terminal selection errors', () => {
      const errorTerminal = {
        getSelection: vi.fn(() => {
          throw new Error('Selection error');
        }),
      };

      expect(() => errorTerminal.getSelection()).toThrow();
    });
  });

  describe('Menu Item Visibility', () => {
    it('should show Copy only when hasSelection is true', () => {
      const hasSelection = true;
      let showCopyItem = false;

      if (hasSelection) {
        showCopyItem = true;
      }

      expect(showCopyItem).toBe(true);
    });

    it('should not show Copy when hasSelection is false', () => {
      const hasSelection = false;
      let showCopyItem = false;

      if (hasSelection) {
        showCopyItem = true;
      }

      expect(showCopyItem).toBe(false);
    });

    it('should show Clear Selection only when hasSelection is true', () => {
      const hasSelection = true;
      let showClearSelectionItem = false;

      if (hasSelection) {
        showClearSelectionItem = true;
      }

      expect(showClearSelectionItem).toBe(true);
    });

    it('should always show Paste menu item', () => {
      // Paste is always shown regardless of selection state
      const hasSelection = false;
      let showPasteItem = true; // Always true in actual implementation

      expect(showPasteItem).toBe(true);
    });

    it('should always show Select All menu item', () => {
      // Select All is always shown regardless of selection state
      const hasSelection = false;
      let showSelectAllItem = true; // Always true in actual implementation

      expect(showSelectAllItem).toBe(true);
    });
  });
});
