import {
  ChangeDetectorRef,
  Component,
  ComponentRef,
  Input,
  OnInit,
  ViewContainerRef,
  inject,
  input,
  viewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { Node } from '../../../cartography/models/node';
import { Project } from '@models/project';
import { Controller } from '@models/controller';
import { MapSettingsService } from '@services/mapsettings.service';
import { NodeConsoleService } from '@services/nodeConsole.service';
import { ToasterService } from '@services/toaster.service';
import { VncConsoleService } from '@services/vnc-console.service';
import { ConsoleDeviceActionBrowserComponent } from '../context-menu/actions/console-device-action-browser/console-device-action-browser.component';

@Component({
  standalone: true,
  selector: 'app-context-console-menu',
  templateUrl: './context-console-menu.component.html',
  styleUrls: ['./context-console-menu.component.scss'],
  imports: [CommonModule, MatMenuModule, MatIconModule],
})
export class ContextConsoleMenuComponent implements OnInit {
  private sanitizer = inject(DomSanitizer);
  private changeDetector = inject(ChangeDetectorRef);
  private mapSettingsService = inject(MapSettingsService);
  private consoleService = inject(NodeConsoleService);
  private toasterService = inject(ToasterService);
  private router = inject(Router);
  private vncConsoleService = inject(VncConsoleService);

  readonly project = input<Project>(undefined);
  @Input() controller: Controller;
  readonly contextConsoleMenu = viewChild(MatMenuTrigger);
  readonly container = viewChild('container', { read: ViewContainerRef });
  componentBrowserRef: ComponentRef<ConsoleDeviceActionBrowserComponent>;

  topPosition;
  leftPosition;
  node: Node;

  constructor() {}

  ngOnInit() {
    this.setPosition(0, 0);
  }

  public setPosition(top: number, left: number) {
    this.topPosition = this.sanitizer.bypassSecurityTrustStyle(top + 'px');
    this.leftPosition = this.sanitizer.bypassSecurityTrustStyle(left + 'px');
    this.changeDetector.detectChanges();
  }

  public openMenu(node: Node, top: number, left: number) {
    this.node = node;
    let action = this.mapSettingsService.getConsoleContextMenuAction();
    if (action) {
      if (action === 'web console') {
        this.openWebConsole();
      } else if (action === 'web console in new tab') {
        this.openWebConsoleInNewTab();
      } else if (action === 'console') {
        this.openConsole();
      }
    } else {
      this.setPosition(top, left);
      this.contextConsoleMenu().openMenu();
    }
  }

  openConsole() {
    this.mapSettingsService.setConsoleContextMenuAction('console');
    // Use Ivy's new API - no need for resolveComponentFactory
    this.componentBrowserRef = this.container().createComponent(ConsoleDeviceActionBrowserComponent);
    this.componentBrowserRef.setInput('controller', this.controller);
    this.componentBrowserRef.setInput('node', this.node);
    this.componentBrowserRef.instance.openConsole();
  }

  openWebConsole() {
    this.mapSettingsService.setConsoleContextMenuAction('web console');
    if (this.node.status === 'started') {
      // Check console type to determine how to open the console
      if (this.node.console_type === 'vnc') {
        // VNC console: use standalone page
        this.vncConsoleService.openVncConsole(this.controller, this.node);
      } else if (this.node.console_type && this.node.console_type.startsWith('spice')) {
        // SPICE console: not yet implemented
        this.toasterService.error('SPICE console is not yet supported.');
      } else {
        // Telnet and other types: use embedded console
        this.mapSettingsService.logConsoleSubject.next(true);
        this.consoleService.openConsoleForNode(this.node);
      }
    } else {
      this.toasterService.error('To open console please start the node');
    }
  }

  openWebConsoleInNewTab() {
    this.mapSettingsService.setConsoleContextMenuAction('web console in new tab');
    if (this.node.status === 'started') {
      // Check console type to determine how to open the console
      if (this.node.console_type === 'vnc') {
        // VNC console: use standalone page (same as web console)
        this.vncConsoleService.openVncConsole(this.controller, this.node);
      } else if (this.node.console_type && this.node.console_type.startsWith('spice')) {
        // SPICE console: not yet implemented
        this.toasterService.error('SPICE console is not yet supported.');
      } else if (this.node.console_type === 'telnet') {
        // Telnet console: use existing URL-based approach
        let url = this.router.url.split('/');
        let urlString = `/static/web-ui/${url[1]}/${url[2]}/${url[3]}/${url[4]}/nodes/${this.node.node_id}`;
        window.open(urlString);
      } else {
        this.toasterService.error('Console type not supported in new tab');
      }
    } else {
      this.toasterService.error('To open console please start the node');
    }
  }
}
