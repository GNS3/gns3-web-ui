import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialog } from '@angular/material/dialog';
import { Node } from '../../../../../cartography/models/node';
import { Controller } from '@models/controller';
import { InfoDialogComponent, InfoDialogData } from '../../../info-dialog/info-dialog.component';

@Component({
  selector: 'app-show-node-action',
  templateUrl: './show-node-action.component.html',
  imports: [MatButtonModule, MatIconModule, MatMenuModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShowNodeActionComponent {
  private dialog = inject(MatDialog);

  readonly node = input<Node>(undefined);
  readonly controller = input<Controller>(undefined);

  showNode() {
    this.dialog.open(InfoDialogComponent, {
      panelClass: [
        'base-dialog-panel',
        'show-node-action-dialog-panel',
        'dialog-small-panel',
        'dialog-height-60-panel',
      ],
      autoFocus: false,
      data: { node: this.node(), controller: this.controller() } satisfies InfoDialogData,
    });
  }
}
