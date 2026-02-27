import { Component, Input, OnInit } from '@angular/core';
import { Node } from '../../../../../cartography/models/node';
import { Controller } from '@models/controller';
import { NodeService } from '@services/node.service';
import { ControllerService } from '@services/controller.service';
import { SettingsService } from '@services/settings.service';
import { ToasterService } from '@services/toaster.service';

@Component({
  selector: 'app-console-device-action',
  templateUrl: './console-device-action.component.html',
})
export class ConsoleDeviceActionComponent implements OnInit {
  @Input() controller: Controller;
  @Input() nodes: Node[];

  constructor(
    private controllerService: ControllerService,
    private settingsService: SettingsService,
    private toasterService: ToasterService,
    private nodeService: NodeService
  ) {}

  ngOnInit() {}

  async console() {
    const startedNodes = this.nodes.filter((node) => node.status === 'started' && node.console_type !== 'none');

    if (startedNodes.length === 0) {
      this.toasterService.error('Device needs to be started in order to console to it.');
      return;
    }

    // Native console launching is not supported in web-only mode.
    // Use the web console instead (HttpConsoleActionComponent).
    this.toasterService.error('Native console launching is not supported in web-only mode. Please use the web console feature.');
  }
}
