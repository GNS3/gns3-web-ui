import { Component, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Node } from '../../../../../cartography/models/node';
import { Controller } from '@models/controller';
import { NodeService } from '@services/node.service';
import { ControllerService } from '@services/controller.service';
import { SettingsService } from '@services/settings.service';
import { ToasterService } from '@services/toaster.service';

@Component({
  standalone: true,
  selector: 'app-console-device-action',
  templateUrl: './console-device-action.component.html',
  imports: [CommonModule, MatButtonModule, MatIconModule],
})
export class ConsoleDeviceActionComponent implements OnInit {
  private controllerService = inject(ControllerService);
  private settingsService = inject(SettingsService);
  private toasterService = inject(ToasterService);
  private nodeService = inject(NodeService);

  @Input() controller: Controller;
  @Input() nodes: Node[];

  ngOnInit() {}

  async console() {
    // Console action is not supported in web mode
    this.toasterService.error('Console action is only supported in Electron mode');
  }
}
