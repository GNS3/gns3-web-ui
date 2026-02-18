import { Component, Input } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Node } from '../../../../../cartography/models/node';
import { Controller } from '@models/controller';
import { IdlePCDialogComponent } from "@components/project-map/context-menu/dialogs/idle-pc-dialog/idle-pc-dialog.component";
import { NodeService } from "@services/node.service";

@Component({
  selector: 'app-idle-pc-action',
  templateUrl: './idle-pc-action.component.html',
})
export class IdlePcActionComponent {
  @Input() controller: Controller;
  @Input() node: Node;

  constructor(private nodeService: NodeService, private dialog: MatDialog) {}

  idlePC() {
    const dialogRef = this.dialog.open(IdlePCDialogComponent, {
      width: '500px',
      autoFocus: false,
      disableClose: true,
    });
    let instance = dialogRef.componentInstance;
    instance.controller = this.controller;
    instance.node = this.node;
  }
}
