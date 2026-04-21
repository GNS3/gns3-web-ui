import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { Controller } from '../../../../../models/controller';
import { Link } from '../../../../../models/link';
import { LinkService } from '../../../../../services/link.service';
import { ToasterService } from '@services/toaster.service';

@Component({
  selector: 'app-reset-link-action',
  templateUrl: './reset-link-action.component.html',
  imports: [MatButtonModule, MatIconModule, MatMenuModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResetLinkActionComponent {
  private linkService = inject(LinkService);
  private toasterService = inject(ToasterService);
  private cdr = inject(ChangeDetectorRef);

  readonly controller = input<Controller>(undefined);
  readonly link = input<Link>(undefined);

  resetLink() {
    this.linkService.resetLink(this.controller(), this.link()).subscribe({
        next: () => {},
        error: (err) => {
          const message = err.error?.message || err.message || 'Failed to reset link';
          this.toasterService.error(message);
          this.cdr.markForCheck();
        },
      });
  }
}
