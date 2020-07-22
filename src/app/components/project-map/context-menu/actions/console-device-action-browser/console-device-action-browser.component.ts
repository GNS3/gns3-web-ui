import { Component, Input } from '@angular/core';
import { Node } from '../../../../../cartography/models/node';
import { ToasterService } from '../../../../../services/toaster.service';
import { NodeService } from '../../../../../services/node.service';
import { Server } from '../../../../../models/server';


@Component({
    selector: 'app-console-device-action-browser',
    templateUrl: './console-device-action-browser.component.html'
})
export class ConsoleDeviceActionBrowserComponent {
    @Input() server: Server;
    @Input() node: Node;

    constructor(
        private toasterService: ToasterService,
        private nodeService: NodeService
    ) {}

    openConsole() {
        this.nodeService.getNode(this.server, this.node).subscribe((node: Node) => {
            this.node = node;
            this.startConsole();
        });
    }

    startConsole() {
        if (this.node.status !== "started") {
            this.toasterService.error("This node must be started before a console can be opened");
        } else {
            if (this.node.console_host === '0.0.0.0' || this.node.console_host === '0:0:0:0:0:0:0:0' || this.node.console_host === '::') {
                this.node.console_host = this.server.host;
            }

            if (this.node.console_type === "telnet") {
                location.assign(`gns3+telnet://${this.node.console_host}:${this.node.console}?name=${this.node.name}&project_id=${this.node.project_id}&node_id=${this.node.node_id}`);
            } else if (this.node.console_type === "vnc") {
                location.assign(`gns3+vnc://${this.node.console_host}:${this.node.console}?name=${this.node.name}&project_id=${this.node.project_id}&node_id=${this.node.node_id}`);
            } else if(this.node.console_type === "spice") {
                location.assign(`gns3+spice://${this.node.console_host}:${this.node.console}?name=${this.node.name}&project_id=${this.node.project_id}&node_id=${this.node.node_id}`);
            } else {
                this.toasterService.error("Supported console types: telnet, vnc, spice.");
            }
        }
    }
}
