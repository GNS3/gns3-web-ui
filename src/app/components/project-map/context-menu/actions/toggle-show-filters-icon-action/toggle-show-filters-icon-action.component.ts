import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { Link } from '@models/link';
import { Controller } from '@models/controller';
import { LinkService } from '@services/link.service';
import { ToasterService } from '@services/toaster.service';

@Component({
  selector: 'app-toggle-show-filters-icon-action',
  templateUrl: './toggle-show-filters-icon-action.component.html',
  imports: [MatIconModule, MatMenuModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToggleShowFiltersIconActionComponent {
  private linkService = inject(LinkService);
  private toasterService = inject(ToasterService);

  readonly controller = input<Controller>(undefined);
  readonly link = input<Link>(undefined);

  // Local signal to track the current state
  readonly showFiltersIcon = signal<boolean>(true);

  ngOnInit() {
    // Initialize with the link's current value
    this.showFiltersIcon.set(this.link()?.show_filters_icon ?? true);
  }

  toggleShowFiltersIcon() {
    const link = this.link();
    const currentValue = this.showFiltersIcon();
    const newValue = !currentValue;

    this.linkService.updateLink(this.controller(), { ...link, show_filters_icon: newValue }).subscribe({
      next: (updatedLink) => {
        // Update the local signal with the server response
        this.showFiltersIcon.set(updatedLink.show_filters_icon !== undefined ? updatedLink.show_filters_icon : newValue);
      },
      error: (err) => {
        const message = err.error?.message || err.message || 'Failed to toggle filter icon visibility';
        this.toasterService.error(message);
      },
    });
  }
}
