import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  OnInit,
  Output,
  OnDestroy,
  HostListener,
  ChangeDetectorRef,
  AfterViewInit,
  effect,
  inject,
  input,
  viewChildren,
  viewChild,
  ElementRef,
  Renderer2,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, UntypedFormControl } from '@angular/forms';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { Subject, Subscription } from 'rxjs';
import { takeUntil, tap, switchMap, auditTime } from 'rxjs/operators';
import { fromEvent, animationFrameScheduler } from 'rxjs';
import { ResizeEvent, ResizableDirective, ResizeHandleDirective } from 'angular-resizable-element';
import { Node } from '../../../cartography/models/node';
import { Project } from '@models/project';
import { Controller } from '@models/controller';
import { MapSettingsService } from '@services/mapsettings.service';
import { NodeConsoleService } from '@services/nodeConsole.service';
import { ThemeService } from '@services/theme.service';
import { WindowBoundaryService, WindowStyle } from '@services/window-boundary.service';
import { WindowManagementService } from '@services/window-management.service';
import { NodesDataSource } from '../../../cartography/datasources/nodes-datasource';
import { ConsoleDevicesPanelComponent } from './console-devices-panel.component';
import { WebConsoleComponent } from '../web-console/web-console.component';
import { LogConsoleComponent } from '../log-console/log-console.component';

@Component({
  selector: 'app-console-wrapper',
  templateUrl: './console-wrapper.component.html',
  styleUrl: './console-wrapper.component.scss',
  imports: [
    CommonModule,
    FormsModule,
    MatTabsModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    ResizableDirective,
    ResizeHandleDirective,
    ConsoleDevicesPanelComponent,
    WebConsoleComponent,
    LogConsoleComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConsoleWrapperComponent implements OnInit, AfterViewInit, OnDestroy {
  // Constants for magic numbers
  private readonly CONSOLE_HEADER_HEIGHT = 53;
  private readonly DEFAULT_WIDTH = 848;
  private readonly DEFAULT_HEIGHT = 600;
  private readonly DEFAULT_LEFT = '80px';
  private readonly DEFAULT_BOTTOM = '100px'; // Moved up from 20px to avoid bottom button overlap

  private destroy$ = new Subject<void>();
  private themeSubscription: Subscription | null = null;
  readonly controller = input<Controller>(undefined);
  readonly project = input<Project>(undefined);
  readonly zIndex = input<number>(1000);
  @Output() closeConsole = new EventEmitter<boolean>();
  @Output() deviceSelected = new EventEmitter<string>();
  @Output() consoleDeactivated = new EventEmitter<void>();
  @Output() windowFocused = new EventEmitter<void>();
  @Output() windowMinimized = new EventEmitter<boolean>(); // true = minimized, false = restored

  filters: string[] = ['all', 'errors', 'warnings', 'info', 'map updates', 'controller requests'];
  selectedFilter: string = 'all';

  // Window state (public, but only modified internally)
  public style: WindowStyle = {};
  public styleInside: object = { height: `120px` };

  // UI state using signals
  private isDraggingSignal = signal(false);
  private isMinimizedSignal = signal(false);
  private isMaximizedSignal = signal(false);
  private isConsoleActiveSignal = signal(false);
  private isLightThemeEnabledSignal = signal(false);

  // Public readonly access to signal values
  public readonly isDragging = this.isDraggingSignal.asReadonly();
  public readonly isMinimized = this.isMinimizedSignal.asReadonly();
  public readonly isMaximized = this.isMaximizedSignal.asReadonly();
  public readonly isConsoleActive = this.isConsoleActiveSignal.asReadonly();
  public readonly isLightThemeEnabled = this.isLightThemeEnabledSignal.asReadonly();

  public resizedWidth: number = this.DEFAULT_WIDTH;
  public resizedHeight: number = this.DEFAULT_HEIGHT;

  private consoleService = inject(NodeConsoleService);
  private themeService = inject(ThemeService);
  private mapSettingsService = inject(MapSettingsService);
  private boundaryService = inject(WindowBoundaryService);
  private windowManagement = inject(WindowManagementService);
  private cdr = inject(ChangeDetectorRef);
  private renderer = inject(Renderer2);

  // Drag state (RxJS managed)
  private dragStartX = 0;
  private dragStartY = 0;
  private dragStartLeft = 0;
  private dragStartBottom = 0;

  // Store pre-minimize state for position restoration
  private preMinimizeStyle: WindowStyle | null = null;

  constructor() {
    // Effect to sync windowManagement minimize state with isMinimizedSignal
    effect(() => {
      const minimizedWindows = this.windowManagement.minimizedWindows();
      const isInMinimizedList = minimizedWindows.some(w => w.id === 'console');

      if (isInMinimizedList && !this.isMinimizedSignal()) {
        // Should be minimized
        this.isMinimizedSignal.set(true);
      } else if (!isInMinimizedList && this.isMinimizedSignal()) {
        // Should be restored
        this.isMinimizedSignal.set(false);
      }
    });
  }

  nodes: Node[] = [];
  selected = new UntypedFormControl(0); // Will be reset to -1 when no devices
  private isInitialized = false;

  readonly webConsoleComponents = viewChildren(WebConsoleComponent);
  readonly logConsoleComponent = viewChild(LogConsoleComponent);
  readonly consoleWrapper = viewChild<ElementRef>('consoleWrapper');

  ngOnInit() {
    this.isLightThemeEnabledSignal.set(this.themeService.getActualTheme() === 'light');

    // Subscribe to theme changes
    this.themeSubscription = this.themeService.themeChanged.subscribe(() => {
      this.isLightThemeEnabledSignal.set(this.themeService.getActualTheme() === 'light');
      this.cdr.markForCheck();
    });

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
    this.isMinimizedSignal.set(value);
    if (value) {
      this.windowManagement.minimizeWindow('console', 'console');
    } else {
      this.windowManagement.restoreWindow('console');
    }
    if (!value) {
      // Restore from minimized state - use saved pre-minimize position - default moved up to 100px
      if (this.preMinimizeStyle) {
        const savedLeft = this.preMinimizeStyle.left || this.DEFAULT_LEFT;
        const savedBottom = this.preMinimizeStyle.bottom || this.DEFAULT_BOTTOM;

        if (this.isMaximizedSignal()) {
          // Restore to maximized state
          const toolbarHeight = window.innerWidth <= 768 ? 56 : 64;
          const windowHeight = window.innerHeight;
          const newHeight = windowHeight - toolbarHeight - 20;
          this.updateStyle({
            bottom: '0px',
            left: savedLeft,
            width: `${this.resizedWidth}px`,
            height: `${newHeight}px`,
          });
        } else {
          // Restore to normal state with saved position
          this.updateStyle({
            bottom: savedBottom,
            left: savedLeft,
            width: `${this.resizedWidth}px`,
            height: `${this.resizedHeight}px`,
          });
        }

        // Clear saved state after restoration
        this.preMinimizeStyle = null;
      } else {
        // No saved state, use defaults - moved up from 20px to 100px
        const currentLeft = this.style.left || this.DEFAULT_LEFT;
        const currentBottom = this.style.bottom || this.DEFAULT_BOTTOM;

        this.updateStyle({
          bottom: currentBottom,
          left: currentLeft,
          width: `${this.resizedWidth}px`,
          height: `${this.resizedHeight}px`,
        });
      }

      // Auto-focus to terminal after restoring window
      const selectedIndex = this.selected.value;
      if (selectedIndex < this.nodes.length) {
        // Device console - focus xterm
        this.focusTerminalAfterRender(selectedIndex);
      } else if (selectedIndex === this.nodes.length) {
        // GNS3 console - focus input
        this.focusGns3ConsoleInput();
      }
    } else {
      // Save current position before minimizing
      this.preMinimizeStyle = { ...this.style };
      // Console will be hidden by CSS (display: none)
    }
  }

  toggleMinimize() {
    this.minimize(!this.isMinimizedSignal());
  }

  toggleMaximize() {
    this.isMaximizedSignal.set(!this.isMaximizedSignal());
    if (this.isMaximizedSignal()) {
      // Maximize height only, keep width unchanged
      const toolbarHeight = window.innerWidth <= 768 ? 56 : 64;
      const windowHeight = window.innerHeight;
      const newHeight = windowHeight - toolbarHeight - 20;
      const currentLeft = this.style.left || this.DEFAULT_LEFT;
      this.updateStyle({
        bottom: '0px',
        left: currentLeft,
        width: `${this.resizedWidth}px`,
        height: `${newHeight}px`,
      });
      // Notify resize
      this.consoleService.consoleResized.next({
        width: this.resizedWidth,
        height: newHeight - this.CONSOLE_HEADER_HEIGHT,
      });
      // Also notify after a delay to ensure DOM has been updated
      setTimeout(() => {
        this.consoleService.consoleResized.next({
          width: this.resizedWidth,
          height: newHeight - this.CONSOLE_HEADER_HEIGHT,
        });
      }, 50);
    } else {
      // Restore to normal size - moved up from 20px to 100px to avoid bottom button overlap
      const currentLeft = this.style.left || this.DEFAULT_LEFT;
      this.updateStyle({
        bottom: this.DEFAULT_BOTTOM,
        left: currentLeft,
        width: `${this.resizedWidth}px`,
        height: `${this.resizedHeight}px`,
      });
      // Notify resize
      this.consoleService.consoleResized.next({
        width: this.resizedWidth,
        height: this.resizedHeight - this.CONSOLE_HEADER_HEIGHT,
      });
      // Also notify after a delay to ensure DOM has been updated
      setTimeout(() => {
        this.consoleService.consoleResized.next({
          width: this.resizedWidth,
          height: this.resizedHeight - this.CONSOLE_HEADER_HEIGHT,
        });
      }, 50);
    }
    this.cdr.markForCheck();
    // Save window state to localStorage
    this.saveWindowState();
  }

  addTab(node: Node, selectAfterAdding: boolean) {
    // Skip VNC nodes - they use standalone windows, not embedded console
    if (node.console_type === 'vnc') {
      return;
    }

    this.minimize(false);

    // Check if node already exists in tabs
    const existingIndex = this.nodes.findIndex((n) => n.node_id === node.node_id);

    if (existingIndex >= 0) {
      // Node already exists, just switch to that tab
      if (selectAfterAdding) {
        this.selected.setValue(existingIndex);
        this.cdr.markForCheck();
      }
    } else {
      // Add new tab
      this.nodes.push(node);
      this.consoleService.openConsoles++;

      if (selectAfterAdding) {
        const newIndex = this.nodes.length - 1;
        // Force Material tab group to reset by setting to -1 first, then to the correct index
        // This ensures tab indicator updates to the correct position
        this.selected.setValue(-1);
        this.cdr.markForCheck();

        setTimeout(() => {
          this.selected.setValue(newIndex);
          this.cdr.markForCheck();
        }, 0);
      }
    }
  }

  removeTab(index: number) {
    this.nodes.splice(index, 1);
    this.consoleService.openConsoles--;
  }

  /**
   * Apply style directly to DOM element for better performance during drag
   */
  private applyStyleToElement(style: WindowStyle): void {
    const element = this.consoleWrapper()?.nativeElement;
    if (!element) return;

    if (style.position) {
      this.renderer.setStyle(element, 'position', style.position);
    }
    if (style.left) {
      this.renderer.setStyle(element, 'left', style.left);
    }
    if (style.top) {
      this.renderer.setStyle(element, 'top', style.top);
    }
    if (style.bottom) {
      this.renderer.setStyle(element, 'bottom', style.bottom);
    }
    if (style.right) {
      this.renderer.setStyle(element, 'right', style.right);
    }
    if (style.width) {
      this.renderer.setStyle(element, 'width', style.width);
    }
    if (style.height) {
      this.renderer.setStyle(element, 'height', style.height);
    }
  }

  /**
   * Update style and apply to DOM (used outside of drag operations)
   */
  private updateStyle(newStyle: WindowStyle): void {
    this.style = newStyle;
    this.applyStyleToElement(newStyle);
    this.cdr.markForCheck();
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
    // Check if current positioning uses bottom instead of top
    const currentStyle = this.style as WindowStyle;
    const usesBottomPositioning = currentStyle.bottom !== undefined && currentStyle.top === undefined;

    // Use boundary service to constrain size
    const constrained = this.boundaryService.constrainResizeSize(
      event.rectangle.width || this.resizedWidth,
      event.rectangle.height || this.resizedHeight,
      event.rectangle.left,
      event.rectangle.top
    );

    // Preserve positioning mode (bottom vs top) to avoid window jumping
    if (usesBottomPositioning) {
      // Convert top to bottom: bottom = window.innerHeight - top - height
      const bottom = window.innerHeight - constrained.top! - constrained.height;
      this.updateStyle({
        position: 'fixed',
        left: `${constrained.left}px`,
        bottom: `${bottom}px`,
        width: `${constrained.width}px`,
        height: `${constrained.height}px`,
      });
    } else {
      this.updateStyle({
        position: 'fixed',
        left: `${constrained.left}px`,
        top: `${constrained.top}px`,
        width: `${constrained.width}px`,
        height: `${constrained.height}px`,
      });
    }

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
   * Get the name of the currently active tab for taskbar display
   */
  getActiveTabName(): string {
    const selectedIndex = this.selected.value;
    if (selectedIndex < this.nodes.length) {
      // Device console tab
      const nodeName = this.nodes[selectedIndex].name;
      // Truncate if too long for taskbar display
      return nodeName.length > 12 ? nodeName.substring(0, 10) + '...' : nodeName;
    } else {
      // GNS3 console tab
      return 'Console';
    }
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
    if (!this.isConsoleActiveSignal()) {
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
    if (!this.isConsoleActiveSignal()) {
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
    this.isConsoleActiveSignal.set(true);
    this.cdr.markForCheck();
  }

  /**
   * Handle window focus (bring to front)
   */
  onWindowFocus(): void {
    this.windowFocused.emit();
  }

  /**
   * Handle document click to deactivate console when clicking outside
   */
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    // Use setTimeout to ensure click event propagates first
    setTimeout(() => {
      const consoleElement = document.querySelector('.consoleWrapper');
      const target = event.target as unknown as globalThis.Node;
      if (consoleElement && !consoleElement.contains(target)) {
        if (this.isConsoleActiveSignal()) {
          this.isConsoleActiveSignal.set(false);
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
    if (index < this.nodes.length && this.webConsoleComponents()) {
      // Use requestAnimationFrame to ensure DOM has updated before focusing
      this.focusTerminalAfterRender(index);
    }

    // Auto-focus GNS3 console input when switching to GNS3 console tab (last tab)
    if (index === this.nodes.length) {
      this.focusGns3ConsoleInput();
    }
  }

  /**
   * Focus the GNS3 console command input
   */
  private focusGns3ConsoleInput(): void {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const logConsole = this.logConsoleComponent();
        if (logConsole) {
          logConsole.focusInput();
        }
      });
    });
  }

  /**
   * Focus terminal after DOM has been updated
   * Uses requestAnimationFrame to wait for Angular's rendering cycle
   */
  private focusTerminalAfterRender(index: number): void {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const webConsoleArray = this.webConsoleComponents();
        if (webConsoleArray && webConsoleArray[index]) {
          webConsoleArray[index].focusTerminal();
        }
      });
    });
  }

  enableScroll(e: Event): void {
    this.mapSettingsService.isScrollDisabled.next(false);
  }

  disableScroll(e: Event): void {
    this.mapSettingsService.isScrollDisabled.next(true);
  }

  /**
   * Handle window resize events to keep Console within viewport boundaries
   * This ensures the window stays visible when browser window is resized
   */
  @HostListener('window:resize')
  onWindowResize(): void {
    // Skip if minimized
    if (this.isMinimizedSignal()) {
      return;
    }

    // Re-constrain window position to stay within viewport
    this.style = this.boundaryService.constrainWindowPosition(this.style);
  }

  /**
   * Cleanup on component destroy
   */
  ngAfterViewInit(): void {
    // Apply initial styles to DOM (no ngStyle binding)
    this.applyStyleToElement(this.style);

    // Setup drag handling using RxJS (Zoneless best practice)
    this.setupDragHandling();

    // Notify xterm to resize after child components are initialized
    // Use requestAnimationFrame to ensure DOM is fully rendered
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (this.isMaximizedSignal()) {
          const toolbarHeight = window.innerWidth <= 768 ? 56 : 64;
          const windowHeight = window.innerHeight;
          const newHeight = windowHeight - toolbarHeight - 20;
          this.consoleService.consoleResized.next({
            width: this.resizedWidth,
            height: newHeight - this.CONSOLE_HEADER_HEIGHT,
          });
        } else {
          this.consoleService.consoleResized.next({
            width: this.resizedWidth,
            height: this.resizedHeight - this.CONSOLE_HEADER_HEIGHT,
          });
        }
      });
    });
  }

  /**
   * Setup drag handling using RxJS with animationFrameScheduler
   * This is the Zoneless + Angular 17+ best practice
   */
  private setupDragHandling(): void {
    const consoleElement = this.consoleWrapper()?.nativeElement;
    if (!consoleElement) return;

    const headerElement = consoleElement.querySelector('.consoleHeader') as HTMLElement;
    if (!headerElement) return;

    const mouseDown$ = fromEvent<MouseEvent>(headerElement, 'mousedown');
    const mouseMove$ = fromEvent<MouseEvent>(document, 'mousemove');
    const mouseUp$ = fromEvent<MouseEvent>(document, 'mouseup');

    mouseDown$
      .pipe(
        tap((e) => {
          // Prevent default and prepare for drag
          e.preventDefault();
          this.isDraggingSignal.set(true);
          this.cdr.markForCheck(); // Trigger CD once for class update

          // Record starting positions
          this.dragStartX = e.clientX;
          this.dragStartY = e.clientY;
          this.dragStartLeft = Number(this.style.left?.split('px')[0]) || 0;
          this.dragStartBottom = Number(this.style.bottom?.split('px')[0]) || 0;

          // Disable iframe pointer events during drag
          this.setIframePointerEvents('none');
        }),
        switchMap(() =>
          mouseMove$.pipe(
            // Use auditTime(0, animationFrameScheduler) for 60fps throttling
            auditTime(0, animationFrameScheduler),
            takeUntil(
              mouseUp$.pipe(
                tap(() => {
                  this.onDragEnd();
                })
              )
            )
          )
        ),
        takeUntil(this.destroy$)
      )
      .subscribe((e) => {
        // Calculate movement delta
        const deltaX = e.clientX - this.dragStartX;
        const deltaY = e.clientY - this.dragStartY;

        // Calculate new position
        let newLeft = this.dragStartLeft + deltaX;
        let newBottom = this.dragStartBottom - deltaY;

        // Constrain to viewport (respecting toolbar)
        const width = this.resizedWidth;
        const height = this.isMinimizedSignal() ? 48 : this.resizedHeight;
        const maxLeft = window.innerWidth - width;
        const topOffset = this.boundaryService.getConfigValue().topOffset || 0;
        const maxBottom = window.innerHeight - height - topOffset;

        newLeft = Math.max(0, Math.min(maxLeft, newLeft));
        newBottom = Math.max(0, Math.min(maxBottom, newBottom));

        // Apply directly to DOM (no CD trigger, pure performance)
        this.renderer.setStyle(consoleElement, 'left', `${newLeft}px`);
        this.renderer.setStyle(consoleElement, 'bottom', `${newBottom}px`);

        // Keep state in sync for other operations (resize, minimize, etc)
        this.style.left = `${newLeft}px`;
        this.style.bottom = `${newBottom}px`;
      });
  }

  /**
   * Handle drag end - restore iframe pointer events and save state
   */
  private onDragEnd(): void {
    this.isDraggingSignal.set(false);
    this.setIframePointerEvents('');
    this.cdr.markForCheck(); // Trigger CD once to remove is-dragging class
    this.saveWindowState();
  }

  /**
   * Set pointer events on iframes (to prevent event capture during drag)
   */
  private setIframePointerEvents(value: 'none' | ''): void {
    const consoleElement = this.consoleWrapper()?.nativeElement;
    if (!consoleElement) return;

    consoleElement.querySelectorAll('iframe').forEach((iframe: HTMLElement) => {
      this.renderer.setStyle(iframe, 'pointer-events', value);
    });
  }

  ngOnDestroy(): void {
    // Cleanup theme subscription
    if (this.themeSubscription) {
      this.themeSubscription.unsubscribe();
      this.themeSubscription = null;
    }

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
        this.resizedWidth = state.width || this.DEFAULT_WIDTH;
        this.resizedHeight = state.height || this.DEFAULT_HEIGHT;
        this.isMaximizedSignal.set(state.isMaximized || false);

        // Apply window state
        if (this.isMaximizedSignal()) {
          // Restore to maximized state
          const toolbarHeight = window.innerWidth <= 768 ? 56 : 64;
          const windowHeight = window.innerHeight;
          const newHeight = windowHeight - toolbarHeight - 20;
          this.style = {
            bottom: '0px',
            left: this.DEFAULT_LEFT,
            width: `${this.resizedWidth}px`,
            height: `${newHeight}px`,
          };
        } else {
          // Restore to normal state with saved position - default moved up to 100px
          this.style = {
            bottom: state.bottom || this.DEFAULT_BOTTOM,
            left: state.left || this.DEFAULT_LEFT,
            width: `${this.resizedWidth}px`,
            height: `${this.resizedHeight}px`,
          };
        }
      } else {
        // Default state - moved up from 20px to 100px to avoid bottom button overlap
        this.style = {
          bottom: this.DEFAULT_BOTTOM,
          left: this.DEFAULT_LEFT,
          width: `${this.DEFAULT_WIDTH}px`,
          height: `${this.DEFAULT_HEIGHT}px`,
        };
      }
    } catch (e) {
      // Error reading from localStorage, use defaults - moved up from 20px to 100px
      this.style = {
        bottom: this.DEFAULT_BOTTOM,
        left: this.DEFAULT_LEFT,
        width: `${this.DEFAULT_WIDTH}px`,
        height: `${this.DEFAULT_HEIGHT}px`,
      };
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
        bottom: this.style.bottom,
        left: this.style.left,
        isMaximized: this.isMaximizedSignal(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      // Error saving to localStorage, ignore
    }
  }
}
