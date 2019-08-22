import { Component, OnInit, AfterViewInit, OnDestroy, Input, ViewChild, ElementRef, Output, EventEmitter } from '@angular/core';
import { Subscription } from 'rxjs';
import { ProjectWebServiceHandler } from '../../../handlers/project-web-service-handler';
import { NodeService } from '../../../services/node.service';
import { NodesDataSource } from '../../../cartography/datasources/nodes-datasource';
import { Project } from '../../../models/project';
import { Server } from '../../../models/server';
import { Drawing } from '../../../cartography/models/drawing';
import { Link } from '../../../models/link';
import { Node } from '../../../cartography/models/node';
import { Port } from '../../../models/port';
import { LogEventsDataSource } from './log-events-datasource';
import { HttpServer } from '../../../services/http-server.service';


@Component({
    selector: 'app-log-console',
    templateUrl: './log-console.component.html',
    styleUrls: ['./log-console.component.scss']
})
export class LogConsoleComponent implements OnInit, AfterViewInit, OnDestroy {
    @Input() project: Project;
    @Input() server: Server;
    @Output() closeConsole =  new EventEmitter<boolean>();
    @ViewChild('console', {static: false}) console: ElementRef;
    private nodeSubscription: Subscription;
    private linkSubscription: Subscription;
    private drawingSubscription: Subscription;
    private serverRequestsSubscription: Subscription;
    command: string = '';

    private regexStart: RegExp = /^start (.*?)$/;
    private regexStop: RegExp = /^stop (.*?)$/;
    private regexSuspend: RegExp = /^suspend (.*?)$/;
    private regexReload: RegExp = /^reload (.*?)$/;
    private regexShow: RegExp = /^show (.*?)$/;

    constructor(
        private projectWebServiceHandler: ProjectWebServiceHandler,
        private nodeService: NodeService,
        private nodesDataSource: NodesDataSource,
        private logEventsDataSource: LogEventsDataSource,
        private httpService: HttpServer
    ) {}
    
    ngOnInit() {
        this.nodeSubscription = this.projectWebServiceHandler.nodeNotificationEmitter.subscribe((event) => {
            let node: Node = event.event as Node;
            let message = `Event received: ${event.action} - ${this.printNode(node)}.`
            this.showMessage(message);
        });
        this.linkSubscription = this.projectWebServiceHandler.linkNotificationEmitter.subscribe((event) => {
            let link: Link = event.event as Link;
            let message = `Event received: ${event.action} - ${this.printLink(link)}.`
            this.showMessage(message);
        });
        this.drawingSubscription = this.projectWebServiceHandler.drawingNotificationEmitter.subscribe((event) => {
            let drawing: Drawing = event.event as Drawing;
            let message = `Event received: ${event.action} - ${this.printDrawing(drawing)}.`
            this.showMessage(message);
        });
        this.serverRequestsSubscription = this.httpService.requestsNotificationEmitter.subscribe((event) => {
            this.showMessage(event);
        });
    }

    ngAfterViewInit() {
        this.console.nativeElement.innerHTML = this.logEventsDataSource.getItems()[0] ? this.logEventsDataSource.getItems()[0] : '';
        this.console.nativeElement.scrollTop = this.console.nativeElement.scrollHeight;
    }

    ngOnDestroy() {
        this.nodeSubscription.unsubscribe();
        this.linkSubscription.unsubscribe();
        this.drawingSubscription.unsubscribe();
    }

    onKeyDown(event) {
        if (event.key === "Enter") {
          this.handleCommand();
        }
    }

    handleCommand() {
        if (this.command === 'help') {
            this.showMessage("Available commands: help, version, start all, start {node name}, stop all, stop {node name}, suspend all, suspend {node name}, reload all, reload {node name}, show {node name}.")
        } else if (this.command === 'version') {
            this.showMessage("Current version: 2019.2.0");
        } else if (this.command === 'start all') {
            this.showMessage("Starting all nodes...");
            this.nodeService.startAll(this.server, this.project).subscribe(() => {
                this.showMessage("All nodes started.")
            });
        } else if (this.command === 'stop all') {
            this.showMessage("Stopping all nodes...");
            this.nodeService.stopAll(this.server, this.project).subscribe(() => {
                this.showMessage("All nodes stopped.")
            });
        } else if (this.command === 'suspend all') {
            this.showMessage("Suspending all nodes...");
            this.nodeService.suspendAll(this.server, this.project).subscribe(() => {
                this.showMessage("All nodes suspended.")
            });
        } else if (this.command === 'reload all') {
            this.showMessage("Reloading all nodes...");
            this.nodeService.reloadAll(this.server, this.project).subscribe(() => {
                this.showMessage("All nodes reloaded.")
            });
        } else if (
            this.regexStart.test(this.command) || this.regexStop.test(this.command) || this.regexSuspend.test(this.command) || this.regexReload.test(this.command) || this.regexShow.test(this.command)) {
            let splittedCommand = this.command.split(/[ ,]+/);
            let node = this.nodesDataSource.getItems().find(n => n.name.valueOf() === splittedCommand[1].valueOf());
            if (node) {
                if (this.regexStart.test(this.command)) {
                    this.showMessage(`Starting node ${splittedCommand[1]}...`);
                    this.nodeService.start(this.server, node).subscribe(() => this.showMessage(`Node ${node.name} started.`));
                }
                else if (this.regexStop.test(this.command)) {
                    this.showMessage(`Stopping node ${splittedCommand[1]}...`);
                    this.nodeService.stop(this.server, node).subscribe(() => this.showMessage(`Node ${node.name} stopped.`));
                }
                else if (this.regexSuspend.test(this.command)) {
                    this.showMessage(`Suspending node ${splittedCommand[1]}...`);
                    this.nodeService.suspend(this.server, node).subscribe(() => this.showMessage(`Node ${node.name} suspended.`));
                }
                else if (this.regexReload.test(this.command)) {
                    this.showMessage(`Reloading node ${splittedCommand[1]}...`);
                    this.nodeService.reload(this.server, node).subscribe(() => this.showMessage(`Node ${node.name} reloaded.`));
                }
                else if (this.regexShow.test(this.command)) {
                    this.showMessage(`Information about node ${node.name}:`);
                    this.showMessage(this.printNode(node));
                }
            } else {
                this.showMessage(`Node with ${splittedCommand[1]} name was not found.`);
            }
        } else {
            this.showMessage(`Unknown syntax: ${this.command}`);
        }
        this.command = '';
    }

    clearConsole() {
        this.console.nativeElement.innerHTML = '';
        this.console.nativeElement.scrollTop = this.console.nativeElement.scrollHeight;
    }

    showMessage(message: string) {
        this.logEventsDataSource.clear();
        this.logEventsDataSource.add(this.console.nativeElement.innerHTML + message + " <br />");

        this.console.nativeElement.innerHTML += message += " <br />";
        this.console.nativeElement.scrollTop = this.console.nativeElement.scrollHeight;
    }

    printNode(node: Node): string {
        return `command_line: ${node.command_line}, 
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
            z: ${node.z}`;
    }

    printPorts(ports: Port[]): string {
        let response: string = `ports: `
        ports.forEach(port => {
            response = response + `adapter_number: ${port.adapter_number}, 
            link_type: ${port.link_type}, 
            name: ${port.name}, 
            port_number: ${port.port_number}, 
            short_name: ${port.short_name}, `
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

    close() {
        this.closeConsole.emit(false);
    }
}
