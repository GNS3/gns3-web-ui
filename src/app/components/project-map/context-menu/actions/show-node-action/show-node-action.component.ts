import { Component, Input, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialog } from '@angular/material/dialog';
import { Node } from '../../../../../cartography/models/node';
import { Controller } from '@models/controller';
import { InfoDialogComponent } from '../../../info-dialog/info-dialog.component';

@Component({
  standalone: true,
  selector: 'app-show-node-action',
  templateUrl: './show-node-action.component.html',
  imports: [MatButtonModule, MatIconModule, MatMenuModule],
})
export class ShowNodeActionComponent {
  private dialog = inject(MatDialog);

  @Input() node: Node;
  @Input() controller: Controller;

  showNode() {
    const dialogRef = this.dialog.open(InfoDialogComponent, {
      width: '600px',
      maxHeight: '600px',
      autoFocus: false,
      disableClose: true,
    });
    let instance = dialogRef.componentInstance;
    instance.node = this.node;
    instance.controller = this.controller;
  }
}
