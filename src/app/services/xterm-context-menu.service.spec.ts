import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { XtermContextMenuService } from './xterm-context-menu.service';
import { ToasterService } from './toaster.service';
import { Terminal } from '@xterm/xterm';

describe('XtermContextMenuService', () => {
  let service: XtermContextMenuService;
  let mockToaster: { success: ReturnType<typeof vi.fn>; error: ReturnType<typeof vi.fn>; warning: ReturnType<typeof vi.fn> };
  let mockTerminal: Terminal;
  let mockTerminalElement: HTMLElement;
  let mockBody: { appendChild: ReturnType<typeof vi.fn>; removeChild: ReturnType<typeof vi.fn> };
  let createdElements: any[];

  beforeEach(() => {
    vi.clearAllMocks();

    createdElements = [];

    // Mock ToasterService
    mockToaster = {
      success: vi.fn(),
      error: vi.fn(),
      warning: vi.fn(),
    };

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

    // Track created elements
    mockBody = {
      appendChild: vi.fn((el) => {
        el.parentNode = mockBody;
        createdElements.push(el);
      }),
      removeChild: vi.fn(),
    };

    // Document event listeners storage
    const documentEventListeners: Record<string, Function[]> = {};

    // Mock document methods
    vi.stubGlobal('document', {
      body: mockBody,
      addEventListener: vi.fn((event: string, handler: Function) => {
        if (!documentEventListeners[event]) documentEventListeners[event] = [];
        documentEventListeners[event].push(handler);
      }),
      removeEventListener: vi.fn((event: string, handler: Function) => {
        if (documentEventListeners[event]) {
          documentEventListeners[event] = documentEventListeners[event].filter(h => h !== handler);
        }
      }),
      createElement: vi.fn((tagName: string) => {
        if (tagName === 'div') {
          const attrs: Record<string, string> = {};
          const eventListeners: Record<string, Function[]> = {};
          const mockElement = {
            className: '',
            style: { left: '', top: '' },
            textContent: '',
            children: [],
            parentNode: null,
            setAttribute: vi.fn((key: string, value: string) => { attrs[key] = value; }),
            getAttribute: vi.fn((key: string) => attrs[key]),
            appendChild: vi.fn((child: any) => {
              mockElement.children.push(child);
              child.parentNode = mockElement;
            }),
            remove: vi.fn(() => {
              mockElement.parentNode = null;
            }),
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
            click: vi.fn(() => {
              const handlers = eventListeners['click'];
              if (handlers) {
                handlers.forEach((h: Function) => h(new MouseEvent('click')));
              }
            }),
          };
          return mockElement;
        }
        return {};
      }),
    });

    vi.stubGlobal('MutationObserver', class {
      observe = vi.fn();
      disconnect = vi.fn();
    });

    vi.stubGlobal('setTimeout', vi.fn((cb: Function) => { cb(); return 0; }));

    vi.stubGlobal('navigator', {
      clipboard: {
        writeText: vi.fn((text: string) => Promise.resolve()),
        readText: vi.fn(() => Promise.resolve('test paste text')),
      },
    });

    // Mock window dimensions
    vi.stubGlobal('window', {
      innerWidth: 1920,
      innerHeight: 1080,
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

    it('should inject ToasterService', () => {
      expect((service as any).toaster).toBeDefined();
      expect((service as any).toaster).toBe(mockToaster);
    });
  });

  describe('attachContextMenu', () => {
    it('should add contextmenu event listener to terminal element', () => {
      service.attachContextMenu(mockTerminal, mockTerminalElement);

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

      // Find the handler that was registered
      const calls = (mockTerminalElement.addEventListener as any).mock.calls;
      const contextmenuCall = calls.find((call: any[]) => call[0] === 'contextmenu');
      const registeredHandler = contextmenuCall ? contextmenuCall[1] : null;

      cleanup();

      expect(mockTerminalElement.removeEventListener).toHaveBeenCalledWith(
        'contextmenu',
        registeredHandler
      );
    });

    it('should handle multiple attach calls with separate handlers', () => {
      const cleanup1 = service.attachContextMenu(mockTerminal, mockTerminalElement);
      const cleanup2 = service.attachContextMenu(mockTerminal, mockTerminalElement);

      expect(mockTerminalElement.addEventListener).toHaveBeenCalledTimes(2);
      cleanup1();
      cleanup2();
      expect(mockTerminalElement.removeEventListener).toHaveBeenCalledTimes(2);
    });
  });

  describe('showContextMenu (via contextmenu event)', () => {
    function triggerContextMenu(clientX: number, clientY: number) {
      // Find and call the contextmenu handler
      const calls = (mockTerminalElement.addEventListener as any).mock.calls;
      const contextmenuCall = calls.find((call: any[]) => call[0] === 'contextmenu');
      if (contextmenuCall) {
        const handler = contextmenuCall[1];
        const event = new MouseEvent('contextmenu', { clientX, clientY });
        handler(event);
      }
    }

    beforeEach(() => {
      service.attachContextMenu(mockTerminal, mockTerminalElement);
    });

    it('should create context menu on contextmenu event', () => {
      triggerContextMenu(100, 200);

      expect(document.createElement).toHaveBeenCalledWith('div');
      expect(mockBody.appendChild).toHaveBeenCalled();
    });

    it('should set menu position based on mouse coordinates', () => {
      triggerContextMenu(100, 200);

      const menu = createdElements[0];
      expect(menu.style.left).toBe('100px');
      expect(menu.style.top).toBe('200px');
    });

    it('should adjust position to prevent horizontal overflow', () => {
      triggerContextMenu(1850, 200);

      const menu = createdElements[0];
      expect(menu.style.left).toBe('1730px'); // 1920 - 180 - 10
    });

    it('should adjust position to prevent vertical overflow', () => {
      triggerContextMenu(100, 1000);

      const menu = createdElements[0];
      // 1000 + 120 = 1120 > 1080, so top = 1080 - 120 - 10 = 950
      expect(menu.style.top).toBe('950px');
    });

    it('should ensure minimum position of 10', () => {
      triggerContextMenu(-100, -100);

      const menu = createdElements[0];
      expect(menu.style.left).toBe('10px');
      expect(menu.style.top).toBe('10px');
    });

    it('should remove existing menu before showing new one', () => {
      // Show first menu
      triggerContextMenu(100, 200);

      const firstMenu = createdElements[0];

      // Show second menu
      triggerContextMenu(300, 400);

      expect(firstMenu.remove).toHaveBeenCalled();
    });
  });

  describe('Menu Items', () => {
    function triggerContextMenu(clientX: number, clientY: number) {
      const calls = (mockTerminalElement.addEventListener as any).mock.calls;
      const contextmenuCall = calls.find((call: any[]) => call[0] === 'contextmenu');
      if (contextmenuCall) {
        const handler = contextmenuCall[1];
        const event = new MouseEvent('contextmenu', { clientX, clientY });
        handler(event);
      }
    }

    beforeEach(() => {
      service.attachContextMenu(mockTerminal, mockTerminalElement);
    });

    function getMenuItems() {
      const menu = createdElements[0];
      if (!menu) return [];
      return menu.children.filter((child: any) =>
        child.getAttribute?.('role') === 'menuitem'
      );
    }

    it('should always show Paste menu item', () => {
      (mockTerminal.hasSelection as any).mockReturnValue(false);
      (mockTerminal.getSelection as any).mockReturnValue('');

      triggerContextMenu(100, 200);

      const menuItems = getMenuItems();
      const pasteItem = menuItems.find((item: any) => item.textContent === 'Paste');
      expect(pasteItem).toBeDefined();
    });

    it('should always show Select All menu item', () => {
      (mockTerminal.hasSelection as any).mockReturnValue(false);

      triggerContextMenu(100, 200);

      const menuItems = getMenuItems();
      const selectAllItem = menuItems.find((item: any) => item.textContent === 'Select All');
      expect(selectAllItem).toBeDefined();
    });

    it('should show Copy menu item only when selection exists', () => {
      (mockTerminal.hasSelection as any).mockReturnValue(true);
      (mockTerminal.getSelection as any).mockReturnValue('selected text');

      triggerContextMenu(100, 200);

      const menuItems = getMenuItems();
      const copyItem = menuItems.find((item: any) => item.textContent === 'Copy');
      expect(copyItem).toBeDefined();
    });

    it('should not show Copy menu item when no selection', () => {
      (mockTerminal.hasSelection as any).mockReturnValue(false);
      (mockTerminal.getSelection as any).mockReturnValue('');

      triggerContextMenu(100, 200);

      const menuItems = getMenuItems();
      const copyItem = menuItems.find((item: any) => item.textContent === 'Copy');
      expect(copyItem).toBeUndefined();
    });

    it('should show Clear Selection menu item only when selection exists', () => {
      (mockTerminal.hasSelection as any).mockReturnValue(true);
      (mockTerminal.getSelection as any).mockReturnValue('selected text');

      triggerContextMenu(100, 200);

      const menuItems = getMenuItems();
      const clearSelectionItem = menuItems.find((item: any) => item.textContent === 'Clear Selection');
      expect(clearSelectionItem).toBeDefined();
    });

    it('should not show Clear Selection menu item when no selection', () => {
      (mockTerminal.hasSelection as any).mockReturnValue(false);
      (mockTerminal.getSelection as any).mockReturnValue('');

      triggerContextMenu(100, 200);

      const menuItems = getMenuItems();
      const clearSelectionItem = menuItems.find((item: any) => item.textContent === 'Clear Selection');
      expect(clearSelectionItem).toBeUndefined();
    });

    it('should add separator before Select All', () => {
      (mockTerminal.hasSelection as any).mockReturnValue(false);

      triggerContextMenu(100, 200);

      const menu = createdElements[0];
      const separator = menu.children.find((child: any) =>
        child.className === 'xterm-context-menu-separator'
      );
      expect(separator).toBeDefined();
    });
  });

  describe('Copy Action', () => {
    function triggerContextMenu(clientX: number, clientY: number) {
      const calls = (mockTerminalElement.addEventListener as any).mock.calls;
      const contextmenuCall = calls.find((call: any[]) => call[0] === 'contextmenu');
      if (contextmenuCall) {
        const handler = contextmenuCall[1];
        const event = new MouseEvent('contextmenu', { clientX, clientY });
        handler(event);
      }
    }

    beforeEach(() => {
      service.attachContextMenu(mockTerminal, mockTerminalElement);
    });

    function getMenuItems() {
      const menu = createdElements[0];
      if (!menu) return [];
      return menu.children.filter((child: any) =>
        child.getAttribute?.('role') === 'menuitem'
      );
    }

    it('should copy selected text to clipboard on Copy click', async () => {
      (mockTerminal.hasSelection as any).mockReturnValue(true);
      (mockTerminal.getSelection as any).mockReturnValue('selected text');

      triggerContextMenu(100, 200);

      const menuItems = getMenuItems();
      const copyItem = menuItems.find((item: any) => item.textContent === 'Copy');

      // Click copy item
      copyItem.click();

      // Wait for async clipboard operation
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('selected text');
      expect(mockToaster.success).toHaveBeenCalledWith('Copied to clipboard');
      expect(mockTerminal.clearSelection).toHaveBeenCalled();
    });
  });

  describe('Paste Action', () => {
    function triggerContextMenu(clientX: number, clientY: number) {
      const calls = (mockTerminalElement.addEventListener as any).mock.calls;
      const contextmenuCall = calls.find((call: any[]) => call[0] === 'contextmenu');
      if (contextmenuCall) {
        const handler = contextmenuCall[1];
        const event = new MouseEvent('contextmenu', { clientX, clientY });
        handler(event);
      }
    }

    beforeEach(() => {
      service.attachContextMenu(mockTerminal, mockTerminalElement);
    });

    function getMenuItems() {
      const menu = createdElements[0];
      if (!menu) return [];
      return menu.children.filter((child: any) =>
        child.getAttribute?.('role') === 'menuitem'
      );
    }

    it('should paste text from clipboard on Paste click', async () => {
      (navigator.clipboard.readText as any).mockResolvedValueOnce('pasted content');

      triggerContextMenu(100, 200);

      const menuItems = getMenuItems();
      const pasteItem = menuItems.find((item: any) => item.textContent === 'Paste');

      pasteItem.click();

      await new Promise(resolve => setTimeout(resolve, 10));

      expect(mockTerminal.paste).toHaveBeenCalledWith('pasted content');
    });

    it('should show warning when clipboard is empty', async () => {
      // Override clipboard mock for this test
      const originalReadText = navigator.clipboard.readText;
      (navigator.clipboard.readText as any) = vi.fn(() => Promise.resolve(''));

      triggerContextMenu(100, 200);

      const menuItems = getMenuItems();
      const pasteItem = menuItems.find((item: any) => item.textContent === 'Paste');

      pasteItem.click();

      await new Promise(resolve => setTimeout(resolve, 10));

      expect(mockToaster.warning).toHaveBeenCalledWith('Nothing to paste. Clipboard is empty.');
      expect(mockTerminal.paste).not.toHaveBeenCalled();

      // Restore original
      (navigator.clipboard.readText as any) = originalReadText;
    });
  });

  describe('Select All Action', () => {
    function triggerContextMenu(clientX: number, clientY: number) {
      const calls = (mockTerminalElement.addEventListener as any).mock.calls;
      const contextmenuCall = calls.find((call: any[]) => call[0] === 'contextmenu');
      if (contextmenuCall) {
        const handler = contextmenuCall[1];
        const event = new MouseEvent('contextmenu', { clientX, clientY });
        handler(event);
      }
    }

    beforeEach(() => {
      service.attachContextMenu(mockTerminal, mockTerminalElement);
    });

    function getMenuItems() {
      const menu = createdElements[0];
      if (!menu) return [];
      return menu.children.filter((child: any) =>
        child.getAttribute?.('role') === 'menuitem'
      );
    }

    it('should call terminal.selectAll on Select All click', () => {
      triggerContextMenu(100, 200);

      const menuItems = getMenuItems();
      const selectAllItem = menuItems.find((item: any) => item.textContent === 'Select All');

      selectAllItem.click();

      expect(mockTerminal.selectAll).toHaveBeenCalled();
    });
  });

  describe('Clear Selection Action', () => {
    function triggerContextMenu(clientX: number, clientY: number) {
      const calls = (mockTerminalElement.addEventListener as any).mock.calls;
      const contextmenuCall = calls.find((call: any[]) => call[0] === 'contextmenu');
      if (contextmenuCall) {
        const handler = contextmenuCall[1];
        const event = new MouseEvent('contextmenu', { clientX, clientY });
        handler(event);
      }
    }

    beforeEach(() => {
      service.attachContextMenu(mockTerminal, mockTerminalElement);
    });

    function getMenuItems() {
      const menu = createdElements[0];
      if (!menu) return [];
      return menu.children.filter((child: any) =>
        child.getAttribute?.('role') === 'menuitem'
      );
    }

    it('should call terminal.clearSelection on Clear Selection click', () => {
      (mockTerminal.hasSelection as any).mockReturnValue(true);
      (mockTerminal.getSelection as any).mockReturnValue('selected text');

      triggerContextMenu(100, 200);

      const menuItems = getMenuItems();
      const clearSelectionItem = menuItems.find((item: any) => item.textContent === 'Clear Selection');

      clearSelectionItem.click();

      expect(mockTerminal.clearSelection).toHaveBeenCalled();
    });
  });

  describe('Menu Item Keyboard Support', () => {
    function triggerContextMenu(clientX: number, clientY: number) {
      const calls = (mockTerminalElement.addEventListener as any).mock.calls;
      const contextmenuCall = calls.find((call: any[]) => call[0] === 'contextmenu');
      if (contextmenuCall) {
        const handler = contextmenuCall[1];
        const event = new MouseEvent('contextmenu', { clientX, clientY });
        handler(event);
      }
    }

    beforeEach(() => {
      service.attachContextMenu(mockTerminal, mockTerminalElement);
    });

    function getMenuItems() {
      const menu = createdElements[0];
      if (!menu) return [];
      return menu.children.filter((child: any) =>
        child.getAttribute?.('role') === 'menuitem'
      );
    }

    it('should trigger click handler on Enter key', () => {
      triggerContextMenu(100, 200);

      const menuItems = getMenuItems();
      const selectAllItem = menuItems.find((item: any) => item.textContent === 'Select All');

      const keydownEvent = new KeyboardEvent('keydown', { key: 'Enter' });
      selectAllItem.dispatchEvent(keydownEvent);

      expect(mockTerminal.selectAll).toHaveBeenCalled();
    });

    it('should trigger click handler on Space key', () => {
      triggerContextMenu(100, 200);

      const menuItems = getMenuItems();
      const selectAllItem = menuItems.find((item: any) => item.textContent === 'Select All');

      const keydownEvent = new KeyboardEvent('keydown', { key: ' ' });
      selectAllItem.dispatchEvent(keydownEvent);

      expect(mockTerminal.selectAll).toHaveBeenCalled();
    });
  });

  describe('Menu Dismissal', () => {
    function triggerContextMenu(clientX: number, clientY: number) {
      const calls = (mockTerminalElement.addEventListener as any).mock.calls;
      const contextmenuCall = calls.find((call: any[]) => call[0] === 'contextmenu');
      if (contextmenuCall) {
        const handler = contextmenuCall[1];
        const event = new MouseEvent('contextmenu', { clientX, clientY });
        handler(event);
      }
    }

    beforeEach(() => {
      service.attachContextMenu(mockTerminal, mockTerminalElement);
    });

    function getMenuItems() {
      const menu = createdElements[0];
      if (!menu) return [];
      return menu.children.filter((child: any) =>
        child.getAttribute?.('role') === 'menuitem'
      );
    }

    it('should dismiss menu after Copy action', async () => {
      (mockTerminal.hasSelection as any).mockReturnValue(true);
      (mockTerminal.getSelection as any).mockReturnValue('selected text');

      triggerContextMenu(100, 200);

      const menu = createdElements[0];
      const menuItems = getMenuItems();
      const copyItem = menuItems.find((item: any) => item.textContent === 'Copy');

      copyItem.click();

      await new Promise(resolve => setTimeout(resolve, 10));

      expect(menu.remove).toHaveBeenCalled();
    });

    it('should dismiss menu after Paste action', async () => {
      triggerContextMenu(100, 200);

      const menu = createdElements[0];
      const menuItems = getMenuItems();
      const pasteItem = menuItems.find((item: any) => item.textContent === 'Paste');

      pasteItem.click();

      await new Promise(resolve => setTimeout(resolve, 10));

      expect(menu.remove).toHaveBeenCalled();
    });

    it('should dismiss menu after Select All action', () => {
      triggerContextMenu(100, 200);

      const menu = createdElements[0];
      const menuItems = getMenuItems();
      const selectAllItem = menuItems.find((item: any) => item.textContent === 'Select All');

      selectAllItem.click();

      expect(menu.remove).toHaveBeenCalled();
    });
  });

  describe('hasSelection Detection', () => {
    function triggerContextMenuWithTerminal(terminal: Terminal, clientX: number, clientY: number) {
      service.attachContextMenu(terminal, mockTerminalElement);
      const calls = (mockTerminalElement.addEventListener as any).mock.calls;
      const contextmenuCall = calls.find((call: any[]) => call[0] === 'contextmenu');
      if (contextmenuCall) {
        const handler = contextmenuCall[1];
        const event = new MouseEvent('contextmenu', { clientX, clientY });
        handler(event);
      }
    }

    function getMenuItems() {
      const menu = createdElements[0];
      if (!menu) return [];
      return menu.children.filter((child: any) =>
        child.getAttribute?.('role') === 'menuitem'
      );
    }

    it('should use hasSelection method when available (xterm.js 5.0+)', () => {
      (mockTerminal.hasSelection as any).mockReturnValue(true);

      triggerContextMenuWithTerminal(mockTerminal, 100, 200);

      expect(mockTerminal.hasSelection).toHaveBeenCalled();

      const menuItems = getMenuItems();
      const copyItem = menuItems.find((item: any) => item.textContent === 'Copy');
      expect(copyItem).toBeDefined();
    });

    it('should fallback to getSelection when hasSelection is not available', () => {
      // Create terminal without hasSelection method
      const terminalWithoutHasSelection = {
        getSelection: vi.fn(() => 'some text'),
        clearSelection: vi.fn(),
        selectAll: vi.fn(),
        paste: vi.fn(),
        focus: vi.fn(),
      } as any as Terminal;

      triggerContextMenuWithTerminal(terminalWithoutHasSelection, 100, 200);

      const menuItems = getMenuItems();
      const copyItem = menuItems.find((item: any) => item.textContent === 'Copy');
      expect(copyItem).toBeDefined();
    });

    it('should handle null selection from getSelection', () => {
      const terminalWithNullSelection = {
        getSelection: vi.fn(() => null),
      } as any as Terminal;

      triggerContextMenuWithTerminal(terminalWithNullSelection, 100, 200);

      const menuItems = getMenuItems();
      const copyItem = menuItems.find((item: any) => item.textContent === 'Copy');
      expect(copyItem).toBeUndefined();
    });

    it('should treat empty string selection as no selection', () => {
      (mockTerminal.getSelection as any).mockReturnValue('');

      triggerContextMenuWithTerminal(mockTerminal, 100, 200);

      const menuItems = getMenuItems();
      const copyItem = menuItems.find((item: any) => item.textContent === 'Copy');
      expect(copyItem).toBeUndefined();
    });
  });

  describe('Menu Item Attributes', () => {
    function triggerContextMenu(clientX: number, clientY: number) {
      const calls = (mockTerminalElement.addEventListener as any).mock.calls;
      const contextmenuCall = calls.find((call: any[]) => call[0] === 'contextmenu');
      if (contextmenuCall) {
        const handler = contextmenuCall[1];
        const event = new MouseEvent('contextmenu', { clientX, clientY });
        handler(event);
      }
    }

    beforeEach(() => {
      service.attachContextMenu(mockTerminal, mockTerminalElement);
    });

    function getMenuItems() {
      const menu = createdElements[0];
      if (!menu) return [];
      return menu.children.filter((child: any) =>
        child.getAttribute?.('role') === 'menuitem'
      );
    }

    it('should set role=menuitem on all menu items', () => {
      triggerContextMenu(100, 200);

      const menuItems = getMenuItems();

      menuItems.forEach((item: any) => {
        expect(item.getAttribute('role')).toBe('menuitem');
      });
    });

    it('should set tabindex=0 on all menu items', () => {
      triggerContextMenu(100, 200);

      const menuItems = getMenuItems();

      menuItems.forEach((item: any) => {
        expect(item.getAttribute('tabindex')).toBe('0');
      });
    });

    it('should set data-shortcut on Copy item', () => {
      (mockTerminal.hasSelection as any).mockReturnValue(true);
      (mockTerminal.getSelection as any).mockReturnValue('selected text');

      triggerContextMenu(100, 200);

      const menuItems = getMenuItems();
      const copyItem = menuItems.find((item: any) => item.textContent === 'Copy');

      expect(copyItem.getAttribute('data-shortcut')).toBe('Ctrl+Shift+C');
    });

    it('should set data-shortcut on Paste item', () => {
      triggerContextMenu(100, 200);

      const menuItems = getMenuItems();
      const pasteItem = menuItems.find((item: any) => item.textContent === 'Paste');

      expect(pasteItem.getAttribute('data-shortcut')).toBe('Ctrl+Shift+V');
    });

    it('should not set data-shortcut on Select All item', () => {
      triggerContextMenu(100, 200);

      const menuItems = getMenuItems();
      const selectAllItem = menuItems.find((item: any) => item.textContent === 'Select All');

      expect(selectAllItem.getAttribute('data-shortcut')).toBeFalsy();
    });
  });
});
