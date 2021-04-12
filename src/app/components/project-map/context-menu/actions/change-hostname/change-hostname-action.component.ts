import { Component, Input, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Node } from '../../../../../cartography/models/node';
import { Server } from '../../../../../models/server';
import { ChangeHostnameDialogComponent } from '../../../change-hostname-dialog/change-hostname-dialog.component';

@Component({
  selector: 'app-change-hostname-action',
  templateUrl: './change-hostname-action.component.html',
})
export class ChangeHostnameActionComponent implements OnInit {
  @Input() server: Server;
  @Input() node: Node;

  constructor(private dialog: MatDialog) {}

  ngOnInit() {}

  changeHostname() {
    const dialogRef = this.dialog.open(ChangeHostnameDialogComponent, {
      autoFocus: false,
      disableClose: true,
    });
    let instance = dialogRef.componentInstance;
    instance.server = this.server;
    instance.node = this.node;
  }
}
