import { Component, Input } from '@angular/core';
import { Link } from '../../../../../models/link';
import { Server } from '../../../../../models/server';
import { LinkService } from '../../../../../services/link.service';

@Component({
  selector: 'app-stop-capture-action',
  templateUrl: './stop-capture-action.component.html',
})
export class StopCaptureActionComponent {
  @Input() server: Server;
  @Input() link: Link;

  constructor(private linkService: LinkService) {}

  stopCapture() {
    this.linkService.stopCaptureOnLink(this.server, this.link).subscribe(() => {});
  }
}
