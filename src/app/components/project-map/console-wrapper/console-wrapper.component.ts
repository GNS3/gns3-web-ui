import { Component, EventEmitter, Input, OnInit, Output, OnDestroy, HostListener, ChangeDetectorRef, ViewChildren, QueryList, AfterViewInit } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { UntypedFormControl } from '@angular/forms';
import { ResizeEvent } from 'angular-resizable-element';
import { Node } from '../../../cartography/models/node';
import { Project } from '@models/project';
import { Controller } from '@models/controller';
import { MapSettingsService } from '@services/mapsettings.service';
import { NodeConsoleService } from '@services/nodeConsole.service';
import { ThemeService } from '@services/theme.service';
import { WindowBoundaryService, WindowStyle } from '@services/window-boundary.service';
import { NodesDataSource } from '../../../cartography/datasources/nodes-datasource';
import { ConsoleDevicesPanelComponent } from './console-devices-panel.component';
import { WebConsoleComponent } from '../web-console/web-console.component';

@Component({
  selector: 'app-console-wrapper',
  templateUrl: './console-wrapper.component.html',
  styleUrls: ['./console-wrapper.component.scss'],
})
export class ConsoleWrapperComponent implements OnInit, AfterViewInit, OnDestroy {

  private destroy$ = new Subject<void>();
  @Input() controller: Controller;
  @Input() project: Project;
  @Output() closeConsole = new EventEmitter<boolean>();
  @Output() deviceSelected = new EventEmitter<string>();
  @Output() consoleDeactivated = new EventEmitter<void>();

  filters: string[] = ['all', 'errors', 'warnings', 'info', 'map updates', 'controller requests'];
  selectedFilter: string = 'all';

  public style: object = {};
  public styleInside: object = { height: `120px` };
  public isDraggingEnabled: boolean = false;
  public isLightThemeEnabled: boolean = false;
  public isMinimized: boolean = false;
  public isMaximized: boolean = false;
  public isConsoleActive: boolean = false;

  public resizedWidth: number = 848;
  public resizedHeight: number = 600;

  constructor(
    private consoleService: NodeConsoleService,
    private themeService: ThemeService,
    private mapSettingsService: MapSettingsService,
    private boundaryService: WindowBoundaryService,
    private cdr: ChangeDetectorRef
  ) {}

  nodes: Node[] = [];
  selected = new UntypedFormControl(0);

  @ViewChildren(WebConsoleComponent)
  webConsoleComponents: QueryList<WebConsoleComponent>;

  ngOnInit() {
    this.themeService.getActualTheme() === 'light'
      ? (this.isLightThemeEnabled = true)
      : (this.isLightThemeEnabled = false);

    // Load saved window state from localStorage
    this.loadWindowState();

    // Set top offset to keep console below toolbar (64px for desktop, 56px for mobile)
    const toolbarHeight = window.innerWidth <= 768 ? 56 : 64;
    this.boundaryService.setConfig({ topOffset: toolbarHeight });

    this.consoleService.nodeConsoleTrigger.pipe(takeUntil(this.destroy$)).subscribe((node) => {
      this.addTab(node, true);
    });

    this.consoleService.closeNodeConsoleTrigger.pipe(takeUntil(this.destroy$)).subscribe((node) => {
      let index = this.nodes.findIndex((n) => n.node_id === node.node_id);
      this.removeTab(index);
    });

    // Listen to tab changes and emit deviceSelected event
    this.selected.valueChanges.pipe(takeUntil(this.destroy$)).subscribe((index: number) => {
      if (index >= 0 && index < this.nodes.length) {
        this.deviceSelected.emit(this.nodes[index].node_id);
      }
    });
  }

  minimize(value: boolean) {
    this.isMinimized = value;
    if (!value) {
      // Restore from minimized state - preserve current left and bottom positions
      const currentLeft = (this.style as WindowStyle).left || '80px';
      const currentBottom = (this.style as WindowStyle).bottom || '20px';

      if (this.isMaximized) {
        // Restore to maximized state
        const toolbarHeight = window.innerWidth <= 768 ? 56 : 64;
        const windowHeight = window.innerHeight;
        const newHeight = windowHeight - toolbarHeight - 20;
        this.style = {
          bottom: '0px',
          left: currentLeft,
          width: `${this.resizedWidth}px`,
          height: `${newHeight}px`
        };
      } else {
        // Restore to normal state
        this.style = {
          bottom: currentBottom,
          left: currentLeft,
          width: `${this.resizedWidth}px`,
          height: `${this.resizedHeight}px`
        };
      }
    } else {
      // Minimize
      this.style = { bottom: '20px', left: '20px', width: `${this.resizedWidth}px`, height: '56px' };
    }
  }

  toggleMaximize() {
    this.isMaximized = !this.isMaximized;
    if (this.isMaximized) {
      // Maximize height only, keep width unchanged (848px)
      const toolbarHeight = window.innerWidth <= 768 ? 56 : 64;
      const windowHeight = window.innerHeight;
      const newHeight = windowHeight - toolbarHeight - 20;
      const currentLeft = (this.style as WindowStyle).left || '80px';
      this.style = {
        bottom: '0px',
        left: currentLeft,
        width: `${this.resizedWidth}px`,
        height: `${newHeight}px`
      };
      // Notify resize
      this.consoleService.consoleResized.next({
        width: this.resizedWidth,
        height: newHeight - 53,
      });
    } else {
      // Restore to normal size
      const currentLeft = (this.style as WindowStyle).left || '80px';
      this.style = { bottom: '20px', left: currentLeft, width: `${this.resizedWidth}px`, height: `${this.resizedHeight}px` };
      // Notify resize
      this.consoleService.consoleResized.next({
        width: this.resizedWidth,
        height: this.resizedHeight - 53,
      });
    }
    this.cdr.markForCheck();
    // Save window state to localStorage
    this.saveWindowState();
  }

  addTab(node: Node, selectAfterAdding: boolean) {
    // Skip VNC nodes - they use standalone windows, not embedded console
    console.debug('[ConsoleWrapper] addTab called for node:', node.name, 'console_type:', node.console_type);
    if (node.console_type === 'vnc') {
      console.debug('[ConsoleWrapper] Skipping VNC node:', node.name);
      return;
    }

    this.minimize(false);

    // Check if node already exists in tabs
    const existingIndex = this.nodes.findIndex(n => n.node_id === node.node_id);

    if (existingIndex >= 0) {
      // Node already exists, just switch to that tab
      if (selectAfterAdding) {
        this.selected.setValue(existingIndex); // Device tabs are 0, 1, 2, ...
      }
    } else {
      // Add new tab
      this.nodes.push(node);

      if (selectAfterAdding) {
        this.selected.setValue(this.nodes.length - 1);
      }

      this.consoleService.openConsoles++;
    }
  }

  removeTab(index: number) {
    this.nodes.splice(index, 1);
    this.consoleService.openConsoles--;
  }

  toggleDragging(value: boolean) {
    const wasDragging = this.isDraggingEnabled;
    this.isDraggingEnabled = value;
    // Save window state after drag ends
    if (wasDragging && !value) {
      this.saveWindowState();
    }
  }

  dragWidget(event) {
    // Use boundary service to constrain position
    this.style = this.boundaryService.constrainDragPosition(
      this.style,
      event.movementX,
      event.movementY
    );
  }

  validate(event: ResizeEvent): boolean {
    if (
      event.rectangle.width &&
      event.rectangle.height &&
      (event.rectangle.width < 500 || event.rectangle.height < 400)
    ) {
      return false;
    }
    return true;
  }

  onResizeEnd(event: ResizeEvent): void {
    // Use boundary service to constrain size
    const constrained = this.boundaryService.constrainResizeSize(
      event.rectangle.width || this.resizedWidth,
      event.rectangle.height || this.resizedHeight,
      event.rectangle.left,
      event.rectangle.top
    );

    this.style = {
      position: 'fixed',
      left: `${constrained.left}px`,
      top: `${constrained.top}px`,
      width: `${constrained.width}px`,
      height: `${constrained.height}px`,
    };

    this.styleInside = {
      height: `${constrained.height - 60}px`,
      width: `${constrained.width}px`,
    };

    this.consoleService.consoleResized.next({
      width: constrained.width,
      height: constrained.height - 53,
    });

    this.resizedWidth = constrained.width;
    this.resizedHeight = constrained.height;

    // Save window state to localStorage
    this.saveWindowState();
  }

  close() {
    this.closeConsole.emit(false);
  }

  /**
   * Handle device selection from devices panel
   */
  onDeviceSelected(node: Node): void {
    this.addTab(node, true);
    this.deviceSelected.emit(node.node_id);
  }

  /**
   * Handle keyboard shortcuts for tab switching
   * Alt+1-8 for devices, Alt+9 for GNS3 console
   * Only works when console window is active (clicked/focused)
   */
  @HostListener('window:keydown.alt.1', ['$event'])
  @HostListener('window:keydown.alt.2', ['$event'])
  @HostListener('window:keydown.alt.3', ['$event'])
  @HostListener('window:keydown.alt.4', ['$event'])
  @HostListener('window:keydown.alt.5', ['$event'])
  @HostListener('window:keydown.alt.6', ['$event'])
  @HostListener('window:keydown.alt.7', ['$event'])
  @HostListener('window:keydown.alt.8', ['$event'])
  @HostListener('window:keydown.alt.9', ['$event'])
  handleTabShortcut(event: KeyboardEvent): void {
    // Only handle shortcuts when console is active
    if (!this.isConsoleActive) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    const key = event.key;

    // Alt+1-8 = device consoles (tab 0-7), Alt+9 = GNS3 console (last tab)
    if (key === '9') {
      this.switchToTab(this.nodes.length); // GNS3 console (last tab)
    } else {
      const tabIndex = parseInt(key) - 1; // Alt+1 = tab 0, Alt+2 = tab 1, etc.
      if (tabIndex < this.nodes.length) {
        this.switchToTab(tabIndex);
      }
    }
  }

  /**
   * Handle custom event from xterm for tab shortcuts
   * This is needed because xterm captures keyboard events
   */
  @HostListener('document:consoleTabShortcut', ['$event'])
  onXtermTabShortcut(event: CustomEvent): void {
    // Only handle shortcuts when console is active
    if (!this.isConsoleActive) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    const key = event.detail.key;
    const tabIndex = parseInt(key) - 1;
    this.switchToTab(tabIndex);
  }

  /**
   * Mark console as active when clicked
   */
  onConsoleActivate(): void {
    this.isConsoleActive = true;
    this.cdr.markForCheck();
  }

  /**
   * Handle document click to deactivate console when clicking outside
   */
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    // Use setTimeout to ensure click event propagates first
    setTimeout(() => {
      const consoleElement = document.querySelector('.consoleWrapper');
      if (consoleElement && !consoleElement.contains(event.target as any)) {
        if (this.isConsoleActive) {
          this.isConsoleActive = false;
          this.consoleDeactivated.emit();
          this.cdr.markForCheck();
        }
      }
    }, 0);
  }

  /**
   * Switch to specific tab by index
   * @param index Tab index (0-n = devices, last = GNS3 console)
   */
  switchToTab(index: number): void {
    if (index < 0 || index > this.nodes.length) {
      return; // Invalid index
    }
    this.selected.setValue(index);

    // Auto-focus xterm when switching to device console tab (not GNS3 console)
    if (index < this.nodes.length && this.webConsoleComponents) {
      // Use setTimeout to ensure DOM has updated before focusing
      setTimeout(() => {
        const webConsoleArray = this.webConsoleComponents.toArray();
        if (webConsoleArray[index]) {
          webConsoleArray[index].focusTerminal();
        }
      }, 100);
    }
  }

  enableScroll(e) {
    this.mapSettingsService.isScrollDisabled.next(false);
  }

  disableScroll(e) {
    this.mapSettingsService.isScrollDisabled.next(true);
  }

  /**
   * Handle window resize events to keep Console within viewport boundaries
   * This ensures the window stays visible when browser window is resized
   */
  @HostListener('window:resize', ['$event'])
  onWindowResize(): void {
    // Skip if minimized
    if (this.isMinimized) {
      return;
    }

    // Re-constrain window position to stay within viewport
    this.style = this.boundaryService.constrainWindowPosition(this.style as WindowStyle);
  }

  /**
  /**
   * Cleanup on component destroy
   */
  ngAfterViewInit(): void {
    // Notify xterm to resize after child components are initialized
    // Use requestAnimationFrame to ensure DOM is fully rendered
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (this.isMaximized) {
          const toolbarHeight = window.innerWidth <= 768 ? 56 : 64;
          const windowHeight = window.innerHeight;
          const newHeight = windowHeight - toolbarHeight - 20;
          this.consoleService.consoleResized.next({
            width: this.resizedWidth,
            height: newHeight - 53,
          });
        } else {
          this.consoleService.consoleResized.next({
            width: this.resizedWidth,
            height: this.resizedHeight - 53,
          });
        }
      });
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Load window state from localStorage
   */
  private loadWindowState(): void {
    const STORAGE_KEY = 'gns3_console_window_state';
    try {
      const savedState = localStorage.getItem(STORAGE_KEY);
      if (savedState) {
        const state = JSON.parse(savedState);
        this.resizedWidth = state.width || 848;
        this.resizedHeight = state.height || 600;
        this.isMaximized = state.isMaximized || false;

        // Apply window state
        if (this.isMaximized) {
          // Restore to maximized state
          const toolbarHeight = window.innerWidth <= 768 ? 56 : 64;
          const windowHeight = window.innerHeight;
          const newHeight = windowHeight - toolbarHeight - 20;
          this.style = {
            bottom: '0px',
            left: '80px',
            width: `${this.resizedWidth}px`,
            height: `${newHeight}px`
          };
        } else {
          // Restore to normal state with saved position
          this.style = {
            bottom: state.bottom || '20px',
            left: state.left || '80px',
            width: `${this.resizedWidth}px`,
            height: `${this.resizedHeight}px`
          };
        }
      } else {
        // Default state
        this.style = { bottom: '20px', left: '80px', width: '848px', height: '600px' };
      }
    } catch (e) {
      // Error reading from localStorage, use defaults
      this.style = { bottom: '20px', left: '80px', width: '848px', height: '600px' };
    }
  }

  /**
   * Save window state to localStorage
   */
  private saveWindowState(): void {
    const STORAGE_KEY = 'gns3_console_window_state';
    try {
      const state = {
        width: this.resizedWidth,
        height: this.resizedHeight,
        bottom: (this.style as WindowStyle).bottom,
        left: (this.style as WindowStyle).left,
        isMaximized: this.isMaximized
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      // Error saving to localStorage, ignore
    }
  }
}
