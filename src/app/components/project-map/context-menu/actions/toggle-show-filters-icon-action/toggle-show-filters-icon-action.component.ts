import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
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

  // Read from data source (source of truth)
  get showFiltersIcon(): boolean {
    const link = this.link();
    if (!link) return true;

    // Always read from data source to get the latest state
    const currentLink = this.linksDataSource.get(link.link_id);
    return currentLink?.show_filters_icon ?? true;
  }

  toggleShowFiltersIcon() {
    const link = this.link();
    if (!link) return;

    const currentValue = this.showFiltersIcon;
    const newValue = !currentValue;

    this.linkService.updateLink(this.controller(), { ...link, show_filters_icon: newValue }).subscribe({
      next: (updatedLink) => {
        // Update data sources (this triggers LinksDataSource.itemChanged)
        this.linksDataSource.update(updatedLink);
        const mapLink = this.mapLinksDataSource.get(updatedLink.link_id);
        if (mapLink) {
          mapLink.show_filters_icon = updatedLink.show_filters_icon;
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
