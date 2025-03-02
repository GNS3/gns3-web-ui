import { Component, Input, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Node } from '../../../../../cartography/models/node';
import { Controller } from '../../../../../models/controller';
import { ChangeSymbolDialogComponent } from '../../../change-symbol-dialog/change-symbol-dialog.component';

@Component({
  selector: 'app-change-symbol-action',
  templateUrl: './change-symbol-action.component.html',
})
export class ChangeSymbolActionComponent implements OnInit {
  @Input() controller: Controller;
  @Input() node: Node;

  constructor(private dialog: MatDialog) {}

  ngOnInit() {}

  changeSymbol() {
    const dialogRef = this.dialog.open(ChangeSymbolDialogComponent, {
      width: '1000px',
      height: '500px',
      autoFocus: false,
      disableClose: true,
    });
    let instance = dialogRef.componentInstance;
    instance.controller = this.controller;
    instance.node = this.node;
  }
}
