import { Component, OnInit, Input } from '@angular/core';
import { Node } from '../../../../../cartography/models/node';
import { Server } from '../../../../../models/server';
import { ElectronService } from 'ngx-electron';
import { ServerService } from '../../../../../services/server.service';
import { SettingsService } from '../../../../../services/settings.service';
import { ToasterService } from '../../../../../services/toaster.service';

@Component({
  selector: 'app-console-device-action',
  templateUrl: './console-device-action.component.html'
})
export class ConsoleDeviceActionComponent implements OnInit {
  @Input() server: Server;
  @Input() nodes: Node[];

  constructor(
    private electronService: ElectronService,
    private serverService: ServerService,
    private settingsService: SettingsService,
    private toasterService: ToasterService
  ) { }

  ngOnInit() {
  }

  async console() {
    let consoleCommand = this.settingsService.get<string>('console_command');

    if(consoleCommand === undefined) {
      consoleCommand = `putty.exe -telnet \%h \%p -wt \"\%d\" -gns3 5 -skin 4`;
    }

    const startedNodes = this.nodes.filter(node => node.status === 'started');

    if(startedNodes.length === 0) {
      this.toasterService.error('Device needs to be started in order to console to it.');
      return;
    }

    for(var node of this.nodes) {
      if(node.status !== 'started') {
        continue;
      }

      const consoleRequest = {
        command: consoleCommand,
        type: node.console_type,
        host: node.console_host,
        port: node.console,
        name: node.name,
        project_id: node.project_id,
        node_id: node.node_id,
        server_url: this.serverService.getServerUrl(this.server)
      };
      await this.openConsole(consoleRequest);
    }
  }

  async openConsole(request) {
    return await this.electronService.remote.require('./console-executor.js').openConsole(request);
  }
}
