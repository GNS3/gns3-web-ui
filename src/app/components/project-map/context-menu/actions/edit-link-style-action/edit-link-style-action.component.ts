import { ChangeDetectionStrategy, Component, OnChanges, inject, input } from '@angular/core';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { Link } from '@models/link';
import { Project } from '@models/project';
import { Controller } from '@models/controller';
import { LinkStyleEditorDialogComponent } from '../../../drawings-editors/link-style-editor/link-style-editor.component';
import { DialogConfigService } from '@services/dialog-config.service';

@Component({
  selector: 'app-edit-link-style-action',
  templateUrl: './edit-link-style-action.component.html',
  imports: [MatDialogModule, MatIconModule, MatMenuModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditLinkStyleActionComponent implements OnChanges {
  private dialog = inject(MatDialog);
  private dialogConfig = inject(DialogConfigService);

  readonly controller = input<Controller>(undefined);
  readonly project = input<Project>(undefined);
  readonly link = input<Link>(undefined);

  constructor() {}

  ngOnChanges() {}

  editStyle() {
    const dialogConfig = this.dialogConfig.openConfig('linkStyleEditor', {
      autoFocus: false,
      disableClose: false,
    });
    const dialogRef = this.dialog.open(LinkStyleEditorDialogComponent, dialogConfig);
    let instance = dialogRef.componentInstance;
    instance.controller = this.controller();
    instance.project = this.project();
    instance.link = this.link();
  }
}
