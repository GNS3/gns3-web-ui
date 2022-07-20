import { Component, Input } from '@angular/core';
import { Link } from '../../../../../models/link';
import { Server } from '../../../../../models/server';
import { LinkService } from '../../../../../services/link.service';

@Component({
  selector: 'app-resume-link-action',
  templateUrl: './resume-link-action.component.html',
})
export class ResumeLinkActionComponent {
  @Input() controller: Server;
  @Input() link: Link;

  constructor(private linkService: LinkService) {}

  resumeLink() {
    this.link.suspend = false;
    this.linkService.updateLink(this.controller, this.link).subscribe(() => {});
  }
}
