import { Component, EventEmitter, HostListener, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { ResizeEvent } from 'angular-resizable-element';
import { Subscription } from 'rxjs';
import { Node } from '../../../cartography/models/node';
import { Project } from '@models/project';
import { Controller } from '@models/controller';
import { MapSettingsService } from '@services/mapsettings.service';
import { NodeConsoleService } from '@services/nodeConsole.service';
import { ThemeService } from '@services/theme.service';
import {
  DEFAULT_CONSOLE_BACKGROUND_COLOR,
  DEFAULT_CONSOLE_FOREGROUND_COLOR,
  loadConsoleColors,
  saveConsoleColors,
} from '@services/terminal/ghostty-console-helpers';

@Component({
  selector: 'app-console-wrapper',
  templateUrl: './console-wrapper.component.html',
  styleUrls: ['./console-wrapper.component.scss'],
})
export class ConsoleWrapperComponent implements OnInit, OnDestroy {
  @Input() controller: Controller;
  @Input() project: Project;
  @Output() closeConsole = new EventEmitter<boolean>();

  public style: object = {};
  public isDraggingEnabled: boolean = false;
  public isLightThemeEnabled: boolean = false;
  public isMinimized: boolean = false;
  public isColorPickerOpen: boolean = false;
  public consoleForegroundColor: string = DEFAULT_CONSOLE_FOREGROUND_COLOR;
  public consoleBackgroundColor: string = DEFAULT_CONSOLE_BACKGROUND_COLOR;

  public resizedWidth: number = 800;
  public resizedHeight: number = 480;
  private readonly consoleHeaderHeight: number = 40;
  private readonly subscriptions: Subscription = new Subscription();

  constructor(
    private consoleService: NodeConsoleService,
    private themeService: ThemeService,
    private mapSettingsService: MapSettingsService
  ) {}

  nodes: Node[] = [];
  selected = new UntypedFormControl(0);

  ngOnInit() {
    const storedColors = loadConsoleColors();
    this.consoleForegroundColor = storedColors.foregroundColor;
    this.consoleBackgroundColor = storedColors.backgroundColor;

    this.themeService.getActualTheme() === 'light'
      ? (this.isLightThemeEnabled = true)
      : (this.isLightThemeEnabled = false);
    this.style = { bottom: '20px', left: '80px', width: '800px', height: '460px' };

    this.subscriptions.add(
      this.consoleService.nodeConsoleTrigger.subscribe((node) => {
        this.addTab(node, true);
      })
    );

    this.subscriptions.add(
      this.consoleService.closeNodeConsoleTrigger.subscribe((node) => {
        let index = this.nodes.findIndex((n) => n.node_id === node.node_id);
        if (index >= 0) {
          this.removeTab(index);
        }
      })
    );
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  minimize(value: boolean) {
    this.isMinimized = value;
    if (!value) {
      this.style = { bottom: '20px', left: '80px', width: `${this.resizedWidth}px`, height: `${this.resizedHeight}px` };
    } else {
      this.style = {
        bottom: '20px',
        left: '20px',
        width: `${this.resizedWidth}px`,
        height: `${this.consoleHeaderHeight}px`,
      };
    }
  }

  addTab(node: Node, selectAfterAdding: boolean) {
    this.minimize(false);
    this.nodes.push(node);

    if (selectAfterAdding) {
      this.selected.setValue(this.nodes.length);
    }

    this.consoleService.openConsoles++;
  }

  removeTab(index: number) {
    if (index < 0 || index >= this.nodes.length) {
      return;
    }

    this.nodes.splice(index, 1);

    this.consoleService.openConsoles = Math.max(0, this.consoleService.openConsoles - 1);

    const maxSelectedIndex = this.nodes.length;
    if (this.selected.value > maxSelectedIndex) {
      this.selected.setValue(maxSelectedIndex);
    }
  }

  onHeaderMouseDown(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (target.closest('button, input, .color-picker-popover')) {
      return;
    }

    this.toggleDragging(true);
  }

  toggleColorPicker(event: MouseEvent) {
    event.stopPropagation();
    this.isColorPickerOpen = !this.isColorPickerOpen;
  }

  @HostListener('document:mousedown', ['$event'])
  onDocumentMouseDown(event: MouseEvent) {
    if (!this.isColorPickerOpen) {
      return;
    }

    const target = event.target as HTMLElement;
    if (target?.closest('.color-picker-wrapper')) {
      return;
    }

    this.isColorPickerOpen = false;
  }

  onForegroundColorInput(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    if (value) {
      this.consoleForegroundColor = value;
      this.persistConsoleColors();
    }
  }

  onBackgroundColorInput(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    if (value) {
      this.consoleBackgroundColor = value;
      this.persistConsoleColors();
    }
  }

  resetConsoleColors() {
    this.consoleForegroundColor = DEFAULT_CONSOLE_FOREGROUND_COLOR;
    this.consoleBackgroundColor = DEFAULT_CONSOLE_BACKGROUND_COLOR;
    this.persistConsoleColors();
  }

  private persistConsoleColors() {
    saveConsoleColors({
      foregroundColor: this.consoleForegroundColor,
      backgroundColor: this.consoleBackgroundColor,
    });
  }

  toggleDragging(value: boolean) {
    this.isDraggingEnabled = value;
  }

  dragWidget(event) {
    let x: number = Number(event.movementX);
    let y: number = Number(event.movementY);

    let width: number = Number(this.style['width'].split('px')[0]);
    let height: number = Number(this.style['height'].split('px')[0]);
    let left: number = Number(this.style['left'].split('px')[0]) + x;
    if (this.style['top']) {
      let top: number = Number(this.style['top'].split('px')[0]) + y;
      this.style = {
        position: 'fixed',
        left: `${left}px`,
        top: `${top}px`,
        width: `${width}px`,
        height: `${height}px`,
      };
    } else {
      let bottom: number = Number(this.style['bottom'].split('px')[0]) - y;
      this.style = {
        position: 'fixed',
        left: `${left}px`,
        bottom: `${bottom}px`,
        width: `${width}px`,
        height: `${height}px`,
      };
    }
  }

  validate(event: ResizeEvent): boolean {
    if (
      event.rectangle.width &&
      event.rectangle.height &&
      (event.rectangle.width < 500 || event.rectangle.height < 100)
    ) {
      return false;
    }
    return true;
  }

  onResizeEnd(event: ResizeEvent): void {
    this.style = {
      position: 'fixed',
      left: `${event.rectangle.left}px`,
      top: `${event.rectangle.top}px`,
      width: `${event.rectangle.width}px`,
      height: `${event.rectangle.height}px`,
    };

    this.consoleService.consoleResized.next({
      width: event.rectangle.width,
      height: Math.max(1, event.rectangle.height - this.consoleHeaderHeight),
    });

    this.resizedWidth = event.rectangle.width;
    this.resizedHeight = event.rectangle.height;
  }

  close() {
    this.closeConsole.emit(false);
  }

  enableScroll() {
    this.mapSettingsService.isScrollDisabled.next(false);
  }

  disableScroll() {
    this.mapSettingsService.isScrollDisabled.next(true);
  }
}
