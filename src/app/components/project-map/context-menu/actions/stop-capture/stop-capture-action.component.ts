import { Component, Input } from '@angular/core';
import { Link } from '../../../../../models/link';
import { Controller } from '../../../../../models/controller';
import { LinkService } from '../../../../../services/link.service';

@Component({
  selector: 'app-stop-capture-action',
  templateUrl: './stop-capture-action.component.html',
})
export class StopCaptureActionComponent {
  @Input() controller:Controller ;
  @Input() link: Link;

  constructor(private linkService: LinkService) {}

  stopCapture() {
    this.linkService.stopCaptureOnLink(this.controller, this.link).subscribe(() => {});
  }
}
