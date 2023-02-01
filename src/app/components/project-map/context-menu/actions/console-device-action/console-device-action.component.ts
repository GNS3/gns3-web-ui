import { Component, Input, OnInit } from '@angular/core';
import { ElectronService } from 'ngx-electron';
import { Node } from '../../../../../cartography/models/node';
import{ Controller } from '../../../../../models/controller';
import { NodeService } from '../../../../../services/node.service';
import { ControllerService } from '../../../../../services/controller.service';
import { SettingsService } from '../../../../../services/settings.service';
import { ToasterService } from '../../../../../services/toaster.service';

@Component({
  selector: 'app-console-device-action',
  templateUrl: './console-device-action.component.html',
})
export class ConsoleDeviceActionComponent implements OnInit {
  @Input() controller:Controller ;
  @Input() nodes: Node[];

  constructor(
    private electronService: ElectronService,
    private controllerService: ControllerService,
    private settingsService: SettingsService,
    private toasterService: ToasterService,
    private nodeService: NodeService
  ) {}

  ngOnInit() {}

  async console() {
    let consoleCommand = this.settingsService.getConsoleSettings()
      ? this.settingsService.getConsoleSettings()
      : this.nodeService.getDefaultCommand();
    const startedNodes = this.nodes.filter((node) => node.status === 'started' && node.console_type !== 'none');

    if (startedNodes.length === 0) {
      this.toasterService.error('Device needs to be started in order to console to it.');
      return;
    }

    for (var node of this.nodes) {
      if (node.status !== 'started' && node.console_type !== 'none') {
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
        controller_url: this.controllerService.getControllerUrl(this.controller),
      };
      await this.openConsole(consoleRequest);
    }
  }

  async openConsole(request) {
    return await this.electronService.remote.require('./console-executor.js').openConsole(request);
  }
}
