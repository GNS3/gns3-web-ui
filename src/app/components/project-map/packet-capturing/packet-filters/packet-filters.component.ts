import { Component, OnInit } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Filter } from '../../../../models/filter';
import { FilterDescription } from '../../../../models/filter-description';
import { Link } from '../../../../models/link';
import { Message } from '../../../../models/message';
import { Project } from '../../../../models/project';
import { Server } from '../../../../models/server';
import { LinkService } from '../../../../services/link.service';
import { HelpDialogComponent } from '../../help-dialog/help-dialog.component';

@Component({
  selector: 'app-packet-filters',
  templateUrl: './packet-filters.component.html',
  styleUrls: ['./packet-filters.component.scss'],
})
export class PacketFiltersDialogComponent implements OnInit {
  controller: Server;
  project: Project;
  link: Link;
  filters: Filter;
  availableFilters: FilterDescription[];

  constructor(
    private dialogRef: MatDialogRef<PacketFiltersDialogComponent>,
    private linkService: LinkService,
    private dialog: MatDialog
  ) {}

  ngOnInit() {
    this.linkService.getLink(this.controller, this.link.project_id, this.link.link_id).subscribe((link: Link) => {
      this.link = link;
      this.filters = {
        bpf: [],
        corrupt: [0],
        delay: [0, 0],
        frequency_drop: [0],
        packet_loss: [0],
      };

      if (this.link.filters) {
        this.filters.bpf = this.link.filters.bpf ? this.link.filters.bpf : [];
        this.filters.corrupt = this.link.filters.corrupt ? this.link.filters.corrupt : [0];
        this.filters.delay = this.link.filters.delay ? this.link.filters.delay : [0, 0];
        this.filters.frequency_drop = this.link.filters.frequency_drop ? this.link.filters.frequency_drop : [0];
        this.filters.packet_loss = this.link.filters.packet_loss ? this.link.filters.packet_loss : [0];
      }
    });

    this.linkService.getAvailableFilters(this.controller, this.link).subscribe((availableFilters: FilterDescription[]) => {
      this.availableFilters = availableFilters;
    });
  }

  onNoClick() {
    this.dialogRef.close();
  }

  onResetClick() {
    this.link.filters = {
      bpf: [],
      corrupt: [0],
      delay: [0, 0],
      frequency_drop: [0],
      packet_loss: [0],
    };

    this.linkService.updateLink(this.controller, this.link).subscribe((link: Link) => {
      this.dialogRef.close();
    });
  }

  onYesClick() {
    this.link.filters = this.filters;
    this.linkService.updateLink(this.controller, this.link).subscribe((link: Link) => {
      this.dialogRef.close();
    });
  }

  onHelpClick() {
    const dialogRef = this.dialog.open(HelpDialogComponent, {
      width: '500px',
      autoFocus: false,
      disableClose: true,
    });
    let instance = dialogRef.componentInstance;
    instance.title = 'Help for filters';
    let messages: Message[] = [];
    this.availableFilters.forEach((filter: FilterDescription) => {
      messages.push({
        name: filter.name,
        description: filter.description,
      });
    });
    instance.messages = messages;
  }
}
