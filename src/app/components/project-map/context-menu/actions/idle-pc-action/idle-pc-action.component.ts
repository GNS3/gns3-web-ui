import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialog } from '@angular/material/dialog';
import { Node } from '../../../../../cartography/models/node';
import { Controller } from '@models/controller';
import { IdlePCDialogComponent } from '@components/project-map/context-menu/dialogs/idle-pc-dialog/idle-pc-dialog.component';
import { NodeService } from '@services/node.service';

@Component({
  standalone: true,
  selector: 'app-idle-pc-action',
  templateUrl: './idle-pc-action.component.html',
  imports: [CommonModule, MatButtonModule, MatIconModule, MatMenuModule],
  // TODO: This component has been partially migrated to be zoneless-compatible.
  // After testing, this should be updated to ChangeDetectionStrategy.OnPush.
  changeDetection: ChangeDetectionStrategy.Default,
})
export class IdlePcActionComponent {
  private nodeService = inject(NodeService);
  private dialog = inject(MatDialog);

  readonly controller = input<Controller>(undefined);
  readonly node = input<Node>(undefined);

  idlePC() {
    const dialogRef = this.dialog.open(IdlePCDialogComponent, {
      width: '500px',
      autoFocus: false,
      disableClose: true,
    });
    let instance = dialogRef.componentInstance;
    instance.controller = this.controller();
    instance.node = this.node();
  }
}
