import { Component, Input, OnInit } from '@angular/core';
import { Node } from '../../../../../cartography/models/node';
import { Controller } from '@models/controller';
import { NodeConsoleService } from '@services/nodeConsole.service';
import { VncConsoleService } from '@services/vnc-console.service';
import { SpiceConsoleService } from '@services/spice-console.service';
import { ToasterService } from '@services/toaster.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-http-console-action',
  templateUrl: './http-console-action.component.html',
})
export class HttpConsoleActionComponent implements OnInit {
  @Input() controller: Controller;
  @Input() nodes: Node[];

  constructor(
    private nodeConsoleService: NodeConsoleService,
    private vncConsoleService: VncConsoleService,
    private spiceConsoleService: SpiceConsoleService,
    private toasterService: ToasterService,
    private router: Router
  ) {}

  ngOnInit() {}

  openConsole() {
    let nodesToStart = '';
    let nodesToStartCounter = 0;

    this.nodes.forEach((n) => {
      if (n.console_type !== 'none') {
        if (n.status === 'started') {
          // Check console type to determine how to open the console
          if (n.console_type === 'vnc') {
            // VNC console: use standalone page in popup window
            this.vncConsoleService.openVncConsole(this.controller, n, false);
          } else if (n.console_type.startsWith('spice')) {
            // SPICE console: use standalone page in popup window
            this.spiceConsoleService.openSpiceConsole(this.controller, n, false);
          } else if (n.console_type.startsWith('http')) {
            // HTTP/HTTPS console: open directly in popup window
            if (
              n.console_host === '0.0.0.0' ||
              n.console_host === '0:0:0:0:0:0:0:0' ||
              n.console_host === '::'
            ) {
              n.console_host = this.controller.host;
            }

            const uri = `${n.console_type}://${n.console_host}:${n.console}`;
            window.open(uri, `Console-${n.name}`, 'width=1024,height=768');
          } else if (n.console_type === 'telnet') {
            // Telnet console: open in popup window
            let url = this.router.url.split('/');
            let urlString = `/static/web-ui/${url[1]}/${url[2]}/${url[3]}/${url[4]}/nodes/${n.node_id}`;

            // Parse console_resolution if available (format: "1024x768")
            // Add padding for browser chrome (title bar, borders, etc.)
            const windowPadding = 10;
            let windowWidth = 800 + windowPadding;
            let windowHeight = 600 + windowPadding;

            if (n.properties) {
              const props = n.properties as any;
              if (props.console_resolution) {
                const resolution = props.console_resolution;
                const parts = resolution.split('x');
                if (parts.length === 2) {
                  windowWidth = parseInt(parts[0], 10) + windowPadding;
                  windowHeight = parseInt(parts[1], 10) + windowPadding;
                }
              }
            }

            window.open(urlString, `Console-${n.name}`, `width=${windowWidth},height=${windowHeight}`);
          } else {
            this.toasterService.error(`Console type '${n.console_type}' is not supported for node ${n.name}.`);
          }
        } else {
          nodesToStartCounter++;
          nodesToStart += n.name + ' ';
        }
      }
    });

    if (nodesToStartCounter > 0) {
      this.toasterService.error('Please start the following nodes if you want to open consoles for them: ' + nodesToStart);
    }
  }
}
