import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { Link } from '@models/link';
import { Controller } from '@models/controller';
import { LinkService } from '@services/link.service';

@Component({
  standalone: true,
  selector: 'app-suspend-link-action',
  templateUrl: './suspend-link-action.component.html',
  imports: [MatButtonModule, MatIconModule, MatMenuModule],
  // TODO: This component has been partially migrated to be zoneless-compatible.
  // After testing, this should be updated to ChangeDetectionStrategy.OnPush.
  changeDetection: ChangeDetectionStrategy.Default,
})
export class SuspendLinkActionComponent {
  private linkService = inject(LinkService);

  readonly controller = input<Controller>(undefined);
  readonly link = input<Link>(undefined);

  suspendLink() {
    const link = this.link();
    link.suspend = true;
    this.linkService.updateLink(this.controller(), link).subscribe(() => {});
  }
}
