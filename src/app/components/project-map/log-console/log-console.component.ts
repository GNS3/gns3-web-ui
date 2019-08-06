import { Component, OnInit, AfterViewInit, OnDestroy, Input, ViewChild, ElementRef } from '@angular/core';
import { Subscription } from 'rxjs';
import { ProjectWebServiceHandler } from '../../../handlers/project-web-service-handler';
import { NodeService } from '../../../services/node.service';
import { NodesDataSource } from '../../../cartography/datasources/nodes-datasource';
import { Project } from '../../../models/project';
import { Server } from '../../../models/server';


@Component({
    selector: 'app-log-console',
    templateUrl: './log-console.component.html',
    styleUrls: ['./log-console.component.scss']
})
export class LogConsoleComponent implements OnInit, AfterViewInit, OnDestroy {
    @Input() project: Project;
    @Input() server: Server;
    @ViewChild('console', {static: false}) console: ElementRef;
    private subscription: Subscription;
    command: string = '';

    private regexStart: RegExp = /^start (.*?)$/;
    private regexStop: RegExp = /^stop (.*?)$/;
    private regexSuspend: RegExp = /^suspend (.*?)$/;
    private regexReload: RegExp = /^reload (.*?)$/;

    constructor(
        private projectWebServiceHandler: ProjectWebServiceHandler,
        private nodeService: NodeService,
        private nodesDataSource: NodesDataSource
    ) {}
    
    ngOnInit() {
        this.subscription = this.projectWebServiceHandler.logEmitter.subscribe((event) => {
            let message = `Event received: ${event.action}.`
            this.showMessage(message);
        })
    }

    ngAfterViewInit() {
        this.console.nativeElement.scrollTop = this.console.nativeElement.scrollHeight;
    }

    ngOnDestroy() {
        this.subscription.unsubscribe();
    }

    onKeyDown(event) {
        if (event.key === "Enter") {
          this.handleCommand();
        }
    }

    handleCommand() {
        if (this.command === 'start all') {
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
        } else if (this.regexStart.test(this.command)) {
            let splittedCommand = this.command.split(/[ ,]+/);
            let node = this.nodesDataSource.getItems().find(n => {
                n.name.valueOf() === splittedCommand[1].valueOf();
                return n;
            });
            if (node) {
                this.showMessage(`Starting node ${splittedCommand[1]}...`);
                this.nodeService.start(this.server, node).subscribe(() => this.showMessage(`Node ${node.name} started.`));
            } else {
                this.showMessage(`Node with ${splittedCommand[1]} name was not found.`);
            }
        } else if (this.regexStop.test(this.command)) {
            let splittedCommand = this.command.split(/[ ,]+/);
            let node = this.nodesDataSource.getItems().find(n => {
                n.name.valueOf() === splittedCommand[1].valueOf();
                return n;
            });
            if (node) {
                this.showMessage(`Stopping node ${splittedCommand[1]}...`);
                this.nodeService.stop(this.server, node).subscribe(() => this.showMessage(`Node ${node.name} stopped.`));
            } else {
                this.showMessage(`Node with ${splittedCommand[1]} name was not found.`);
            }
        } else if (this.regexSuspend.test(this.command)) {
            let splittedCommand = this.command.split(/[ ,]+/);
            let node = this.nodesDataSource.getItems().find(n => {
                n.name.valueOf() === splittedCommand[1].valueOf();
                return n;
            });
            if (node) {
                this.showMessage(`Suspending node ${splittedCommand[1]}...`);
                this.nodeService.suspend(this.server, node).subscribe(() => this.showMessage(`Node ${node.name} stopped.`));
            } else {
                this.showMessage(`Node with ${splittedCommand[1]} name was not found.`);
            }
        } else if (this.regexReload.test(this.command)) {
            let splittedCommand = this.command.split(/[ ,]+/);
            let node = this.nodesDataSource.getItems().find(n => {
                n.name.valueOf() === splittedCommand[1].valueOf();
                return n;
            });
            if (node) {
                this.showMessage(`Reloading node ${splittedCommand[1]}...`);
                this.nodeService.reload(this.server, node).subscribe(() => this.showMessage(`Node ${node.name} reloaded.`));
            } else {
                this.showMessage(`Node with ${splittedCommand[1]} name was not found.`);
            }
        } else {
            this.showMessage(`Unknown syntax: ${this.command}`);
        }
        this.command = '';
    }

    showMessage(message: string) {
        this.console.nativeElement.innerHTML += message += "<br />";
        this.console.nativeElement.scrollTop = this.console.nativeElement.scrollHeight;
    }
}
