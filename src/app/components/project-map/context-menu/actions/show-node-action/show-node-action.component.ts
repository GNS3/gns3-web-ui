import { Component, Input, OnChanges, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material';
import { Node } from '../../../../../cartography/models/node';
import { Server } from '../../../../../models/server';
import { InfoDialogComponent } from '../../../info-dialog/info-dialog.component';

@Component({
  selector: 'app-show-node-action',
  templateUrl: './show-node-action.component.html'
})
export class ShowNodeActionComponent {
  @Input() node: Node;
  @Input() server: Server;

  constructor(private dialog: MatDialog) {}

  showNode() {
    const dialogRef = this.dialog.open(InfoDialogComponent, {
        width: '600px',
        autoFocus: false
    });
    const instance = dialogRef.componentInstance;
    instance.node = this.node;
    instance.server = this.server;
  }
}
