import { Component, Input } from '@angular/core';
import { Server } from '../../../../../models/server';
import { Link } from '../../../../../models/link';
import { LinkService } from '../../../../../services/link.service';

@Component({
  selector: 'app-reset-link-action',
  templateUrl: './reset-link-action.component.html'
})
export class ResetLinkActionComponent {
  @Input() server: Server;
  @Input() link: Link;

  constructor(
      private linkService: LinkService
  ) {}

  resetLink() {
    this.linkService.resetLink(this.server, this.link).subscribe(() => {});
  }
}
