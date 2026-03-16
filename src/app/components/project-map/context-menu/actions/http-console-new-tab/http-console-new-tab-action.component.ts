import { Component, Input, OnInit } from '@angular/core';
import { NodeConsoleService } from '@services/nodeConsole.service';
import { VncConsoleService } from '@services/vnc-console.service';
import { SpiceConsoleService } from '@services/spice-console.service';
import { ToasterService } from '@services/toaster.service';
import { Node } from '../../../../../cartography/models/node';
import { Controller } from '@models/controller';
import { Router } from '@angular/router';

@Component({
  selector: 'app-http-console-new-tab-action',
  templateUrl: './http-console-new-tab-action.component.html',
})
export class HttpConsoleNewTabActionComponent implements OnInit {
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
            // VNC console: use standalone page in new tab
            this.vncConsoleService.openVncConsole(this.controller, n, true);
          } else if (n.console_type.startsWith('spice')) {
            // SPICE console: use standalone page in new tab
            this.spiceConsoleService.openSpiceConsole(this.controller, n, true);
          } else if (n.console_type.startsWith('http')) {
            // HTTP/HTTPS console: open directly in new tab
            if (
              n.console_host === '0.0.0.0' ||
              n.console_host === '0:0:0:0:0:0:0:0' ||
              n.console_host === '::'
            ) {
              n.console_host = this.controller.host;
            }

            const uri = `${n.console_type}://${n.console_host}:${n.console}`;
            window.open(uri, '_blank');
          } else if (n.console_type === 'telnet') {
            // Telnet console: use existing URL-based approach in new tab
            let url = this.router.url.split('/');
            let urlString = `/static/web-ui/${url[1]}/${url[2]}/${url[3]}/${url[4]}/nodes/${n.node_id}`;
            window.open(urlString, '_blank');
          } else {
            this.toasterService.error(`Console type '${n.console_type}' not supported in new tab for node ${n.name}.`);
          }
        } else {
          nodesToStartCounter++;
          nodesToStart += n.name + ' ';
        }
      }
    });

    if (nodesToStartCounter > 0) {
      this.toasterService.error('Please start the following nodes if you want to open consoles in new tabs: ' + nodesToStart);
    }
  }
}
