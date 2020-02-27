import { Component, OnInit, Input } from '@angular/core';
import { Server } from '../../../../../models/server';
import { Node } from '../../../../../cartography/models/node';
import { MatDialog } from '@angular/material';
import { ChangeSymbolDialogComponent } from '../../../change-symbol-dialog/change-symbol-dialog.component';

@Component({
  selector: 'app-change-symbol-action',
  templateUrl: './change-symbol-action.component.html'
})
export class ChangeSymbolActionComponent implements OnInit {
  @Input() server: Server;
  @Input() node: Node;

  constructor(private dialog: MatDialog) {}

  ngOnInit() {}

  changeSymbol() {
    const dialogRef = this.dialog.open(ChangeSymbolDialogComponent, {
        width: '1000px',
        height: '500px',
        autoFocus: false,
        disableClose: true
      });
      let instance = dialogRef.componentInstance;
      instance.server = this.server;
      instance.node = this.node;
  }
}
