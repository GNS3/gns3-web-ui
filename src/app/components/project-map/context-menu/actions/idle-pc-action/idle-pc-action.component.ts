import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialog } from '@angular/material/dialog';
import { Node } from '../../../../../cartography/models/node';
import { Controller } from '@models/controller';
import { IdlePCDialogComponent } from "@components/project-map/context-menu/dialogs/idle-pc-dialog/idle-pc-dialog.component";
import { NodeService } from "@services/node.service";

@Component({
  standalone: true,
  selector: 'app-idle-pc-action',
  templateUrl: './idle-pc-action.component.html',
  imports: [CommonModule, MatButtonModule, MatIconModule, MatMenuModule],
})
export class IdlePcActionComponent {
  private nodeService = inject(NodeService);
  private dialog = inject(MatDialog);

  @Input() controller: Controller;
  @Input() node: Node;

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
