import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { ResizeEvent } from 'angular-resizable-element';
import { Node } from '../../../cartography/models/node';
import { Project } from '../../../models/project';
import{ Controller } from '../../../models/controller';
import { MapSettingsService } from '../../../services/mapsettings.service';
import { NodeConsoleService } from '../../../services/nodeConsole.service';
import { ThemeService } from '../../../services/theme.service';

@Component({
  selector: 'app-console-wrapper',
  templateUrl: './console-wrapper.component.html',
  styleUrls: ['./console-wrapper.component.scss'],
})
export class ConsoleWrapperComponent implements OnInit {
  @Input() controller:Controller ;
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
    private mapSettingsService: MapSettingsService
  ) {}

  nodes: Node[] = [];
  selected = new UntypedFormControl(0);

  ngOnInit() {
    this.themeService.getActualTheme() === 'light'
      ? (this.isLightThemeEnabled = true)
      : (this.isLightThemeEnabled = false);
    this.style = { bottom: '20px', left: '80px', width: '720px', height: '460px' };

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
    this.nodes.push(node);

    if (selectAfterAdding) {
      this.selected.setValue(this.nodes.length);
    }

    this.consoleService.openConsoles++;
  }

  removeTab(index: number) {
    this.nodes.splice(index, 1);
    this.consoleService.openConsoles--;
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

    this.styleInside = {
      height: `${event.rectangle.height - 60}px`,
      width: `${event.rectangle.width}px`,
    };

    this.consoleService.consoleResized.next({
      width: event.rectangle.width,
      height: event.rectangle.height - 53,
    });

    this.resizedWidth = event.rectangle.width;
    this.resizedHeight = event.rectangle.height;
  }

  close() {
    this.closeConsole.emit(false);
  }

  enableScroll(e) {
    this.mapSettingsService.isScrollDisabled.next(false);
  }

  disableScroll(e) {
    this.mapSettingsService.isScrollDisabled.next(true);
  }
}
