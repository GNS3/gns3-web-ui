import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {MatDialog} from "@angular/material";
import {ApplianceListDialogComponent} from "./appliance-list-dialog/appliance-list-dialog.component";

import {Server} from "../../models/server";
import {Appliance} from "../../models/appliance";

@Component({
  selector: 'app-appliance',
  templateUrl: './appliance.component.html',
  styleUrls: ['./appliance.component.scss']
})
export class ApplianceComponent implements OnInit {
  @Input() server: Server;
  @Output() onNodeCreation = new EventEmitter<any>();

  constructor(private dialog: MatDialog) { }

  ngOnInit() {}

  listAppliancesModal() {
    const dialogRef = this.dialog.open(ApplianceListDialogComponent, {
      width: '600px',
      height: '560px',
      data: {
        'server': this.server
      }
    });

    dialogRef.afterClosed().subscribe((appliance: Appliance) => {
      if (appliance !== null) {
        this.onNodeCreation.emit(appliance);
      }
    });
  }
}
