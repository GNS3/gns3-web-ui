import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialog } from '@angular/material/dialog';
import { Link } from '@models/link';
import { Project } from '@models/project';
import { Controller } from '@models/controller';
import { PacketFiltersDialogComponent } from '../../../packet-capturing/packet-filters/packet-filters.component';
import { DialogConfigService } from '@services/dialog-config.service';

@Component({
  selector: 'app-packet-filters-action',
  templateUrl: './packet-filters-action.component.html',
  imports: [MatButtonModule, MatIconModule, MatMenuModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PacketFiltersActionComponent {
  private dialog = inject(MatDialog);
  private dialogConfig = inject(DialogConfigService);

  readonly controller = input<Controller>(undefined);
  readonly project = input<Project>(undefined);
  readonly link = input<Link>(undefined);

  openPacketFilters() {
    const dialogConfig = this.dialogConfig.openConfig('packetFilters', {
      autoFocus: false,
      disableClose: false,
    });
    const dialogRef = this.dialog.open(PacketFiltersDialogComponent, dialogConfig);
    let instance = dialogRef.componentInstance;
    instance.controller = this.controller();
    instance.project = this.project();
    instance.link = this.link();
  }
}
