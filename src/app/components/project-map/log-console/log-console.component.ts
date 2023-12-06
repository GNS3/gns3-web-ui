import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  Input,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { FormControl } from '@angular/forms';
import { Subscription } from 'rxjs';
import { NodesDataSource } from '../../../cartography/datasources/nodes-datasource';
import { Drawing } from '../../../cartography/models/drawing';
import { Node } from '../../../cartography/models/node';
import { ProjectWebServiceHandler } from '../../../handlers/project-web-service-handler';
import { Link } from '../../../models/link';
import { LogEvent } from '../../../models/logEvent';
import { Port } from '../../../models/port';
import { Project } from '../../../models/project';
import { Server } from '../../../models/server';
import { HttpServer } from '../../../services/http-server.service';
import { NodeService } from '../../../services/node.service';
import { NodeConsoleService } from '../../../services/nodeConsole.service';
import { ThemeService } from '../../../services/theme.service';
import { version } from '../../../version';
import { LogEventsDataSource } from './log-events-datasource';
import * as ipaddr from 'ipaddr.js';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-log-console',
  templateUrl: './log-console.component.html',
  styleUrls: ['./log-console.component.scss'],
})
export class LogConsoleComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() server: Server;
  @Input() project: Project;

  @ViewChild('console') console: ElementRef;

  private version = version;
  private nodeSubscription: Subscription;
  private linkSubscription: Subscription;
  private drawingSubscription: Subscription;
  private serverRequestsSubscription: Subscription;
  private errorSubscription: Subscription;
  private warningSubscription: Subscription;
  private infoSubscription: Subscription;

  public command: string = '';
  public filters: string[] = ['all', 'errors', 'warnings', 'info', 'map updates', 'server requests'];
  public selectedFilter: string = 'all';
  public filteredEvents: LogEvent[] = [];

  private regexStart: RegExp = /^start (.*?)$/;
  private regexStop: RegExp = /^stop (.*?)$/;
  private regexSuspend: RegExp = /^suspend (.*?)$/;
  private regexReload: RegExp = /^reload (.*?)$/;
  private regexShow: RegExp = /^show (.*?)$/;
  private regexConsole: RegExp = /^console (.*?)$/;

  public style: object = {};
  public isDraggingEnabled: boolean = false;
  public isLightThemeEnabled: boolean = false;
  public selected = new FormControl(0);

  constructor(
    private projectWebServiceHandler: ProjectWebServiceHandler,
    private nodeService: NodeService,
    private nodesDataSource: NodesDataSource,
    private logEventsDataSource: LogEventsDataSource,
    private httpService: HttpServer,
    private themeService: ThemeService,
    private cd: ChangeDetectorRef,
    private nodeConsoleService: NodeConsoleService,
    private changeDetectorRef: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.nodeConsoleService.consoleResized.subscribe((ev) => {
      this.style = { bottom: '20px', left: '20px', width: `${ev.width}px`, height: `${ev.height - 70}px` };
      this.changeDetectorRef.detectChanges();
    });

    this.themeService.getActualTheme() === 'light'
      ? (this.isLightThemeEnabled = true)
      : (this.isLightThemeEnabled = false);
    this.style = { bottom: '20px', left: '20px', width: '720px', height: '340px' };

    this.nodeSubscription = this.projectWebServiceHandler.nodeNotificationEmitter.subscribe((event) => {
      let node: Node = event.event as Node;
      let message: string = '';

      if (node.label) {
        message = `Event received: ${event.action} - ${this.printNode(node)}.`;
      } else {
        message = `Event received: ${event.action} - ${node.name}.`;
      }

      this.showMessage({
        type: 'map update',
        message: message,
      });
    });
    this.linkSubscription = this.projectWebServiceHandler.linkNotificationEmitter.subscribe((event) => {
      let link: Link = event.event as Link;
      let message = `Event received: ${event.action} - ${this.printLink(link)}.`;
      this.showMessage({
        type: 'map update',
        message: message,
      });
    });
    this.drawingSubscription = this.projectWebServiceHandler.drawingNotificationEmitter.subscribe((event) => {
      let drawing: Drawing = event.event as Drawing;
      let message = `Event received: ${event.action} - ${this.printDrawing(drawing)}.`;
      this.showMessage({
        type: 'map update',
        message: message,
      });
    });
    this.serverRequestsSubscription = this.httpService.requestsNotificationEmitter.subscribe((message) => {
      this.showMessage({
        type: 'server request',
        message: message,
      });
    });
    this.errorSubscription = this.projectWebServiceHandler.errorNotificationEmitter.subscribe((message) => {
      this.showMessage({
        type: 'error',
        message: message,
      });
    });
    this.warningSubscription = this.projectWebServiceHandler.warningNotificationEmitter.subscribe((message) => {
      this.showMessage({
        type: 'warning',
        message: message,
      });
    });
    this.infoSubscription = this.projectWebServiceHandler.infoNotificationEmitter.subscribe((message) => {
      this.showMessage({
        type: 'info',
        message: message,
      });
    });
  }

  ngAfterViewInit() {
    if (this.console.nativeElement) this.console.nativeElement.scrollTop = this.console.nativeElement.scrollHeight;
  }

  ngOnDestroy() {
    this.nodeSubscription.unsubscribe();
    this.linkSubscription.unsubscribe();
    this.drawingSubscription.unsubscribe();
    this.serverRequestsSubscription.unsubscribe();
    this.errorSubscription.unsubscribe();
    this.warningSubscription.unsubscribe();
    this.infoSubscription.unsubscribe();
  }

  applyFilter(filter: string) {
    this.selectedFilter = filter;
    this.filteredEvents = this.getFilteredEvents();
    this.cd.detectChanges();
  }

  onKeyDown(event) {
    if (event.key === 'Enter') {
      this.handleCommand();
    }
  }

  handleCommand() {
    if (this.command === 'help' || this.command === '') {
      this.showCommand(
        'Available commands: help, version, console {node name}, start all, start {node name}, stop all, stop {node name}, suspend all, suspend {node name}, reload all, reload {node name}, show {node name}.'
      );
    } else if (this.command === 'version') {
      this.showCommand('Current version: ' + this.version);
    } else if (this.command === 'start all') {
      this.showCommand('Starting all nodes...');
      this.nodeService.startAll(this.server, this.project).subscribe(() => {
        this.showCommand('All nodes started.');
      });
    } else if (this.command === 'stop all') {
      this.showCommand('Stopping all nodes...');
      this.nodeService.stopAll(this.server, this.project).subscribe(() => {
        this.showCommand('All nodes stopped.');
      });
    } else if (this.command === 'suspend all') {
      this.showCommand('Suspending all nodes...');
      this.nodeService.suspendAll(this.server, this.project).subscribe(() => {
        this.showCommand('All nodes suspended.');
      });
    } else if (this.command === 'reload all') {
      this.showCommand('Reloading all nodes...');
      this.nodeService.reloadAll(this.server, this.project).subscribe(() => {
        this.showCommand('All nodes reloaded.');
      });
    } else if (
      this.regexStart.test(this.command) ||
      this.regexStop.test(this.command) ||
      this.regexSuspend.test(this.command) ||
      this.regexReload.test(this.command) ||
      this.regexShow.test(this.command) ||
      this.regexConsole.test(this.command)
    ) {
      let splittedCommand = this.command.split(/[ ,]+/);
      let node = this.nodesDataSource.getItems().find((n) => n.name.valueOf() === splittedCommand[1].valueOf());
      if (node) {
        if (this.regexStart.test(this.command)) {
          this.showCommand(`Starting node ${splittedCommand[1]}...`);
          this.nodeService.start(this.server, node).subscribe(() => this.showCommand(`Node ${node.name} started.`));
        } else if (this.regexStop.test(this.command)) {
          this.showCommand(`Stopping node ${splittedCommand[1]}...`);
          this.nodeService.stop(this.server, node).subscribe(() => this.showCommand(`Node ${node.name} stopped.`));
        } else if (this.regexSuspend.test(this.command)) {
          this.showCommand(`Suspending node ${splittedCommand[1]}...`);
          this.nodeService.suspend(this.server, node).subscribe(() => this.showCommand(`Node ${node.name} suspended.`));
        } else if (this.regexReload.test(this.command)) {
          this.showCommand(`Reloading node ${splittedCommand[1]}...`);
          this.nodeService.reload(this.server, node).subscribe(() => this.showCommand(`Node ${node.name} reloaded.`));
        } else if (this.regexConsole.test(this.command)) {
          if (node.status === 'started') {
            this.showCommand(`Launching console for node ${splittedCommand[1]}...`);
            var host = node.console_host;
            if (ipaddr.IPv6.isValid(host)) {
               host = `[${host}]`;
            }
            if (node.console_type === 'telnet') {
              location.assign(
                `gns3+telnet://${host}:${node.console}?name=${node.name}&project_id=${node.project_id}&node_id=${node.node_id}`
              );
            } else if (node.console_type === 'vnc') {
              location.assign(
                `gns3+vnc://${host}:${node.console}?name=${node.name}&project_id=${node.project_id}&node_id=${node.node_id}`
              );
            } else if (node.console_type.startsWith('spice')) {
              location.assign(
                `gns3+spice://${host}:${node.console}?name=${node.name}&project_id=${node.project_id}&node_id=${node.node_id}`
              );
            } else if (node.console_type.startsWith('http')) {
               window.open(`${node.console_type}://${host}:${node.console}`);
            } else {
              this.showCommand('Supported console types are: telnet, vnc, spice and spice+agent');
            }
          } else {
            this.showCommand(`This node must be started before a console can be opened.`);
          }
        } else if (this.regexShow.test(this.command)) {
          this.showCommand(`Information about node ${node.name}:`);
          this.showCommand(this.printNode(node));
        }
      } else {
        this.showCommand(`Node with ${splittedCommand[1]} name was not found.`);
      }
    } else {
      this.showCommand(`Unknown syntax: ${this.command}`);
    }
    this.command = '';
    this.cd.detectChanges();
  }

  clearConsole() {
    this.filteredEvents = [];
    this.console.nativeElement.scrollTop = this.console.nativeElement.scrollHeight;
  }

  showCommand(message: string) {
    this.showMessage({
      type: 'command',
      message: message,
    });
  }

  showMessage(event: LogEvent) {
    this.logEventsDataSource.add(event);
    this.filteredEvents = this.getFilteredEvents();
    this.console.nativeElement.scrollTop = this.console.nativeElement.scrollHeight;

    setTimeout(() => {
      this.console.nativeElement.scrollTop = this.console.nativeElement.scrollHeight;
    }, 100);
    this.cd.detectChanges();
  }

  getFilteredEvents(): LogEvent[] {
    if (this.selectedFilter === 'server requests') {
      return this.logEventsDataSource.getItems().filter((n) => n.type === 'server request');
    } else if (this.selectedFilter === 'errors') {
      return this.logEventsDataSource.getItems().filter((n) => n.type === 'error');
    } else if (this.selectedFilter === 'warnings') {
      return this.logEventsDataSource.getItems().filter((n) => n.type === 'warning');
    } else if (this.selectedFilter === 'info') {
      return this.logEventsDataSource.getItems().filter((n) => n.type === 'info');
    } else if (this.selectedFilter === 'map updates') {
      return this.logEventsDataSource.getItems().filter((n) => n.type === 'map update' || n.type === 'command');
    } else {
      return this.logEventsDataSource.getItems();
    }
  }

  printNode(node: Node): string {
    return (
      `command_line: ${node.command_line},
            compute_id: ${node.compute_id},
            console: ${node.console},
            console_host: ${node.console_host},
            console_type: ${node.console_type},
            first_port_name: ${node.first_port_name},
            height: ${node.height},
            label: ${node.label.text},
            name: ${node.name},
            node_directory: ${node.node_directory},
            node_id: ${node.node_id},
            node_type: ${node.node_type},
            port_name_format: ${node.port_name_format},
            port_segment_size: ${node.port_segment_size}, ` +
      this.printPorts(node.ports) +
      `project_id: ${node.project_id},
            status: ${node.status},
            symbol: ${node.symbol},
            symbol_url: ${node.symbol_url},
            width: ${node.width},
            x: ${node.x},
            y: ${node.y},
            z: ${node.z}`
    );
  }

  printPorts(ports: Port[]): string {
    let response: string = `ports: `;
    ports.forEach((port) => {
      response =
        response +
        `adapter_number: ${port.adapter_number},
            link_type: ${port.link_type},
            name: ${port.name},
            port_number: ${port.port_number},
            short_name: ${port.short_name}, `;
    });
    return response;
  }

  printLink(link: Link): string {
    return `capture_file_name: ${link.capture_file_name},
            capture_file_path: ${link.capture_file_path},
            capturing: ${link.capturing},
            link_id: ${link.link_id},
            link_type: ${link.link_type},
            project_id: ${link.project_id},
            suspend: ${link.suspend}, `;
  }

  printDrawing(drawing: Drawing): string {
    return `drawing_id: ${drawing.drawing_id},
            project_id: ${drawing.project_id},
            rotation: ${drawing.rotation},
            x: ${drawing.x},
            y: ${drawing.y},
            z: ${drawing.z}`;
  }
}
