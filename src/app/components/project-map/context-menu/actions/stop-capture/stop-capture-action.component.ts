import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { Link } from '@models/link';
import { Controller } from '@models/controller';
import { LinkService } from '@services/link.service';

@Component({
  selector: 'app-stop-capture-action',
  templateUrl: './stop-capture-action.component.html',
  imports: [MatButtonModule, MatIconModule, MatMenuModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StopCaptureActionComponent {
  private linkService = inject(LinkService);

  readonly controller = input<Controller>(undefined);
  readonly link = input<Link>(undefined);

  stopCapture() {
    this.linkService.stopCaptureOnLink(this.controller(), this.link()).subscribe(() => {});
  }
}
