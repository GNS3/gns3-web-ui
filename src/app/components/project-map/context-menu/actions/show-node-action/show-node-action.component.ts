import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialog } from '@angular/material/dialog';
import { Node } from '../../../../../cartography/models/node';
import { Controller } from '@models/controller';
import { InfoDialogComponent } from '../../../info-dialog/info-dialog.component';

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
    const dialogRef = this.dialog.open(InfoDialogComponent, {
      width: '600px',
      maxHeight: '600px',
      autoFocus: false,
      disableClose: false,
    });
    let instance = dialogRef.componentInstance;
    instance.node = this.node();
    instance.controller = this.controller();
  }
}
