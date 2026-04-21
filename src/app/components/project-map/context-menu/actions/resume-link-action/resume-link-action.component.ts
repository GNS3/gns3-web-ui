import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { Link } from '@models/link';
import { Controller } from '@models/controller';
import { LinkService } from '@services/link.service';
import { ToasterService } from '@services/toaster.service';

@Component({
  selector: 'app-resume-link-action',
  templateUrl: './resume-link-action.component.html',
  imports: [MatButtonModule, MatIconModule, MatMenuModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResumeLinkActionComponent {
  private linkService = inject(LinkService);
  private toasterService = inject(ToasterService);
  private cdr = inject(ChangeDetectorRef);

  readonly controller = input<Controller>(undefined);
  readonly link = input<Link>(undefined);

  resumeLink() {
    const link = this.link();
    link.suspend = false;
    this.linkService.updateLink(this.controller(), link).subscribe({
        next: () => {},
        error: (err) => {
          const message = err.error?.message || err.message || 'Failed to resume link';
          this.toasterService.error(message);
          this.cdr.markForCheck();
        },
      });
  }
}
