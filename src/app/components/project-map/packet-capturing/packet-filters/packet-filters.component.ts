import { ChangeDetectionStrategy, Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { Filter } from '@models/filter';
import { FilterDescription } from '@models/filter-description';
import { Link } from '@models/link';
import { Message } from '@models/message';
import { Project } from '@models/project';
import { Controller } from '@models/controller';
import { LinkService } from '@services/link.service';
import { HelpDialogComponent } from '../../help-dialog/help-dialog.component';
import { DialogConfigService } from '@services/dialog-config.service';

@Component({
  selector: 'app-packet-filters',
  templateUrl: './packet-filters.component.html',
  styleUrl: './packet-filters.component.scss',
  imports: [
    CommonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatTabsModule,
    MatButtonModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PacketFiltersDialogComponent implements OnInit {
  private dialogRef = inject(MatDialogRef<PacketFiltersDialogComponent>);
  private linkService = inject(LinkService);
  private dialog = inject(MatDialog);
  private dialogConfig = inject(DialogConfigService);
  private cdr = inject(ChangeDetectorRef);

  controller: Controller;
  project: Project;
  link: Link;
  filters: Filter;
  availableFilters: FilterDescription[];

  constructor() {}

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
      this.cdr.markForCheck();
    });

    this.linkService
      .getAvailableFilters(this.controller, this.link)
      .subscribe((availableFilters: FilterDescription[]) => {
        this.availableFilters = availableFilters;
        this.cdr.markForCheck();
      });
  }

  onFrequencyDropChange(value: number) {
    this.filters.frequency_drop[0] = value;
    this.cdr.markForCheck();
  }

  onPacketLossChange(value: number) {
    this.filters.packet_loss[0] = value;
    this.cdr.markForCheck();
  }

  onDelayLatencyChange(value: number) {
    this.filters.delay[0] = value;
    this.cdr.markForCheck();
  }

  onDelayJitterChange(value: number) {
    this.filters.delay[1] = value;
    this.cdr.markForCheck();
  }

  onCorruptChange(value: number) {
    this.filters.corrupt[0] = value;
    this.cdr.markForCheck();
  }

  onBpfChange(value: string) {
    this.filters.bpf[0] = value;
    this.cdr.markForCheck();
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
    const dialogConfig = this.dialogConfig.openConfig('helpDialog', {
      autoFocus: false,
      disableClose: true,
    });
    const dialogRef = this.dialog.open(HelpDialogComponent, dialogConfig);
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
