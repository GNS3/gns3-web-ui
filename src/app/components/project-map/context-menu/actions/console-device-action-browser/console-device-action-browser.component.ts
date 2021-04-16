import { Component, Input } from '@angular/core';
import { Node } from '../../../../../cartography/models/node';
import { Server } from '../../../../../models/server';
import { NodeService } from '../../../../../services/node.service';
import { ToasterService } from '../../../../../services/toaster.service';

@Component({
  selector: 'app-console-device-action-browser',
  templateUrl: './console-device-action-browser.component.html',
})
export class ConsoleDeviceActionBrowserComponent {
  @Input() server: Server;
  @Input() node: Node;

  constructor(private toasterService: ToasterService, private nodeService: NodeService) {}

  openConsole() {
    this.nodeService.getNode(this.server, this.node).subscribe((node: Node) => {
      this.node = node;
      this.startConsole();
    });
  }

  startConsole() {
    if (this.node.status !== 'started') {
      this.toasterService.error('This node must be started before a console can be opened');
    } else {
      if (
        this.node.console_host === '0.0.0.0' ||
        this.node.console_host === '0:0:0:0:0:0:0:0' ||
        this.node.console_host === '::'
      ) {
        this.node.console_host = this.server.host;
      }

      if (
        this.node.console_type === 'telnet' ||
        this.node.console_type === 'vnc' ||
        this.node.console_type === 'spice'
      ) {
        try {
          location.assign(
            `gns3+${this.node.console_type}://${this.node.console_host}:${this.node.console}?name=${this.node.name}&project_id=${this.node.project_id}&node_id=${this.node.node_id}`
          );
        } catch (e) {
          this.toasterService.error(e);
        }
      } else {
        this.toasterService.error('Supported console types: telnet, vnc, spice.');
      }
    }
  }
}
