import { ChangeDetectorRef, Component, ComponentFactory, ComponentRef, Input, OnInit, ViewChild, ViewContainerRef } from '@angular/core';
import { MatMenuTrigger } from '@angular/material/menu';
import { DomSanitizer } from '@angular/platform-browser';
import { Node } from '../../../cartography/models/node';
import { Server } from '../../../models/server';
import { Project } from '../../../models/project';
import { MapSettingsService } from '../../../services/mapsettings.service';
import { ElectronService } from 'ngx-electron';
import { NodeConsoleService } from '../../../services/nodeConsole.service';
import { ToasterService } from '../../../services/toaster.service';
import { Router } from '@angular/router';
import { ComponentFactoryResolver } from '@angular/core';
import { ConsoleDeviceActionComponent } from '../context-menu/actions/console-device-action/console-device-action.component';
import { ConsoleDeviceActionBrowserComponent } from '../context-menu/actions/console-device-action-browser/console-device-action-browser.component';

@Component({
  selector: 'app-context-console-menu',
  templateUrl: './context-console-menu.component.html',
  styleUrls: ['./context-console-menu.component.scss']
})
export class ContextConsoleMenuComponent implements OnInit {
  @Input() project: Project;
  @Input() server: Server;
  @ViewChild(MatMenuTrigger) contextConsoleMenu: MatMenuTrigger;
  @ViewChild("container", { read: ViewContainerRef }) container;
  componentRef: ComponentRef<ConsoleDeviceActionComponent>;
  componentBrowserRef: ComponentRef<ConsoleDeviceActionBrowserComponent>;

  topPosition;
  leftPosition;
  isElectronApp = false;
  node: Node;;

  constructor(
    private sanitizer: DomSanitizer,
    private changeDetector: ChangeDetectorRef,
    private mapSettingsService: MapSettingsService,
    private electronService: ElectronService,
    private consoleService: NodeConsoleService,
    private toasterService: ToasterService,
    private router: Router,
    private resolver: ComponentFactoryResolver
  ) {}

  ngOnInit() {
    this.setPosition(0, 0);
    this.isElectronApp = this.electronService.isElectronApp;
  }

  public setPosition(top: number, left: number) {
    this.topPosition = this.sanitizer.bypassSecurityTrustStyle(top + 'px');
    this.leftPosition = this.sanitizer.bypassSecurityTrustStyle(left + 'px');
    this.changeDetector.detectChanges();
  }

  public openMenu(node: Node, top: number, left: number) {
    this.node = node;
    let action = this.mapSettingsService.getConsoleContextManuAction();
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
      if (this.isElectronApp) {
        const factory: ComponentFactory<ConsoleDeviceActionComponent> = this.resolver.resolveComponentFactory(ConsoleDeviceActionComponent);
        this.componentRef = this.container.createComponent(factory);
        this.componentRef.instance.server = this.server;
        this.componentRef.instance.nodes = [this.node];

        this.componentRef.instance.console();
      } else {
        const factory: ComponentFactory<ConsoleDeviceActionBrowserComponent> = this.resolver.resolveComponentFactory(ConsoleDeviceActionBrowserComponent);
        this.componentBrowserRef = this.container.createComponent(factory);
        this.componentBrowserRef.instance.server = this.server;
        this.componentBrowserRef.instance.node = this.node;

        this.componentBrowserRef.instance.openConsole();
      }
  }

  openWebConsole() {
    this.mapSettingsService.setConsoleContextMenuAction('web console');
    if (this.node.status === 'started') {
        this.mapSettingsService.logConsoleSubject.next(true);
        this.consoleService.openConsoleForNode(this.node);
    } else {
        this.toasterService.error('To open console please start the node');
    }
  }

  openWebConsoleInNewTab() {
    this.mapSettingsService.setConsoleContextMenuAction('web console in new tab');
    if (this.node.status === 'started') {
        let url = this.router.url.split('/');
        let urlString = `/static/web-ui/${url[1]}/${url[2]}/${url[3]}/${url[4]}/nodes/${this.node.node_id}`
        window.open(urlString);
    } else {
        this.toasterService.error('To open console please start the node');
    }
  }
}