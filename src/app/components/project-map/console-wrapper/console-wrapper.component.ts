import { Component, EventEmitter, Input, OnInit, Output, OnDestroy, HostListener, ChangeDetectorRef, ViewChildren, QueryList } from '@angular/core';
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
export class ConsoleWrapperComponent implements OnInit, OnDestroy {

  private destroy$ = new Subject<void>();
  @Input() controller: Controller;
  @Input() project: Project;
  @Output() closeConsole = new EventEmitter<boolean>();

  filters: string[] = ['all', 'errors', 'warnings', 'info', 'map updates', 'controller requests'];
  selectedFilter: string = 'all';

  public style: object = {};
  public styleInside: object = { height: `120px` };
  public isDraggingEnabled: boolean = false;
  public isLightThemeEnabled: boolean = false;
  public isMinimized: boolean = false;
  public isConsoleActive: boolean = false;

  public resizedWidth: number = 800;
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
    this.style = { bottom: '20px', left: '80px', width: '800px', height: '600px' };

    // Set top offset to keep console below toolbar (64px for desktop, 56px for mobile)
    const toolbarHeight = window.innerWidth <= 768 ? 56 : 64;
    this.boundaryService.setConfig({ topOffset: toolbarHeight });

    this.consoleService.nodeConsoleTrigger.subscribe((node) => {
      this.addTab(node, true);
    });

    this.consoleService.closeNodeConsoleTrigger.subscribe((node) => {
      let index = this.nodes.findIndex((n) => n.node_id === node.node_id);
      this.removeTab(index);
    });
  }

  minimize(value: boolean) {
    this.isMinimized = value;
    if (!value) {
      this.style = { bottom: '20px', left: '80px', width: `${this.resizedWidth}px`, height: `${this.resizedHeight}px` };
    } else {
      this.style = { bottom: '20px', left: '20px', width: `${this.resizedWidth}px`, height: '56px' };
    }
  }

  addTab(node: Node, selectAfterAdding: boolean) {
    this.minimize(false);

    // Check if node already exists in tabs
    const existingIndex = this.nodes.findIndex(n => n.node_id === node.node_id);

    if (existingIndex >= 0) {
      // Node already exists, just switch to that tab
      if (selectAfterAdding) {
        this.selected.setValue(existingIndex + 1); // +1 because index 0 is GNS3 console
      }
    } else {
      // Add new tab
      this.nodes.push(node);

      if (selectAfterAdding) {
        this.selected.setValue(this.nodes.length);
      }

      this.consoleService.openConsoles++;
    }
  }

  removeTab(index: number) {
    this.nodes.splice(index, 1);
    this.consoleService.openConsoles--;
  }

  toggleDragging(value: boolean) {
    this.isDraggingEnabled = value;
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
  }

  close() {
    this.closeConsole.emit(false);
  }

  /**
   * Handle device selection from devices panel
   */
  onDeviceSelected(node: Node): void {
    this.addTab(node, true);
  }

  /**
   * Handle keyboard shortcuts for tab switching
   * Alt+1-9 to switch to console tabs
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
    const tabIndex = parseInt(key) - 1; // Alt+1 = tab 0 (GNS3 console), Alt+2 = tab 1, etc.
    this.switchToTab(tabIndex);
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
        this.isConsoleActive = false;
        this.cdr.markForCheck();
      }
    }, 0);
  }

  /**
   * Switch to specific tab by index
   * @param index Tab index (0 = GNS3 console, 1-9 = device consoles)
   */
  switchToTab(index: number): void {
    if (index < 0 || index > this.nodes.length) {
      return; // Invalid index
    }
    this.selected.setValue(index);

    // Auto-focus xterm when switching to device console tab (not GNS3 console)
    if (index > 0 && this.webConsoleComponents) {
      // Use setTimeout to ensure DOM has updated before focusing
      setTimeout(() => {
        const consoleIndex = index - 1; // Tab 1 = nodes[0], Tab 2 = nodes[1], etc.
        const webConsoleArray = this.webConsoleComponents.toArray();
        if (webConsoleArray[consoleIndex]) {
          webConsoleArray[consoleIndex].focusTerminal();
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
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
