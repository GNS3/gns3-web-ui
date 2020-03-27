import { Component, OnInit, Input, AfterViewInit, ViewEncapsulation, ViewChild, ElementRef } from '@angular/core';
import { Project } from '../../../models/project';
import { Server } from '../../../models/server';
import { Terminal } from 'xterm';
import { AttachAddon } from 'xterm-addon-attach';
import { Node } from '../../../cartography/models/node';
import { FitAddon } from 'xterm-addon-fit';
import { NodeConsoleService } from '../../../services/nodeConsole.service';


@Component({
    encapsulation: ViewEncapsulation.None,
    selector: 'app-web-console',
    templateUrl: './web-console.component.html',
    styleUrls: ['../../../../../node_modules/xterm/css/xterm.css']
})
export class WebConsoleComponent implements OnInit, AfterViewInit {
    @Input() server: Server;
    @Input() project: Project;
    @Input() node: Node;

    public term: Terminal = new Terminal();
    public fitAddon: FitAddon = new FitAddon();

    @ViewChild('terminal', {static: false}) terminal: ElementRef;

    constructor(
        private consoleService: NodeConsoleService
    ) {}
    
    ngOnInit() {
        this.consoleService.consoleResized.subscribe(ev => {
            this.fitAddon.fit();
        });
    }

    ngAfterViewInit() {
        setTimeout(() => {
            this.term.open(this.terminal.nativeElement);
            const socket = new WebSocket(this.getUrl());

            socket.onerror = ((event) => {
                this.term.write('Connection lost');
            });
            socket.onclose = ((event) => {
                this.consoleService.closeConsoleForNode(this.node);
            });

            const attachAddon = new AttachAddon(socket);
            this.term.loadAddon(attachAddon);
            this.term.setOption('cursorBlink', true);

            this.term.loadAddon(this.fitAddon);
            this.fitAddon.activate(this.term);

            this.term.focus();
        }, 1000);
    }

    getUrl() {
        return `ws://${this.server.host}:${this.server.port}/v2/projects/${this.node.project_id}/nodes/${this.node.node_id}/console/ws`
    }
}
