import { Component, Input, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { Link } from '@models/link';
import { Controller } from '@models/controller';
import { LinkService } from '@services/link.service';

@Component({
  standalone: true,
  selector: 'app-resume-link-action',
  templateUrl: './resume-link-action.component.html',
  imports: [MatButtonModule, MatIconModule, MatMenuModule],
})
export class ResumeLinkActionComponent {
  private linkService = inject(LinkService);

  @Input() controller: Controller;
  @Input() link: Link;

  resumeLink() {
    this.link.suspend = false;
    this.linkService.updateLink(this.controller, this.link).subscribe(() => {});
  }
}
