import { Component, EventEmitter, Input, OnInit, Output, OnDestroy, HostListener } from '@angular/core';
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

  public resizedWidth: number = 720;
  public resizedHeight: number = 480;

  constructor(
    private consoleService: NodeConsoleService,
    private themeService: ThemeService,
    private mapSettingsService: MapSettingsService,
    private boundaryService: WindowBoundaryService
  ) {}

  nodes: Node[] = [];
  selected = new UntypedFormControl(0);

  ngOnInit() {
    this.themeService.getActualTheme() === 'light'
      ? (this.isLightThemeEnabled = true)
      : (this.isLightThemeEnabled = false);
    this.style = { bottom: '20px', left: '80px', width: '720px', height: '460px' };

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
