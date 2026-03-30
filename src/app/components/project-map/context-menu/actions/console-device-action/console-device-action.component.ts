import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { Node } from '../../../../../cartography/models/node';
import { Controller } from '@models/controller';
import { NodeService } from '@services/node.service';
import { ControllerService } from '@services/controller.service';
import { SettingsService } from '@services/settings.service';
import { ToasterService } from '@services/toaster.service';

@Component({
  selector: 'app-console-device-action',
  templateUrl: './console-device-action.component.html',
  imports: [MatButtonModule, MatIconModule, MatMenuModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConsoleDeviceActionComponent {
  private controllerService = inject(ControllerService);
  private settingsService = inject(SettingsService);
  private toasterService = inject(ToasterService);
  private nodeService = inject(NodeService);

  readonly controller = input<Controller>(undefined);
  readonly nodes = input<Node[]>([]);

  async console() {
    // Console action is not supported in web mode
    this.toasterService.error('Console action is only supported in Electron mode');
  }
}
