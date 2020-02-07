import { Component, Input, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material';
import { Node } from '../../../../../cartography/models/node';
import { Server } from '../../../../../models/server';
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
        autoFocus: false
      });
      const instance = dialogRef.componentInstance;
      instance.server = this.server;
      instance.node = this.node;
  }
}
