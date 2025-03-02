import { Component, Input, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Node } from '../../../../../cartography/models/node';
import { Controller } from '@models/controller';
import { ChangeHostnameDialogComponent } from '../../../change-hostname-dialog/change-hostname-dialog.component';

@Component({
  selector: 'app-change-hostname-action',
  templateUrl: './change-hostname-action.component.html',
})
export class ChangeHostnameActionComponent implements OnInit {
  @Input() controller: Controller;
  @Input() node: Node;

  constructor(private dialog: MatDialog) {}

  ngOnInit() {}

  changeHostname() {
    const dialogRef = this.dialog.open(ChangeHostnameDialogComponent, {
      autoFocus: false,
      disableClose: true,
    });
    let instance = dialogRef.componentInstance;
    instance.controller = this.controller;
    instance.node = this.node;
  }
}
