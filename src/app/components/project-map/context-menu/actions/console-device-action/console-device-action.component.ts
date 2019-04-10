import { Component, OnInit, Input } from '@angular/core';
import { Node } from '../../../../../cartography/models/node';
import { Server } from '../../../../../models/server';
import { ElectronService } from 'ngx-electron';
import { Project } from '../../../../../models/project';
import { ServerService } from '../../../../../services/server.service';

@Component({
  selector: 'app-console-device-action',
  templateUrl: './console-device-action.component.html'
})
export class ConsoleDeviceActionComponent implements OnInit {
  @Input() server: Server;
  @Input() project: Project;
  @Input() nodes: Node[];

  constructor(
    private electronService: ElectronService,
    private serverService: ServerService
  ) { }

  ngOnInit() {
  }

  async console() {
    for(var node of this.nodes) {
      const consoleRequest = {
        type: node.console_type,
        host: node.console_host,
        port: node.console,
        name: node.name,
        project_id: this.project.project_id,
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
