import { Component, Input } from '@angular/core';
import { DeviceDetectorService } from 'ngx-device-detector';
import { Node } from '../../../../../cartography/models/node';
import { Server } from '../../../../../models/server';
import { NodeService } from '../../../../../services/node.service';
import { ToasterService } from '../../../../../services/toaster.service';
import { ProtocolHandlerService } from '../../../../../services/protocol-handler.service';

import * as ipaddr from 'ipaddr.js';

@Component({
  selector: 'app-console-device-action-browser',
  templateUrl: './console-device-action-browser.component.html',
})
export class ConsoleDeviceActionBrowserComponent {
  @Input() server: Server;
  @Input() node: Node;

  constructor(private toasterService: ToasterService, private nodeService: NodeService, private protocolHandlerService: ProtocolHandlerService) {}

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

      try {
        var uri;
        var host = this.node.console_host;
        if (ipaddr.IPv6.isValid(host)) {
           host = `[${host}]`;
        }
        if (this.node.console_type === 'telnet') {
          uri = `gns3+telnet://${host}:${this.node.console}?name=${this.node.name}&project_id=${this.node.project_id}&node_id=${this.node.node_id}`;
        } else if (this.node.console_type === 'vnc') {
          uri = `gns3+vnc://${host}:${this.node.console}?name=${this.node.name}&project_id=${this.node.project_id}&node_id=${this.node.node_id}`;
        } else if (this.node.console_type.startsWith('spice')) {
          uri = `gns3+spice://${host}:${this.node.console}?name=${this.node.name}&project_id=${this.node.project_id}&node_id=${this.node.node_id}`
        } else if (this.node.console_type.startsWith('http')) {
          uri = `${this.node.console_type}://${host}:${this.node.console}`
          return window.open(uri);  // open an http console directly in a new window/tab
        } else {
          this.toasterService.error('Supported console types are: telnet, vnc, spice and spice+agent.');
        }

        this.protocolHandlerService.open(uri);

      } catch (e) {
          this.toasterService.error(e);
      }
    }
  }
}
