import { Component, OnInit, Input, AfterViewInit, ViewEncapsulation, ViewChild, ElementRef } from '@angular/core';
import { Project } from '../../models/project';
import { Server } from '../../models/server';
import { Terminal } from 'xterm';
import { AttachAddon } from 'xterm-addon-attach';
import { Node } from '../../cartography/models/node';
import { FitAddon } from 'xterm-addon-fit';
import { NodeConsoleService } from '../../services/nodeConsole.service';
import { ActivatedRoute } from '@angular/router';
import { ServerService } from '../../services/server.service';


@Component({
    encapsulation: ViewEncapsulation.None,
    selector: 'app-web-console-full-window',
    templateUrl: './web-console-full-window.component.html',
    styleUrls: ['../../../../../node_modules/xterm/css/xterm.css']
})
export class WebConsoleFullWindowComponent implements OnInit, AfterViewInit {
    private serverId: string;
    private projectId: string;
    private nodeId: string;

    public term: Terminal = new Terminal();
    public fitAddon: FitAddon = new FitAddon();

    @ViewChild('terminal', {static: false}) terminal: ElementRef;

    constructor(
        private consoleService: NodeConsoleService,
        private serverService: ServerService,
        private route: ActivatedRoute
    ) {}
    
    ngOnInit() {
        this.serverId = this.route.snapshot.paramMap.get("server_id");
        this.projectId = this.route.snapshot.paramMap.get("project_id");
        this.nodeId = this.route.snapshot.paramMap.get("node_id");

        this.consoleService.consoleResized.subscribe(ev => {
            this.fitAddon.fit();
        });
    }

    async ngAfterViewInit() {
        this.term.open(this.terminal.nativeElement);
        const socket = new WebSocket(await this.getUrl());

        socket.onerror = ((event) => {
            this.term.write("Connection lost" + "\r\n");
        });
        socket.onclose = ((event) => {
            this.term.write("Connection closed" + "\r\n");
        });

        const attachAddon = new AttachAddon(socket);
        this.term.loadAddon(attachAddon);
        this.term.setOption('cursorBlink', true);
        this.term.loadAddon(this.fitAddon);
        this.fitAddon.activate(this.term);
        this.fitAddon.fit();
        this.term.focus();

        let numberOfColumns = Math.round(window.innerWidth / this.consoleService.getLineWidth());
        let numberOfRows = Math.round(window.innerHeight / this.consoleService.getLineHeight());
        this.term.resize(numberOfColumns, numberOfRows);
    }

    async getUrl() {
        let server: Server = await this.serverService.get(+this.serverId);
        return `ws://${server.host}:${server.port}/v2/projects/${this.projectId}/nodes/${this.nodeId}/console/ws`
    }
}
