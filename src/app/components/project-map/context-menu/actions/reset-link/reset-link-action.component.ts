import { Component, Input } from '@angular/core';
import{ Controller } from '../../../../../models/server';
import { Link } from '../../../../../models/link';
import { LinkService } from '../../../../../services/link.service';

@Component({
  selector: 'app-reset-link-action',
  templateUrl: './reset-link-action.component.html'
})
export class ResetLinkActionComponent {
  @Input() controller:Controller ;
  @Input() link: Link;

  constructor(
      private linkService: LinkService
  ) {}

  resetLink() {
    this.linkService.resetLink(this.controller, this.link).subscribe(() => {});
  }
}
