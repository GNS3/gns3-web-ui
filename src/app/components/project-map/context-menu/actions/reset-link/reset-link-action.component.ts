import { Component, inject, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { Controller } from '../../../../../models/controller';
import { Link } from '../../../../../models/link';
import { LinkService } from '../../../../../services/link.service';

@Component({
  standalone: true,
  selector: 'app-reset-link-action',
  templateUrl: './reset-link-action.component.html',
  imports: [MatButtonModule, MatIconModule, MatMenuModule],
})
export class ResetLinkActionComponent {
  private linkService = inject(LinkService);

  readonly controller = input<Controller>(undefined);
  readonly link = input<Link>(undefined);

  resetLink() {
    this.linkService.resetLink(this.controller(), this.link()).subscribe(() => {});
  }
}
