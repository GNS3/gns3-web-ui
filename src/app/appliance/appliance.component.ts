import {Component, Input, OnInit} from '@angular/core';
import {MatDialog} from "@angular/material";
import {ApplianceListDialogComponent} from "./appliance-list-dialog/appliance-list-dialog.component";

import {Server} from "../shared/models/server";

@Component({
  selector: 'app-appliance',
  templateUrl: './appliance.component.html',
  styleUrls: ['./appliance.component.scss']
})
export class ApplianceComponent implements OnInit {
  @Input() server: Server;


  constructor(private dialog: MatDialog) { }

  ngOnInit() {}

  listAppliancesModal() {
    const dialogRef = this.dialog.open(ApplianceListDialogComponent, {
      width: '600px',
      data: {
        'server': this.server
      }
    });

    dialogRef.afterClosed().subscribe(() => {

    });
  }
}

