import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { Link } from '@models/link';
import { Project } from '@models/project';
import { Controller } from '@models/controller';
import { ToasterService } from '@services/toaster.service';
import { InlineWindowService } from '@services/inline-window.service';

@Component({
  selector: 'app-start-web-wireshark-inline-action',
  templateUrl: './start-web-wireshark-inline-action.component.html',
  imports: [MatButtonModule, MatIconModule, MatMenuModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StartWebWiresharkInlineActionComponent {
  private inlineWindowService = inject(InlineWindowService);
  private toasterService = inject(ToasterService);

  readonly controller = input<Controller>(undefined);
  readonly project = input<Project>(undefined);
  readonly link = input<Link>(undefined);

  openWebWiresharkInline() {
    console.log('[StartWebWiresharkInline] Action triggered');

    const ctrl = this.controller();
    const proj = this.project();
    const linkItem = this.link();

    console.log('[StartWebWiresharkInline] Inputs:', { ctrl: !!ctrl, proj: !!proj, link: !!linkItem });

    if (!ctrl || !proj || !linkItem) {
      this.toasterService.error('Missing controller, project or link');
      return;
    }

    try {
      // Find the SVG map element
      const mapElement = document.getElementById('map');
      console.log('[StartWebWiresharkInline] Map element:', mapElement);

      if (!mapElement) {
        this.toasterService.error('Map element not found');
        return;
      }

      console.log('[StartWebWiresharkInline] Map element tag:', mapElement.tagName);

      // Check if window already open for this link
      if (this.inlineWindowService.hasOpenWindowForLink(linkItem.link_id)) {
        this.toasterService.warning('Web Wireshark is already open for this link');
        return;
      }

      console.log('[StartWebWiresharkInline] Opening inline window for link:', linkItem.link_id);

      // Open inline window
      const windowId = this.inlineWindowService.openInlineWebWireshark(linkItem, ctrl, mapElement);

      console.log('[StartWebWiresharkInline] Window opened with ID:', windowId);

      this.toasterService.success(`Web Wireshark opened inline (${windowId})`);
    } catch (error) {
      console.error('[StartWebWiresharkInline] Error:', error);
      this.toasterService.error(`Failed to open Web Wireshark inline: ${error.message}`);
    }
  }
}
