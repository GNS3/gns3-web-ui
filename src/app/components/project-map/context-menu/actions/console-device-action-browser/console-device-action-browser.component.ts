import { Component, Input, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { DeviceDetectorService } from 'ngx-device-detector';
import { Node } from '../../../../../cartography/models/node';
import { Controller } from '@models/controller';
import { NodeService } from '@services/node.service';
import { ToasterService } from '@services/toaster.service';
import { ProtocolHandlerService } from '@services/protocol-handler.service';
import { VncConsoleService } from '@services/vnc-console.service';

import * as ipaddr from 'ipaddr.js';

@Component({
  standalone: true,
  selector: 'app-console-device-action-browser',
  templateUrl: './console-device-action-browser.component.html',
  imports: [MatButtonModule, MatIconModule, MatMenuModule],
})
export class ConsoleDeviceActionBrowserComponent {
  private toasterService = inject(ToasterService);
  private nodeService = inject(NodeService);
  private deviceService = inject(DeviceDetectorService);
  private protocolHandlerService = inject(ProtocolHandlerService);
  private vncConsoleService = inject(VncConsoleService);

  @Input() controller: Controller;
  @Input() node: Node;

  openConsole(auxiliary: boolean = false) {
    this.nodeService.getNode(this.controller, this.node).subscribe((node: Node) => {
      this.node = node;
      this.startConsole(auxiliary);
    });
  }

  startConsole(auxiliary: boolean) {
    if (this.node.status !== 'started') {
      this.toasterService.error('This node must be started before a console can be opened');
    } else {
      if (
        this.node.console_host === '0.0.0.0' ||
        this.node.console_host === '0:0:0:0:0:0:0:0' ||
        this.node.console_host === '::'
      ) {
        this.node.console_host = this.controller.host;
      }

      try {
        var uri;
        var host = this.node.console_host;
        if (ipaddr.IPv6.isValid(host)) {
           host = `[${host}]`;
        }
        if (this.node.console_type === 'telnet') {

          var console_port;
          if (auxiliary === true) {
            console_port = this.node.properties.aux;
            if (console_port === undefined) {
              this.toasterService.error('Auxiliary console port is not set.');
              return;
            }
          } else {
            console_port = this.node.console;
          }
          uri = `gns3+telnet://${host}:${console_port}?name=${this.node.name}&project_id=${this.node.project_id}&node_id=${this.node.node_id}`;
        } else if (this.node.console_type === 'vnc') {
          // Open VNC console in standalone page via WebSocket API
          this.vncConsoleService.openVncConsole(this.controller, this.node);
          return;  // Return early, don't use protocol handler
        } else if (this.node.console_type && this.node.console_type.startsWith('spice')) {
          uri = `gns3+spice://${host}:${this.node.console}?name=${this.node.name}&project_id=${this.node.project_id}&node_id=${this.node.node_id}`
        } else if (this.node.console_type && this.node.console_type.startsWith('http')) {
          uri = `${this.node.console_type}://${host}:${this.node.console}`
          return window.open(uri);  // open an http console directly in a new window/tab
        } else {
          this.toasterService.error('Supported console types are: telnet, vnc, spice and spice+agent.');
          return;
        }

        this.protocolHandlerService.open(uri);

      } catch (e) {
          this.toasterService.error(e);
      }
    }
  }
}
