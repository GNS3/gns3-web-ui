import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
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
  // TODO: This component has been partially migrated to be zoneless-compatible.
  // After testing, this should be updated to ChangeDetectionStrategy.OnPush.
  changeDetection: ChangeDetectionStrategy.Default,
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
      disableClose: true,
    });
    let instance = dialogRef.componentInstance;
    instance.node = this.node();
    instance.controller = this.controller();
  }
}
