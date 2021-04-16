import { Component, Input } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Link } from '../../../../../models/link';
import { Project } from '../../../../../models/project';
import { Server } from '../../../../../models/server';
import { PacketFiltersDialogComponent } from '../../../packet-capturing/packet-filters/packet-filters.component';

@Component({
  selector: 'app-packet-filters-action',
  templateUrl: './packet-filters-action.component.html',
})
export class PacketFiltersActionComponent {
  @Input() server: Server;
  @Input() project: Project;
  @Input() link: Link;

  constructor(private dialog: MatDialog) {}

  openPacketFilters() {
    const dialogRef = this.dialog.open(PacketFiltersDialogComponent, {
      width: '900px',
      height: '400px',
      autoFocus: false,
      disableClose: true,
    });
    let instance = dialogRef.componentInstance;
    instance.server = this.server;
    instance.project = this.project;
    instance.link = this.link;
  }
}
