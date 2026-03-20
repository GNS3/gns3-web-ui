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
    // Console action is not supported in web mode
    this.toasterService.error('Console action is only supported in Electron mode');
  }
}
