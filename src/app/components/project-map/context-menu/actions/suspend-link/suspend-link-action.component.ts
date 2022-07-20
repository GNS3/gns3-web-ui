import { Component, Input } from '@angular/core';
import { Link } from '../../../../../models/link';
import { Server } from '../../../../../models/server';
import { LinkService } from '../../../../../services/link.service';

@Component({
  selector: 'app-suspend-link-action',
  templateUrl: './suspend-link-action.component.html',
})
export class SuspendLinkActionComponent {
  @Input() controller: Server;
  @Input() link: Link;

  constructor(private linkService: LinkService) {}

  suspendLink() {
    this.link.suspend = true;
    this.linkService.updateLink(this.controller, this.link).subscribe(() => {});
  }
}
