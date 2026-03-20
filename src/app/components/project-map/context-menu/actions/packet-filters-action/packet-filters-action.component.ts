import { Component, Input, inject } from '@angular/core';
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
})
export class PacketFiltersActionComponent {
  private dialog = inject(MatDialog);

  @Input() controller: Controller;
  @Input() project: Project;
  @Input() link: Link;

  openPacketFilters() {
    const dialogRef = this.dialog.open(PacketFiltersDialogComponent, {
      width: '900px',
      height: '400px',
      autoFocus: false,
      disableClose: true,
    });
    let instance = dialogRef.componentInstance;
    instance.controller = this.controller;
    instance.project = this.project;
    instance.link = this.link;
  }
}
