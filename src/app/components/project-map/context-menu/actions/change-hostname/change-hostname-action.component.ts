import { Component, OnInit, Input } from '@angular/core';
import { Server } from '../../../../../models/server';
import { Node } from '../../../../../cartography/models/node';
import { MatDialog } from '@angular/material';
import { ChangeHostnameDialogComponent } from '../../../change-hostname-dialog/change-hostname-dialog.component';

@Component({
  selector: 'app-change-hostname-action',
  templateUrl: './change-hostname-action.component.html'
})
export class ChangeHostnameActionComponent implements OnInit {
  @Input() server: Server;
  @Input() node: Node;

  constructor(private dialog: MatDialog) {}

  ngOnInit() {}

  changeHostname() {
    const dialogRef = this.dialog.open(ChangeHostnameDialogComponent, {
        autoFocus: false,
        disableClose: true
      });
      let instance = dialogRef.componentInstance;
      instance.server = this.server;
      instance.node = this.node;
  }
}
