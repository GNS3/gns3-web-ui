import { Component, Input, OnInit, OnChanges } from '@angular/core';
import { Node } from '../../../../../cartography/models/node';
import { MatDialog } from '@angular/material/dialog';
import { InfoDialogComponent } from '../../../info-dialog/info-dialog.component';
import { Server } from '../../../../../models/server';

@Component({
  selector: 'app-show-node-action',
  templateUrl: './show-node-action.component.html'
})
export class ShowNodeActionComponent {
  @Input() node: Node;
  @Input() server: Server

  constructor(private dialog: MatDialog) {}

  showNode() {
    const dialogRef = this.dialog.open(InfoDialogComponent, {
        width: '600px',
        autoFocus: false
    });
    let instance = dialogRef.componentInstance;
    instance.node = this.node;
    instance.server = this.server;
  }
}
