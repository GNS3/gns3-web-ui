import { ChangeDetectionStrategy, Component, OnInit, inject, input } from '@angular/core';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { Drawing } from '../../../../../cartography/models/drawing';
import { Label } from '../../../../../cartography/models/label';
import { Node } from '../../../../../cartography/models/node';
import { Link } from '@models/link';
import { LinkNode } from '@models/link-node';
import { Project } from '@models/project';
import { Controller } from '@models/controller';
import { TextEditorDialogComponent } from '../../../drawings-editors/text-editor/text-editor.component';

@Component({
  selector: 'app-edit-text-action',
  templateUrl: './edit-text-action.component.html',
  imports: [MatDialogModule, MatIconModule, MatMenuModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditTextActionComponent implements OnInit {
  private dialog = inject(MatDialog);

  readonly controller = input<Controller>(undefined);
  readonly project = input<Project>(undefined);
  readonly drawing = input<Drawing>(undefined);
  readonly node = input<Node>(undefined);
  readonly label = input<Label>(undefined);
  readonly link = input<Link>(undefined);
  readonly linkNode = input<LinkNode>(undefined);

  constructor() {}

  ngOnInit() {}

  editText() {
    const dialogRef = this.dialog.open(TextEditorDialogComponent, {
      panelClass: ['base-dialog-panel', 'edit-text-action-dialog-panel'],
      autoFocus: false,
      disableClose: false,
    });
    let instance = dialogRef.componentInstance;
    instance.controller = this.controller();
    instance.project = this.project();
    instance.drawing = this.drawing();
    instance.node = this.node();
    instance.label = this.label();
    instance.link = this.link();
    instance.linkNode = this.linkNode();
  }
}
