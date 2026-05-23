import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { Link } from '@models/link';
import { Controller } from '@models/controller';
import { LinkService } from '@services/link.service';
import { ToasterService } from '@services/toaster.service';
import { MapLinksDataSource } from '../../../../../cartography/datasources/map-datasource';
import { LinksDataSource } from '../../../../../cartography/datasources/links-datasource';

@Component({
  selector: 'app-toggle-show-filters-icon-action',
  templateUrl: './toggle-show-filters-icon-action.component.html',
  imports: [MatIconModule, MatMenuModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToggleShowFiltersIconActionComponent {
  private linkService = inject(LinkService);
  private toasterService = inject(ToasterService);
  private linksDataSource = inject(LinksDataSource);
  private mapLinksDataSource = inject(MapLinksDataSource);

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
        // Update LinksDataSource for data consistency
        this.linksDataSource.update(updatedLink);
        // Update MapLinksDataSource to trigger LinkWidget icon update
        const mapLink = this.mapLinksDataSource.get(updatedLink.link_id);
        if (mapLink) {
          mapLink.show_filters_icon = newValue;
          this.mapLinksDataSource.update(mapLink);
        }
      },
      error: (err) => {
        const message = err.error?.message || err.message || 'Failed to toggle filter icon visibility';
        this.toasterService.error(message);
      },
    });
  }
}
