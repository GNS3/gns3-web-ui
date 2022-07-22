import { Component, Input } from '@angular/core';
import { Link } from '../../../../../models/link';
import{ Controller } from '../../../../../models/controller';
import { LinkService } from '../../../../../services/link.service';

@Component({
  selector: 'app-suspend-link-action',
  templateUrl: './suspend-link-action.component.html',
})
export class SuspendLinkActionComponent {
  @Input() controller:Controller ;
  @Input() link: Link;

  constructor(private linkService: LinkService) {}

  suspendLink() {
    this.link.suspend = true;
    this.linkService.updateLink(this.controller, this.link).subscribe(() => {});
  }
}
