import { Component, Input } from '@angular/core';
import { DeviceDetectorService } from 'ngx-device-detector';
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

  constructor(private toasterService: ToasterService, private nodeService: NodeService, private deviceService: DeviceDetectorService) {}

  openConsole() {
    this.nodeService.getNode(this.server, this.node).subscribe((node: Node) => {
      this.node = node;
      this.startConsole();
    });
  }

  createHiddenIframe(target: Element, uri: string) {
    const iframe = document.createElement("iframe");
    iframe.src = uri;
    iframe.id = "hiddenIframe";
    iframe.style.display = "none";
    target.appendChild(iframe);
    return iframe;
  }

  openUriUsingFirefox(uri: string) {
      var iframe = (document.querySelector("#hiddenIframe") as HTMLIFrameElement);

      if (!iframe) {
          iframe = this.createHiddenIframe(document.body, "about:blank");
      }

      try {
          iframe.contentWindow.location.href = uri;
      } catch (e) {
          if (e.name === "NS_ERROR_UNKNOWN_PROTOCOL") {
              this.toasterService.error('Protocol handler does not exist');
          }
      }
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

      const device = this.deviceService.getDeviceInfo();

      try {
        var uri;
        if (this.node.console_type === 'telnet') {
          uri = `gns3+telnet://${this.node.console_host}:${this.node.console}?name=${this.node.name}&project_id=${this.node.project_id}&node_id=${this.node.node_id}`;
        } else if (this.node.console_type === 'vnc') {
          uri = `gns3+vnc://${this.node.console_host}:${this.node.console}?name=${this.node.name}&project_id=${this.node.project_id}&node_id=${this.node.node_id}`;
        } else if (this.node.console_type.startsWith('spice')) {
          uri = `gns3+spice://${this.node.console_host}:${this.node.console}?name=${this.node.name}&project_id=${this.node.project_id}&node_id=${this.node.node_id}`
        } else if (this.node.console_type.startsWith('http')) {
          uri = `${this.node.console_type}://${this.node.console_host}:${this.node.console}`
          return window.open(uri);  // open an http console directly in a new window/tab
        } else {
          this.toasterService.error('Supported console types are: telnet, vnc, spice and spice+agent.');
        }

        if (device.browser === "Firefox") {
            // Use a hidden iframe otherwise Firefox will disconnect
            // from the GNS3 controller websocket if we use location.assign()
            this.openUriUsingFirefox(uri);
        } else {
            location.assign(uri);
        }

      } catch (e) {
          this.toasterService.error(e);
      }
    }
  }
}
