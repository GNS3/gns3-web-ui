import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialog } from '@angular/material/dialog';
import { Node } from '../../../../../cartography/models/node';
import { Project } from '@models/project';
import { Controller } from '@models/controller';
import { ConfigEditorDialogComponent } from '../../../node-editors/config-editor/config-editor.component';

@Component({
  selector: 'app-edit-config-action',
  templateUrl: './edit-config-action.component.html',
  imports: [MatButtonModule, MatIconModule, MatMenuModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditConfigActionComponent {
  private dialog = inject(MatDialog);

  readonly controller = input<Controller>(undefined);
  readonly project = input<Project>(undefined);
  readonly node = input<Node>(undefined);

  editConfig() {
    const dialogRef = this.dialog.open(ConfigEditorDialogComponent, {
      panelClass: ['base-dialog-panel', 'edit-config-action-dialog-panel'],
      autoFocus: false,
      disableClose: false,
    });
    let instance = dialogRef.componentInstance;
    instance.controller = this.controller();
    instance.project = this.project();
    instance.node = this.node();
  }
}
