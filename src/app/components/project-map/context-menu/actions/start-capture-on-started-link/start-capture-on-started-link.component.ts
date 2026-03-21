import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { Link } from '@models/link';
import { Project } from '@models/project';
import { Controller } from '@models/controller';
import { PacketCaptureService } from '@services/packet-capture.service';

@Component({
  standalone: true,
  selector: 'app-start-capture-on-started-link-action',
  templateUrl: './start-capture-on-started-link.component.html',
  imports: [MatButtonModule, MatIconModule, MatMenuModule],
  // TODO: This component has been partially migrated to be zoneless-compatible.
  // After testing, this should be updated to ChangeDetectionStrategy.OnPush.
  changeDetection: ChangeDetectionStrategy.Default,
})
export class StartCaptureOnStartedLinkActionComponent {
  private packetCaptureService = inject(PacketCaptureService);

  readonly controller = input<Controller>(undefined);
  readonly project = input<Project>(undefined);
  readonly link = input<Link>(undefined);

  startCapture() {
    var splittedFileName = this.link().capture_file_name.split('.');
    this.packetCaptureService.startCapture(this.controller(), this.project(), this.link(), splittedFileName[0]);
  }
}
