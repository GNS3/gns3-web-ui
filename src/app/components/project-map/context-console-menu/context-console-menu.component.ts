import {
  ChangeDetectorRef,
  Component,
  ComponentFactory,
  ComponentFactoryResolver,
  ComponentRef,
  Input,
  OnInit,
  ViewChild,
  ViewContainerRef,
} from '@angular/core';
import { MatMenuTrigger } from '@angular/material/menu';
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
  selector: 'app-context-console-menu',
  templateUrl: './context-console-menu.component.html',
  styleUrls: ['./context-console-menu.component.scss'],
})
export class ContextConsoleMenuComponent implements OnInit {
  @Input() project: Project;
  @Input() controller: Controller;
  @ViewChild(MatMenuTrigger) contextConsoleMenu: MatMenuTrigger;
  @ViewChild('container', { read: ViewContainerRef }) container;
  componentBrowserRef: ComponentRef<ConsoleDeviceActionBrowserComponent>;

  topPosition;
  leftPosition;
  node: Node;

  constructor(
    private sanitizer: DomSanitizer,
    private changeDetector: ChangeDetectorRef,
    private mapSettingsService: MapSettingsService,
    private consoleService: NodeConsoleService,
    private toasterService: ToasterService,
    private router: Router,
    private resolver: ComponentFactoryResolver,
    private vncConsoleService: VncConsoleService
  ) {}

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
      this.contextConsoleMenu.openMenu();
    }
  }

  openConsole() {
    this.mapSettingsService.setConsoleContextMenuAction('console');
    const factory: ComponentFactory<ConsoleDeviceActionBrowserComponent> = this.resolver.resolveComponentFactory(
      ConsoleDeviceActionBrowserComponent
    );
    this.componentBrowserRef = this.container.createComponent(factory);
    this.componentBrowserRef.instance.controller = this.controller;
    this.componentBrowserRef.instance.node = this.node;
    this.componentBrowserRef.instance.openConsole();
  }

  openWebConsole() {
    this.mapSettingsService.setConsoleContextMenuAction('web console');
    if (this.node.status === 'started') {
      // Check console type to determine how to open the console
      if (this.node.console_type === 'vnc') {
        // VNC console: use standalone page
        this.vncConsoleService.openVncConsole(this.controller, this.node);
      } else if (this.node.console_type.startsWith('spice')) {
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
      } else if (this.node.console_type.startsWith('spice')) {
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
