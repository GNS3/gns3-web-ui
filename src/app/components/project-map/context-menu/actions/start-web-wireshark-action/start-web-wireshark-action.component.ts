import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { Link } from '@models/link';
import { Project } from '@models/project';
import { Controller } from '@models/controller';
import { ToasterService } from '@services/toaster.service';
import { XpraConsoleService } from '@services/xpra-console.service';

@Component({
  selector: 'app-start-web-wireshark-action',
  templateUrl: './start-web-wireshark-action.component.html',
  imports: [MatButtonModule, MatIconModule, MatMenuModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StartWebWiresharkActionComponent {
  private xpraConsoleService = inject(XpraConsoleService);
  private toasterService = inject(ToasterService);

  readonly controller = input<Controller>(undefined);
  readonly project = input<Project>(undefined);
  readonly link = input<Link>(undefined);

  startWebWireshark() {
    const ctrl = this.controller();
    const proj = this.project();
    const linkItem = this.link();

    if (!ctrl || !proj || !linkItem) {
      this.toasterService.error('Missing controller, project or link');
      return;
    }

    // Build WebSocket URL for Web Wireshark
    const wsUrl = this.xpraConsoleService.buildXpraWebSocketUrlForWebWireshark(ctrl, linkItem);

    // Build xpra-html5 URL
    const pageUrl = this.xpraConsoleService.buildXpraConsolePageUrl(wsUrl);

    // Open in new tab
    const newWindow = window.open(pageUrl, '_blank');

    // Detect if popup was blocked
    if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
      this.toasterService.error('Popup was blocked. Please allow popups for this site.');
    }
  }
}
