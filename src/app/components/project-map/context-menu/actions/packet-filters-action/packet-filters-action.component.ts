import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialog } from '@angular/material/dialog';
import { Link } from '@models/link';
import { Project } from '@models/project';
import { Controller } from '@models/controller';
import { PacketFiltersDialogComponent } from '../../../packet-capturing/packet-filters/packet-filters.component';

@Component({
  standalone: true,
  selector: 'app-packet-filters-action',
  templateUrl: './packet-filters-action.component.html',
  imports: [MatButtonModule, MatIconModule, MatMenuModule],
  // TODO: This component has been partially migrated to be zoneless-compatible.
  // After testing, this should be updated to ChangeDetectionStrategy.OnPush.
  changeDetection: ChangeDetectionStrategy.Default,
})
export class PacketFiltersActionComponent {
  private dialog = inject(MatDialog);

  readonly controller = input<Controller>(undefined);
  readonly project = input<Project>(undefined);
  readonly link = input<Link>(undefined);

  openPacketFilters() {
    const dialogRef = this.dialog.open(PacketFiltersDialogComponent, {
      width: '900px',
      height: '400px',
      autoFocus: false,
      disableClose: true,
    });
    let instance = dialogRef.componentInstance;
    instance.controller = this.controller();
    instance.project = this.project();
    instance.link = this.link();
  }
}
