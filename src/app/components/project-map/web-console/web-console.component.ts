import { Component, OnInit, Input, AfterViewInit } from '@angular/core';
import { Project } from '../../../models/project';
import { Server } from '../../../models/server';
import { Terminal } from 'xterm';
import { AttachAddon } from 'xterm-addon-attach';
import { Node } from '../../../cartography/models/node';


@Component({
    selector: 'app-web-console',
    templateUrl: './web-console.component.html',
    styleUrls: ['../../../../../node_modules/xterm/css/xterm.css']
})
export class WebConsoleComponent implements OnInit, AfterViewInit {
    @Input() server: Server;
    @Input() project: Project;
    @Input() node: Node;

    constructor() {}
    
    ngOnInit() {}

    ngAfterViewInit() {
        const term = new Terminal();
        setTimeout(() => {
            term.open(document.getElementById('terminal'));
            term.write('\x1B[1;3;31mxterm.js\x1B[0m $ ')
    
            const socket = new WebSocket(this.getUrl());
            const attachAddon = new AttachAddon(socket);
            term.loadAddon(attachAddon);
    
            console.log('Console is running...');
        }, 1000);
    }

    getUrl() {
        return `ws://${this.server.host}:${this.server.port}/v2/projects/${this.node.project_id}/nodes/${this.node.node_id}/console/ws`
    }
}
